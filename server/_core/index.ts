/**
 * County Finance — Server Entry Point
 * Clean from all Manus dependencies
 *
 * Infrastructure: Express + tRPC + Clerk + R2 + OpenAI
 */

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./env";
import { createContext } from "./context";
import { registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./chat";
import { registerStorageRoutes } from "../storage";
import { registerReceiptRoutes } from "../receiptScanner";
import { registerAIAdvisorRoutes } from "../aiAdvisor";
import { registerScalevWebhookRoutes } from "../scalevWebhook";
// import { appRouter } from "../routers"; // Main tRPC router (keep existing)

const app = express();

// ── Global Middleware ──

// CORS — only allow our domain
app.use(
  cors({
    origin: ENV.nodeEnv === "production"
      ? ["https://county.finance", "https://www.county.finance"]
      : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Clerk authentication middleware (replaces Manus SDK)
app.use(clerkMiddleware());

// ── Health Check ──

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "county-finance",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: ENV.nodeEnv,
  });
});

// ── Register Routes ──

// Auth routes (Clerk-based)
registerAuthRoutes(app);

// AI routes (Direct OpenAI)
registerChatRoutes(app);
registerAIAdvisorRoutes(app);

// Receipt scanner (Direct OpenAI Vision)
registerReceiptRoutes(app);

// File storage (Cloudflare R2)
registerStorageRoutes(app);

// Payment webhook (Scalev — Indonesian payment link service)
registerScalevWebhookRoutes(app);

// ── tRPC API ──
// Uncomment when router is migrated
// app.use(
//   "/api/trpc",
//   createExpressMiddleware({
//     router: appRouter,
//     createContext,
//     onError: ({ error }) => {
//       if (error.code === "INTERNAL_SERVER_ERROR") {
//         console.error("[tRPC] Internal error:", error.message);
//       }
//     },
//   })
// );

// ── Static Files (Production) ──

if (ENV.nodeEnv === "production") {
  const path = require("path");
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
  ║     AI:      OpenAI Direct ✓             ║
  ║     DB:      MySQL (Railway) ✓           ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
