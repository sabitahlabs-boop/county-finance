import { TRPCError } from "@trpc/server";

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Dispatches a notification to the project owner.
 * TODO: Implement with email/push notification service (Forge removed).
 * Currently logs to console only.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  if (!payload.title?.trim() || !payload.content?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title and content are required.",
    });
  }

  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  return true;
}
