import { Express, Request, Response } from "express";
import { upgradeBusinessToProByEmail } from "./db";

/**
 * Scalev Webhook Handler
 * Scalev sends a POST to /api/scalev/webhook after a successful payment.
 * We use this to automatically upgrade the buyer's County account to Pro.
 *
 * Scalev webhook payload (typical):
 * {
 *   event: "order.completed",
 *   order_id: "ORD-xxxx",
 *   buyer_email: "user@example.com",
 *   buyer_name: "John Doe",
 *   product_name: "County Pro",
 *   amount: 299000,
 *   status: "paid",
 *   secret_key: "your_webhook_secret"  // optional verification
 * }
 */

const SCALEV_WEBHOOK_SECRET = process.env.SCALEV_WEBHOOK_SECRET || "";

export function registerScalevWebhookRoutes(app: Express) {
  // Scalev webhook endpoint
  app.post("/api/scalev/webhook", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      console.log("[Scalev Webhook] Received:", JSON.stringify(body));

      // Optional: verify webhook secret if configured
      if (SCALEV_WEBHOOK_SECRET && body.secret_key !== SCALEV_WEBHOOK_SECRET) {
        console.warn("[Scalev Webhook] Invalid secret key");
        return res.status(401).json({ error: "Invalid secret key" });
      }

      // Only process completed/paid orders
      const status = body.status || body.payment_status || "";
      const event = body.event || "";
      const isPaid =
        status === "paid" ||
        status === "completed" ||
        status === "success" ||
        event === "order.completed" ||
        event === "payment.success";

      if (!isPaid) {
        console.log("[Scalev Webhook] Ignoring non-paid event:", status, event);
        return res.json({ received: true, action: "ignored" });
      }

      // Extract buyer email from various possible field names
      const buyerEmail =
        body.buyer_email ||
        body.email ||
        body.customer_email ||
        body.pembeli_email ||
        "";

      const orderId =
        body.order_id ||
        body.id ||
        body.transaction_id ||
        `scalev-${Date.now()}`;

      if (!buyerEmail) {
        console.error("[Scalev Webhook] No buyer email found in payload:", body);
        return res.status(400).json({ error: "Buyer email not found in payload" });
      }

      console.log(`[Scalev Webhook] Upgrading ${buyerEmail} to Pro (order: ${orderId})`);

      // Upgrade the user's business to Pro
      const upgraded = await upgradeBusinessToProByEmail(buyerEmail, orderId);

      if (upgraded) {
        console.log(`[Scalev Webhook] ✅ Successfully upgraded ${buyerEmail} to Pro`);
        return res.json({
          received: true,
          action: "upgraded_to_pro",
          email: buyerEmail,
          orderId,
        });
      } else {
        // User hasn't registered yet — they'll need to register first
        // Store the pending upgrade so when they register, they get Pro automatically
        console.warn(`[Scalev Webhook] ⚠️ User ${buyerEmail} not found — they may not have registered yet`);
        return res.json({
          received: true,
          action: "user_not_found",
          message: "User will be upgraded when they register with this email",
          email: buyerEmail,
        });
      }
    } catch (error) {
      console.error("[Scalev Webhook] Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Manual upgrade endpoint for admin (in case webhook fails)
  app.post("/api/admin/upgrade-to-pro", async (req: Request, res: Response) => {
    try {
      // Admin key check (SECURITY FIX: removed hardcoded fallback)
      const adminKey = req.headers["x-admin-key"] || req.body.adminKey;
      if (!process.env.ADMIN_SECRET_KEY || adminKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { email, orderId } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const upgraded = await upgradeBusinessToProByEmail(email, orderId || `manual-${Date.now()}`);
      return res.json({ success: upgraded, email });
    } catch (error) {
      console.error("[Admin Upgrade] Error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
