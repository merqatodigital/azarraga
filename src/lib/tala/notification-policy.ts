export type TalaNotificationKind =
  | "daily_brief"
  | "new_lead"
  | "invoice_due"
  | "invoice_overdue"
  | "payment_received"
  | "quote_followup"
  | "task_urgent"
  | "system";

export type TalaOwnerNotification = {
  kind: TalaNotificationKind;
  title: string;
  body: string;
  dedupeKey: string;
  requiresReply?: boolean;
};

/** Keep owner WhatsApp useful rather than noisy. */
export function formatOwnerNotification(notification: TalaOwnerNotification): string {
  const parts = [notification.title.trim(), notification.body.trim()].filter(Boolean);
  if (notification.requiresReply) parts.push("Reply to TALA with your instruction.");
  return parts.join("\n\n");
}

/**
 * Deterministic dedupe keys are persisted once tala_messages/notifications are installed.
 * This helper ensures callers use the same event identity across webhook retries and scheduled checks.
 */
export function notificationKey(kind: TalaNotificationKind, entityId: string, event: string): string {
  return `${kind}:${entityId}:${event}`.toLowerCase().replace(/[^a-z0-9:_-]/g, "-");
}
