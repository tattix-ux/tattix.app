import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ArtistNotification, SupportMessage } from "@/lib/types";

export function mapSupportMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    artistName: String(row.artist_name ?? ""),
    accountEmail: String(row.account_email ?? ""),
    message: String(row.message ?? ""),
    adminReply: row.admin_reply ? String(row.admin_reply) : null,
    repliedAt: row.replied_at ? String(row.replied_at) : null,
    createdAt: String(row.created_at),
  };
}

export function mapArtistNotification(row: Record<string, unknown>): ArtistNotification {
  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    senderLabel: String(row.sender_label ?? "Admin"),
    readAt: row.read_at ? String(row.read_at) : null,
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

export async function getArtistNotifications(artistId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("artist_notifications")
    .select("*")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapArtistNotification(row as Record<string, unknown>));
}

export async function getUnreadArtistNotificationCount(artistId: string) {
  const admin = createSupabaseAdminClient();
  const { count, error } = await admin
    .from("artist_notifications")
    .select("*", { count: "exact", head: true })
    .eq("artist_id", artistId)
    .is("read_at", null);

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

function getAdminEmailList() {
  return (process.env.TATBOT_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function sendAdminInboxNotification({
  title,
  body,
  senderLabel,
}: {
  title: string;
  body: string;
  senderLabel: string;
}) {
  const adminEmails = getAdminEmailList();

  if (adminEmails.length === 0) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (usersError) {
    return;
  }

  const adminUserIds = (usersData?.users ?? [])
    .filter((user) => adminEmails.includes(user.email?.trim().toLowerCase() ?? ""))
    .map((user) => user.id);

  if (adminUserIds.length === 0) {
    return;
  }

  const { data: artistRows, error: artistError } = await admin
    .from("artists")
    .select("id")
    .in("user_id", adminUserIds);

  if (artistError || !artistRows?.length) {
    return;
  }

  await admin
    .from("artist_notifications")
    .insert(
      artistRows.map((artist) => ({
        artist_id: String((artist as Record<string, unknown>).id),
        title,
        body,
        sender_label: senderLabel,
      })),
    )
    .then(() => undefined, () => undefined);
}

export async function sendAdminProAccessEmail({
  artistName,
  accountEmail,
  slug,
  createdAt,
}: {
  artistName: string;
  accountEmail: string;
  slug: string;
  createdAt: string;
}) {
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
      subject: `New Pro access request - ${artistName || accountEmail}`,
      text: [
        `Artist name: ${artistName}`,
        `Account email: ${accountEmail}`,
        `Artist slug: ${slug}`,
        `Requested at: ${createdAt}`,
      ].join("\n"),
    }),
  }).catch(() => undefined);
}
