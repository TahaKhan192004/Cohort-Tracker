import "server-only";

import { createClient } from "./supabase/server";
import type { NotificationType } from "./types";

interface NotifyInput {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

/**
 * Notifications are a side effect of the action that caused them — a failure
 * here should never roll back the comment or submission itself, so errors are
 * swallowed rather than thrown.
 */
export async function notify({
  recipientId,
  type,
  title,
  body = null,
  link = null,
}: NotifyInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    type,
    title,
    body,
    link,
  });
  if (error) console.error("notify failed:", error.message);
}

/**
 * Fan a notification out to every admin. Goes through the admin_ids() RPC
 * because RLS hides admin rows from participants, who are usually the ones
 * triggering this.
 */
export async function notifyAdmins(input: Omit<NotifyInput, "recipientId">) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_ids");
  if (error) {
    console.error("admin_ids failed:", error.message);
    return;
  }

  const ids = (data ?? []) as unknown as string[];
  await Promise.all(ids.map((id) => notify({ ...input, recipientId: id })));
}
