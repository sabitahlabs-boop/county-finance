/**
 * County Finance — Server Entry Point
 * Clean from all Manus dependencies
 *
 * Infrastructure: Express + tRPC + Clerk + R2 + Anthropic
 */

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clerkMiddleware } from "@clerk/express";
import { ENV } from "./env";
import { registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./chat";
import { registerStorageRoutes } from "../storage";
import { registerReceiptRoutes } from "../receiptScanner";
import { registerAIAdvisorRoutes } from "../aiAdvisor";
import { registerScalevWebhookRoutes } from "../scalevWebhook";

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

// ── Health Check (BEFORE Clerk middleware, so it's always accessible) ──

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "county-finance",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: ENV.nodeEnv,
    hasClerkKey: !!process.env.CLERK_PUBLISHABLE_KEY,
    clerkKeyPrefix: process.env.CLERK_PUBLISHABLE_KEY?.slice(0, 8) ?? "MISSING",
  });
});

// Clerk authentication middleware (replaces Manus SDK)
// Applied AFTER health check so healthcheck works even if Clerk keys are invalid
app.use((req, res, next) => {
  // Skip Clerk for public endpoints
  if (req.path === "/api/health" || req.path.startsWith("/api/scalev/")) {
    return next();
  }
  return clerkMiddleware()(req, res, next);
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
