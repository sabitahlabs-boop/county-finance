/**
 * County Finance — AI Financial Advisor
 * Direct Anthropic Claude API (replacing Manus Forge AI Proxy)
 *
 * Endpoints:
 * - /api/ai/categorize — Auto-categorize transactions (Haiku 4.5 - cheap)
 * - /api/ai/health-score — Financial health analysis (Sonnet 4.6 - smart)
 * - /api/ai/suggestions — Smart cost/revenue suggestions (Sonnet 4.6)
 * - /api/ai/dashboard-summary — Natural language summary (Haiku 4.5)
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";

// ── LLM Provider (Direct Anthropic Claude) ──

function getAnthropic() {
  return createAnthropic({ apiKey: ENV.anthropicApiKey });
}

// Cheap/fast model for simple tasks (categorize, summary)
function getLLM() {
  return getAnthropic()(ENV.aiModel);
}

// Smart model for complex analysis (health score, suggestions)
function getSmartLLM() {
  return getAnthropic()(ENV.aiSmartModel);
}

// ── 1. Auto-Categorize Transaction ──

const CategorySchema = z.object({
  category: z.string().describe("Kategori transaksi"),
  confidence: z.number().min(0).max(1).describe("Tingkat keyakinan 0-1"),
  subcategory: z.string().optional().describe("Sub-kategori jika ada"),
});

async function categorizeTransaction(description: string, amount: number, type: string) {
  const { object } = await generateObject({
    model: getLLM(),
    schema: CategorySchema,
    prompt: `Kategorikan transaksi UMKM Indonesia ini:
Deskripsi: "${description}"
Jumlah: Rp ${amount.toLocaleString("id-ID")}
Tipe: ${type === "pemasukan" ? "Pemasukan" : "Pengeluaran"}

Kategori yang tersedia:
Pemasukan: penjualan, jasa, komisi, investasi, lainnya
Pengeluaran: bahan_baku, operasional, gaji, marketing, transportasi, utilitas, perlengkapan, sewa, pajak, lainnya`,
    temperature: 0.1,
  });
  return object;
}

// ── 2. Financial Health Score ──

const HealthScoreSchema = z.object({
  score: z.number().min(0).max(100).describe("Skor kesehatan keuangan 0-100"),
  grade: z.enum(["A", "B", "C", "D", "F"]).describe("Grade A-F"),
  strengths: z.array(z.string()).describe("Kekuatan keuangan (max 3)"),
  concerns: z.array(z.string()).describe("Hal yang perlu diperhatikan (max 3)"),
  topAction: z.string().describe("Satu aksi paling penting yang harus dilakukan"),
});

async function calculateHealthScore(financialData: Record<string, unknown>) {
  const { object } = await generateObject({
    model: getSmartLLM(),
    schema: HealthScoreSchema,
    prompt: `Analisis kesehatan keuangan UMKM berdasarkan data berikut:
${JSON.stringify(financialData, null, 2)}

Berikan skor 0-100, grade A-F, kekuatan, kekhawatiran, dan satu aksi prioritas.
Jawab dalam Bahasa Indonesia yang mudah dipahami pemilik UMKM.`,
    temperature: 0.3,
  });
  return object;
}

// ── 3. Smart Suggestions ──

const SuggestionsSchema = z.object({
  costSavings: z.array(
    z.object({
      suggestion: z.string(),
      potentialSaving: z.number(),
      difficulty: z.enum(["mudah", "sedang", "sulit"]),
    })
  ).describe("Saran penghematan biaya"),
  revenueGrowth: z.array(
    z.object({
      suggestion: z.string(),
      potentialGain: z.number(),
      timeframe: z.string(),
    })
  ).describe("Saran peningkatan pendapatan"),
});

async function generateSuggestions(financialData: Record<string, unknown>) {
  const { object } = await generateObject({
    model: getSmartLLM(),
    schema: SuggestionsSchema,
    prompt: `Berdasarkan data keuangan UMKM ini, berikan saran konkret:
${JSON.stringify(financialData, null, 2)}

Berikan 2-3 saran penghematan biaya dan 2-3 saran peningkatan revenue.
Semua angka dalam Rupiah. Saran harus praktis untuk UMKM Indonesia.`,
    temperature: 0.4,
  });
  return object;
}

// ── 4. Dashboard Summary ──

async function generateDashboardSummary(kpiData: Record<string, unknown>) {
  const { text } = await generateText({
    model: getLLM(),
    prompt: `Buat ringkasan dashboard keuangan UMKM dalam 2-3 kalimat yang natural:
${JSON.stringify(kpiData, null, 2)}

Format: Paragraf singkat, Bahasa Indonesia, gunakan angka Rupiah dengan format "Rp X,X juta" atau "Rp X ribu".
Contoh: "Bulan ini bisnis kamu menghasilkan Rp 15,2 juta dengan margin 42%. Ada peningkatan 8% dari bulan lalu!"`,
    temperature: 0.5,
    maxTokens: 200,
  });
  return text;
}

// ── Express Routes ──

export function registerAIAdvisorRoutes(app: Express) {
  if (!ENV.enableAI) {
    console.log("[AI Advisor] AI features disabled, skipping route registration");
    return;
  }

  // Auto-categorize
  app.post("/api/ai/categorize", async (req: Request, res: Response) => {
    try {
      const { description, amount, type } = req.body;
      const result = await categorizeTransaction(description, amount, type);
      res.json(result);
    } catch (error) {
      console.error("[AI Categorize] Error:", error);
      res.status(500).json({ error: "Categorization failed" });
    }
  });

  // Health score
  app.post("/api/ai/health-score", async (req: Request, res: Response) => {
    try {
      const result = await calculateHealthScore(req.body);
      res.json(result);
    } catch (error) {
      console.error("[AI Health Score] Error:", error);
      res.status(500).json({ error: "Health score calculation failed" });
    }
  });

  // Suggestions
  app.post("/api/ai/suggestions", async (req: Request, res: Response) => {
    try {
      const result = await generateSuggestions(req.body);
      res.json(result);
    } catch (error) {
      console.error("[AI Suggestions] Error:", error);
      res.status(500).json({ error: "Suggestion generation failed" });
    }
  });

  // Dashboard summary
  app.post("/api/ai/dashboard-summary", async (req: Request, res: Response) => {
    try {
      const text = await generateDashboardSummary(req.body);
      res.json({ summary: text });
    } catch (error) {
      console.error("[AI Summary] Error:", error);
      res.status(500).json({ error: "Summary generation failed" });
    }
  });
}
