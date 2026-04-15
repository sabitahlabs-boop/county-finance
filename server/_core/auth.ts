/**
 * County Finance — Authentication Module
 * Powered by Clerk (replacing Manus OAuth)
 *
 * Handles:
 * - Session verification via Clerk SDK
 * - User sync from Clerk to local database
 * - Webhook handler for user events
 */

import { type Request, type Response, type Express } from "express";
import { clerkClient, requireAuth, getAuth } from "@clerk/express";
import { ENV } from "./env";

// ── Types ──

export interface AuthUser {
  id: string; // Clerk userId (replaces Manus openId)
  email: string;
  name: string;
  imageUrl?: string;
}

// ── Middleware ──

/**
 * Extract authenticated user from Clerk session
 * Use this in tRPC context creation
 */
export async function getAuthenticatedUser(
  req: Request
): Promise<AuthUser | null> {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return null;
    }

    const user = await clerkClient.users.getUser(userId);

    return {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      imageUrl: user.imageUrl,
    };
  } catch {
    return null;
  }
}

// ── Webhook Handler ──

/**
 * Handle Clerk webhook events to sync users with local database
 * Events: user.created, user.updated, user.deleted
 */
export function registerClerkWebhook(app: Express) {
  app.post("/api/webhooks/clerk", async (req: Request, res: Response) => {
    // Verify webhook signature
    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      res.status(400).json({ error: "Missing svix headers" });
      return;
    }

    // TODO: Verify signature with Clerk webhook secret
    // For now, process the event
    const event = req.body;

    try {
      switch (event.type) {
        case "user.created":
        case "user.updated": {
          const { id, email_addresses, first_name, last_name, image_url } =
            event.data;
          const email = email_addresses?.[0]?.email_address ?? "";
          const name = `${first_name ?? ""} ${last_name ?? ""}`.trim();

          // Upsert user in local database
          // This replaces the old Manus OAuth callback user creation
          console.log(
            `[Clerk Webhook] Syncing user: ${id} (${email})`
          );

          // TODO: Call db.upsertUser({ clerkUserId: id, email, name, imageUrl: image_url })
          break;
        }

        case "user.deleted": {
          const { id } = event.data;
          console.log(`[Clerk Webhook] User deleted: ${id}`);
          // TODO: Handle user deletion (soft delete in DB)
          break;
        }

        default:
          console.log(`[Clerk Webhook] Unhandled event: ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Clerk Webhook] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}

// ── Auth Routes ──

export function registerAuthRoutes(app: Express) {
  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Clerk handles session invalidation client-side
    // Clear any local cookies if needed
    res.clearCookie("county_session");
    res.json({ success: true });
  });

  // Get current user info (protected)
  app.get("/api/auth/me", requireAuth(), async (req: Request, res: Response) => {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json(user);
  });

  // Register Clerk webhook
  registerClerkWebhook(app);
}
