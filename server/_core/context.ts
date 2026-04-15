/**
 * County Finance — tRPC Context
 * Creates authenticated context for all tRPC procedures
 * Uses Clerk for authentication + syncs to local DB user
 */

import type { Request, Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { upsertUser, getUserByClerkId } from "../db";
import type { User } from "../../drizzle/schema";

// ── Context Type ──
// ctx.user is the LOCAL database user (with numeric id), not Clerk user

export interface TrpcContext {
  req: Request;
  res: Response;
  user: User | null;
  requestedBusinessId: number | null;
}

// ── Context Factory ──

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const { userId: clerkUserId } = getAuth(req);

    if (clerkUserId) {
      // Try to find existing user in local DB
      user = (await getUserByClerkId(clerkUserId)) ?? null;

      // If not in DB yet, fetch from Clerk and upsert (first login)
      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
          const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email;

          await upsertUser({
            clerkUserId,
            email,
            name,
            loginMethod: "clerk",
          });

          // Re-fetch after upsert to get numeric id
          user = (await getUserByClerkId(clerkUserId)) ?? null;
        } catch (err) {
          console.error("[Context] Failed to sync Clerk user to DB:", err);
        }
      }
    }
  } catch {
    user = null;
  }

  // Parse requested business ID from header
  const businessIdHeader = req.headers["x-business-id"];
  const requestedBusinessId = businessIdHeader
    ? parseInt(String(businessIdHeader), 10)
    : null;

  return {
    req,
    res,
    user,
    requestedBusinessId: isNaN(requestedBusinessId as number) ? null : requestedBusinessId,
  };
}
