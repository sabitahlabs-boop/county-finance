/**
 * County Finance — Environment Configuration
 * Clean from all Manus dependencies
 *
 * Required services: Railway MySQL, Clerk Auth, Cloudflare R2, Anthropic, Stripe
 */

function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnvVar(key: string, fallback: string = ""): string {
  return process.env[key] ?? fallback;
}

export const ENV = {
  // ── App ──
  nodeEnv: getOptionalEnvVar("NODE_ENV", "development"),
  port: parseInt(getOptionalEnvVar("PORT", "3000"), 10),
  appUrl: getOptionalEnvVar("APP_URL", "http://localhost:3000"),

  // ── Database (Railway MySQL) ──
  databaseUrl: getEnvVar("DATABASE_URL"),

  // ── Auth (Clerk) ──
  clerkSecretKey: getEnvVar("CLERK_SECRET_KEY"),
  clerkPublishableKey: getEnvVar("CLERK_PUBLISHABLE_KEY"),
  clerkWebhookSecret: getOptionalEnvVar("CLERK_WEBHOOK_SECRET"),

  // ── Storage (Cloudflare R2) ──
  r2AccountId: getEnvVar("R2_ACCOUNT_ID"),
  r2AccessKeyId: getEnvVar("R2_ACCESS_KEY_ID"),
  r2SecretAccessKey: getEnvVar("R2_SECRET_ACCESS_KEY"),
  r2BucketName: getOptionalEnvVar("R2_BUCKET_NAME", "county-assets"),
  r2PublicUrl: getOptionalEnvVar("R2_PUBLIC_URL", ""),

  // ── AI (Anthropic Claude Direct) ──
  anthropicApiKey: getEnvVar("ANTHROPIC_API_KEY"),
  aiModel: getOptionalEnvVar("AI_MODEL", "claude-haiku-4-5-20251001"),
  aiSmartModel: getOptionalEnvVar("AI_SMART_MODEL", "claude-sonnet-4-6"),
  aiVisionModel: getOptionalEnvVar("AI_VISION_MODEL", "claude-sonnet-4-6"),

  // ── Payments (Scalev) ──
  // Scalev is a payment link service — users buy Pro via Scalev payment link,
  // Scalev sends webhook to upgrade account automatically.
  scalevWebhookSecret: getOptionalEnvVar("SCALEV_WEBHOOK_SECRET", ""),
  // ── Admin ──
  adminSecretKey: getEnvVar("ADMIN_SECRET_KEY"),

  // ── Session ──
  jwtSecret: getEnvVar("JWT_SECRET"),

  // ── Feature Flags ──
  enableAI: getOptionalEnvVar("ENABLE_AI", "true") === "true",
  enableReceiptScan: getOptionalEnvVar("ENABLE_RECEIPT_SCAN", "true") === "true",
} as const;

export type Env = typeof ENV;
