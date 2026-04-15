/**
 * County Finance — Receipt Scanner
 * Direct Anthropic Claude Vision API (replacing Manus Forge AI Proxy)
 *
 * Scans receipt images/PDFs and extracts:
 * - Store name, date, items, totals
 * - Payment method
 * - Tax information
 *
 * Model: Claude Sonnet 4.6 (has vision + structured output)
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { Express, Request, Response } from "express";
import multer from "multer";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";

// ── Receipt Schema ──

const ReceiptItemSchema = z.object({
  name: z.string().describe("Nama item/produk"),
  quantity: z.number().describe("Jumlah item"),
  unitPrice: z.number().describe("Harga satuan dalam Rupiah"),
  totalPrice: z.number().describe("Total harga item (qty x unitPrice)"),
});

const ReceiptSchema = z.object({
  storeName: z.string().describe("Nama toko/merchant"),
  date: z.string().describe("Tanggal transaksi (YYYY-MM-DD)"),
  items: z.array(ReceiptItemSchema).describe("Daftar item yang dibeli"),
  subtotal: z.number().describe("Subtotal sebelum pajak/diskon"),
  tax: z.number().optional().describe("Pajak jika ada"),
  discount: z.number().optional().describe("Diskon jika ada"),
  total: z.number().describe("Total pembayaran"),
  paymentMethod: z
    .enum(["tunai", "debit", "kredit", "ewallet", "transfer", "unknown"])
    .describe("Metode pembayaran"),
  category: z
    .string()
    .describe("Kategori transaksi (bahan_baku, operasional, marketing, dll)"),
  notes: z.string().optional().describe("Catatan tambahan dari struk"),
});

export type ReceiptData = z.infer<typeof ReceiptSchema>;

// ── Scanner Function ──

export async function scanReceipt(imageBuffer: Buffer, mimeType: string): Promise<ReceiptData> {
  const anthropic = createAnthropic({
    apiKey: ENV.anthropicApiKey,
  });

  const base64Image = imageBuffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const { object } = await generateObject({
    model: anthropic(ENV.aiVisionModel),
    schema: ReceiptSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analisis struk/receipt ini dan ekstrak semua informasi.

Aturan:
- Semua harga dalam Rupiah (tanpa simbol Rp, hanya angka)
- Format tanggal: YYYY-MM-DD
- Jika informasi tidak terlihat jelas, berikan estimasi terbaik
- Kategori: bahan_baku, operasional, marketing, gaji, transportasi, utilitas, perlengkapan, lainnya
- Jika metode pembayaran tidak terlihat, gunakan "unknown"`,
          },
          {
            type: "image",
            image: dataUrl,
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  return object;
}

// ── Express Route ──

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export function registerReceiptRoutes(app: Express) {
  app.post(
    "/api/receipt/scan",
    upload.single("receipt"),
    async (req: Request, res: Response) => {
      if (!ENV.enableReceiptScan) {
        res.status(503).json({ error: "Receipt scanning is disabled" });
        return;
      }

      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: "No receipt image provided" });
          return;
        }

        // 1. Scan receipt with AI Vision
        const receiptData = await scanReceipt(file.buffer, file.mimetype);

        // 2. Upload to R2 storage for record keeping
        const businessId = req.headers["x-business-id"] as string;
        const stored = await storagePut({
          data: file.buffer,
          filename: file.originalname,
          contentType: file.mimetype,
          folder: "receipts",
          businessId,
        });

        res.json({
          receipt: receiptData,
          imageUrl: stored.url,
          imageKey: stored.key,
        });
      } catch (error) {
        console.error("[Receipt Scanner] Error:", error);
        res.status(500).json({ error: "Receipt scanning failed" });
      }
    }
  );
}
