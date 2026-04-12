import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupportMessage } from "@/lib/types";

export function mapSupportMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    artistName: String(row.artist_name ?? ""),
    accountEmail: String(row.account_email ?? ""),
    message: String(row.message ?? ""),
    repliedAt: row.replied_at ? String(row.replied_at) : null,
    createdAt: String(row.created_at),
  };
}

export async function getAdminSupportMessages() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("artist_support_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapSupportMessage(row as Record<string, unknown>));
}

export async function getUnreadSupportMessageCount() {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("artist_support_messages")
    .select("*", { count: "exact", head: true })
    .is("replied_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function sendAdminSupportNotification(message: SupportMessage) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return;
  }

  const recipient = process.env.SUPPORT_INBOX_EMAIL ?? "gizemoderr@gmail.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "Tattix <onboarding@resend.dev>";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `New support message - ${message.artistName || message.accountEmail}`,
      text: [
        `Artist name: ${message.artistName}`,
        `Account email: ${message.accountEmail}`,
        `Created at: ${message.createdAt}`,
        "",
        message.message,
      ].join("\n"),
    }),
  }).catch(() => undefined);
}
