/**
 * County Finance — AI Chat Module
 * Direct Anthropic Claude API (replacing Manus Forge AI Proxy)
 *
 * Powers the AI financial advisor chat feature
 * Model: Claude Haiku 4.5 (cheap + fast for chat)
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, type CoreMessage } from "ai";
import type { Express, Request, Response } from "express";
import { ENV } from "./env";

// ── Anthropic Client (Direct — no Forge proxy) ──

export function createLLMProvider() {
  return createAnthropic({
    apiKey: ENV.anthropicApiKey,
  });
}

// ── System Prompt ──

const COUNTY_SYSTEM_PROMPT = `Kamu adalah County AI — asisten keuangan cerdas untuk UMKM Indonesia.

Kamu membantu pemilik usaha kecil dan menengah dengan:
- Analisis keuangan (laba rugi, arus kas, margin)
- Saran penghematan biaya dan peningkatan revenue
- Kategorisasi transaksi otomatis
- Perhitungan pajak UMKM (PP23, PPh Final 0.5%)
- Tips manajemen inventori dan stok
- Perencanaan anggaran dan tabungan

Aturan:
- Jawab dalam Bahasa Indonesia yang natural dan mudah dipahami
- Gunakan angka dalam format Rupiah (Rp)
- Berikan saran yang praktis dan actionable
- Jika diminta analisis, gunakan data yang diberikan dalam context
- Jangan berikan saran investasi atau pajak yang membutuhkan konsultan profesional
- Selalu ceria dan supportive — UMKM butuh semangat!`;

// ── Chat Route ──

export function registerChatRoutes(app: Express) {
  app.post("/api/ai/chat", async (req: Request, res: Response) => {
    if (!ENV.enableAI) {
      res.status(503).json({ error: "AI features are disabled" });
      return;
    }

    try {
      const { messages, context } = req.body as {
        messages: CoreMessage[];
        context?: string;
      };

      const anthropic = createLLMProvider();

      // Build system message with optional business context
      let systemMessage = COUNTY_SYSTEM_PROMPT;
      if (context) {
        systemMessage += `\n\nData bisnis user saat ini:\n${context}`;
      }

      const result = streamText({
        model: anthropic(ENV.aiModel),
        system: systemMessage,
        messages,
        maxTokens: 1024,
        temperature: 0.7,
      });

      // Stream response
      result.pipeDataStreamToResponse(res);
    } catch (error) {
      console.error("[AI Chat] Error:", error);
      res.status(500).json({ error: "AI chat failed" });
    }
  });
}
