/**
 * County Finance — tRPC Context
 * Creates authenticated context for all tRPC procedures
 * Uses Clerk for authentication (replacing Manus SDK)
 */

import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { getAuthenticatedUser, type AuthUser } from "./auth";

// ── Context Type ──

export interface TrpcContext {
  req: Request;
  res: Response;
  user: AuthUser | null;
  businessId: string | null;
}

// ── Context Factory ──

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  // Try to get authenticated user via Clerk
  let user: AuthUser | null = null;

  try {
    const { userId } = getAuth(req);
    if (userId) {
      user = await getAuthenticatedUser(req);
    }
  } catch {
    // Not authenticated — that's okay for public procedures
    user = null;
  }

  // Get business ID from header (set by frontend)
  const businessId =
    (req.headers["x-business-id"] as string) ?? null;

  return {
    req,
    res,
    user,
    businessId,
  };
}
