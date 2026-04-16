/**
 * County Finance — Server Entry Point
 * Clean from all Manus dependencies
 *
 * Infrastructure: Express + tRPC + Clerk + R2 + Anthropic
 */

import express from "express";
import cors from "cors";
import path from "node:path";
import { clerkMiddleware } from "@clerk/express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { ENV } from "./env";
import { createContext } from "./context";
import { registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./chat";
import { registerStorageRoutes } from "../storage";
import { registerReceiptRoutes } from "../receiptScanner";
import { registerAIAdvisorRoutes } from "../aiAdvisor";
import { registerScalevWebhookRoutes } from "../scalevWebhook";
import { appRouter } from "../routers";

const app = express();

// ── Global Middleware ──

// CORS — only allow our domain
app.use(
  cors({
    origin: ENV.nodeEnv === "production"
      ? [
          "https://county.finance",
          "https://www.county.finance",
          "https://county-finance-production.up.railway.app",
        ]
      : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check (BEFORE Clerk middleware, so it's always accessible) ──

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "county-finance",
    version: "2.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Clerk authentication middleware (replaces Manus SDK)
// Applied AFTER health check so healthcheck works even if Clerk keys are invalid
app.use((req, res, next) => {
  // Skip Clerk for public endpoints
  if (req.path === "/api/health" || req.path.startsWith("/api/scalev/") || req.path === "/api/webhooks/clerk") {
    return next();
  }
  return clerkMiddleware()(req, res, next);
});

// ── Register Routes ──

// Auth routes (Clerk-based)
registerAuthRoutes(app);

// AI routes (Anthropic Claude)
registerChatRoutes(app);
registerAIAdvisorRoutes(app);

// Receipt scanner (Anthropic Claude Vision)
registerReceiptRoutes(app);

// File storage (Cloudflare R2)
registerStorageRoutes(app);

// Payment webhook (Scalev — Indonesian payment link service)
registerScalevWebhookRoutes(app);

// ── tRPC API ──

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC] Internal error at ${path}:`, error.message);
      }
    },
  })
);

// ── Static Files (Production) ──

if (ENV.nodeEnv === "production") {
  const distPath = path.resolve(process.cwd(), "dist/public");

  app.use(express.static(distPath));

  // SPA fallback — serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── Start Server ──

app.listen(ENV.port, "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     County Finance v2.0.0                ║
  ║     ${ENV.nodeEnv.padEnd(36)}║
  ║     http://0.0.0.0:${String(ENV.port).padEnd(21)}║
  ║                                          ║
  ║     Auth:    Clerk ✓                     ║
  ║     Storage: Cloudflare R2 ✓             ║
  ║     AI:      Anthropic Claude ✓           ║
  ║     DB:      MySQL (Railway) ✓           ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
