/**
 * Stripe Payment Integration
 * One-time payment for Pro plan upgrade (Rp 199.000)
 */

import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import { getBusinessByOwnerId, getBusinessById, updateBusiness } from "./db";
import { getUserByOpenId } from "./db";
import { PRO_PRICE } from "../shared/finance";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set");
    return null;
  }
  return new Stripe(key, { apiVersion: "2025-04-30.basil" as any });
}

export function registerStripeRoutes(app: Express) {
  // Create checkout session for Pro upgrade
  app.post("/api/stripe/create-checkout", async (req: Request, res: Response) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(500).json({ error: "Stripe belum dikonfigurasi" });
        return;
      }

      const { businessId, userId, businessName } = req.body;
      if (!businessId || !userId) {
        res.status(400).json({ error: "businessId dan userId diperlukan" });
        return;
      }

      // Determine base URL from request
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "idr",
              product_data: {
                name: "County Pro",
                description: "Upgrade ke Pro — Unlimited transaksi, produk, export, dan AI penuh. Sekali beli, selamanya.",
              },
              unit_amount: PRO_PRICE, // IDR is zero-decimal currency in Stripe
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/upgrade?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/upgrade?status=cancelled`,
        metadata: {
          businessId: String(businessId),
          userId: String(userId),
          businessName: businessName || "",
          plan: "pro",
        },
        customer_email: undefined, // Will be collected by Stripe
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      console.error("[Stripe] Checkout error:", err);
      res.status(500).json({ error: err.message || "Gagal membuat sesi pembayaran" });
    }
  });

  // Verify payment status
  app.get("/api/stripe/verify-payment", async (req: Request, res: Response) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(500).json({ error: "Stripe belum dikonfigurasi" });
        return;
      }

      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        res.status(400).json({ error: "session_id diperlukan" });
        return;
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid" && session.metadata?.businessId) {
        const businessId = parseInt(session.metadata.businessId);
        // Upgrade to Pro
        await updateBusiness(businessId, {
          plan: "pro",
          stripePaymentId: session.payment_intent as string,
        });
        res.json({
          success: true,
          paid: true,
          plan: "pro",
          businessId,
          paymentId: session.payment_intent,
        });
      } else {
        res.json({
          success: true,
          paid: false,
          status: session.payment_status,
        });
      }
    } catch (err: any) {
      console.error("[Stripe] Verify error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Stripe webhook for payment events
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const stripe = getStripe();
      if (!stripe) {
        res.status(500).json({ error: "Stripe not configured" });
        return;
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      if (webhookSecret && sig) {
        try {
          // For raw body, we need to handle this differently
          const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (err: any) {
          console.error("[Stripe Webhook] Signature verification failed:", err.message);
          res.status(400).json({ error: "Webhook signature verification failed" });
          return;
        }
      } else {
        // In development, accept without signature verification
        event = req.body as Stripe.Event;
      }

      // Handle test events
      if (event.id.startsWith('evt_test_')) {
        console.log("[Webhook] Test event detected, returning verification response");
        res.json({ verified: true });
        return;
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.payment_status === "paid" && session.metadata?.businessId) {
            const businessId = parseInt(session.metadata.businessId);
            console.log(`[Stripe] Upgrading business ${businessId} to Pro`);
            await updateBusiness(businessId, {
              plan: "pro",
              stripePaymentId: session.payment_intent as string,
            });
          }
          break;
        }
        case "payment_intent.succeeded": {
          console.log("[Stripe] Payment succeeded:", (event.data.object as any).id);
          break;
        }
        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe Webhook] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get payment history for a business
  app.get("/api/stripe/payment-status", async (req: Request, res: Response) => {
    try {
      const businessId = req.query.businessId as string;
      if (!businessId) {
        res.status(400).json({ error: "businessId diperlukan" });
        return;
      }
      const biz = await getBusinessById(parseInt(businessId));
      if (!biz) {
        res.status(404).json({ error: "Bisnis tidak ditemukan" });
        return;
      }
      res.json({
        plan: biz.plan,
        isPro: biz.plan === "pro",
        stripePaymentId: biz.stripePaymentId || null,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
