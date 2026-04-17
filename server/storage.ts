/**
 * County Finance — File Storage Module
 * Cloudflare R2 (S3-compatible) — replacing Manus Forge API Storage
 *
 * Handles:
 * - Product image uploads
 * - Receipt image uploads
 * - Invoice PDF storage
 * - QRIS code images
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";
import { randomUUID } from "crypto";

// ── R2 Client ──

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ENV.r2AccessKeyId,
    secretAccessKey: ENV.r2SecretAccessKey,
  },
});

// ── Upload File ──

interface UploadOptions {
  /** File buffer to upload */
  data: Buffer;
  /** Original filename */
  filename: string;
  /** MIME type (e.g., "image/png", "application/pdf") */
  contentType: string;
  /** Storage folder/prefix (e.g., "receipts", "products", "invoices") */
  folder: string;
  /** Optional business ID for namespacing */
  businessId?: string;
}

interface UploadResult {
  /** Storage key (path in R2) */
  key: string;
  /** Public URL if R2 public access is enabled */
  url: string;
}

export async function storagePut(options: UploadOptions): Promise<UploadResult> {
  const { data, filename, contentType, folder, businessId } = options;

  // Generate unique key: folder/businessId/uuid-filename
  const ext = filename.split(".").pop() ?? "bin";
  const uniqueName = `${randomUUID()}.${ext}`;
  const key = businessId
    ? `${folder}/${businessId}/${uniqueName}`
    : `${folder}/${uniqueName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: key,
      Body: data,
      ContentType: contentType,
    })
  );

  // Construct public URL — use R2 public URL if configured, otherwise use our proxy
  const url = ENV.r2PublicUrl
    ? `${ENV.r2PublicUrl}/${key}`
    : `/api/storage/proxy?key=${encodeURIComponent(key)}`;

  return { key, url };
}

// ── Get Signed Download URL ──

export async function storageGet(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}

// ── Delete File ──

export async function storageDelete(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: key,
    })
  );
}

// ── Express Route Handler (for multer uploads) ──

import type { Express, Request, Response } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

export function registerStorageRoutes(app: Express) {
  // Legacy upload-image endpoint (used by Pengaturan branding, StokProduk, etc.)
  app.post(
    "/api/upload-image",
    upload.single("image"),
    async (req: Request, res: Response) => {
      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: "No image provided" });
          return;
        }

        const result = await storagePut({
          data: file.buffer,
          filename: file.originalname,
          contentType: file.mimetype,
          folder: "images",
          businessId: req.headers["x-business-id"] as string,
        });

        res.json(result);
      } catch (error) {
        console.error("[Storage] Image upload error:", error);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  // Upload file
  app.post(
    "/api/storage/upload",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: "No file provided" });
          return;
        }

        const folder = (req.body.folder as string) ?? "uploads";
        const businessId = req.headers["x-business-id"] as string;

        const result = await storagePut({
          data: file.buffer,
          filename: file.originalname,
          contentType: file.mimetype,
          folder,
          businessId,
        });

        res.json(result);
      } catch (error) {
        console.error("[Storage] Upload error:", error);
        res.status(500).json({ error: "Upload failed" });
      }
    }
  );

  // Get download URL
  app.get("/api/storage/url", async (req: Request, res: Response) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ error: "Key parameter required" });
        return;
      }

      const url = await storageGet(key);
      res.json({ url });
    } catch (error) {
      console.error("[Storage] Get URL error:", error);
      res.status(500).json({ error: "Failed to get URL" });
    }
  });

  // Proxy R2 images — serves images directly via signed URL stream
  // This fixes broken images when R2_PUBLIC_URL is not configured
  app.get("/api/storage/proxy", async (req: Request, res: Response) => {
    try {
      const key = req.query.key as string;
      if (!key) {
        res.status(400).json({ error: "Key parameter required" });
        return;
      }

      const command = new GetObjectCommand({
        Bucket: ENV.r2BucketName,
        Key: key,
      });

      const response = await r2.send(command);
      if (!response.Body) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      // Set proper content type and cache headers
      res.setHeader("Content-Type", response.ContentType || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 24h cache

      // Stream the body
      const bodyStream = response.Body as NodeJS.ReadableStream;
      bodyStream.pipe(res);
    } catch (error) {
      console.error("[Storage] Proxy error:", error);
      res.status(500).json({ error: "Failed to proxy file" });
    }
  });
}
