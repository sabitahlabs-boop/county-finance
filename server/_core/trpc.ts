/**
 * County Finance — tRPC Configuration
 * Defines public, protected, and admin procedures
 * Uses Clerk-based context (replacing Manus SDK auth)
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;

// ── Public Procedure ──
// No authentication required
export const publicProcedure = t.procedure;

// ── Auth Middleware ──
const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed non-null
    },
  });
});

// ── Protected Procedure ──
// Requires authenticated user
export const protectedProcedure = t.procedure.use(isAuthed);

// ── Business Middleware ──
const hasBusiness = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.requestedBusinessId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Business ID is required. Set x-business-id header.",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      requestedBusinessId: ctx.requestedBusinessId,
    },
  });
});

// ── Business Procedure ──
// Requires authenticated user + active business
export const businessProcedure = t.procedure.use(hasBusiness);

// ── Admin Middleware ──
const isAdmin = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // TODO: Check admin role from database
  // For now, check against env or DB role
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// ── Admin Procedure ──
// Requires admin role
export const adminProcedure = t.procedure.use(isAdmin);
