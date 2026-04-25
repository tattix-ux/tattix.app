import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupportMessage, sendAdminInboxNotification, sendAdminProAccessEmail, sendAdminSupportNotification } from "@/lib/support";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (artist.planType === "pro" && artist.accessStatus === "active") {
    return NextResponse.json({ message: "Bu hesap için Pro erişim zaten aktif." }, { status: 400 });
  }

  if (artist.accessStatus === "pending") {
    return NextResponse.json({ message: "Pro erişim talebin zaten gönderildi." });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const createdAt = new Date().toISOString();
  const requestBody = [
    "[PRO ERISIM TALEBI]",
    `Sanatçı: ${artist.artistName}`,
    `Slug: ${artist.slug}`,
    `Hesap emaili: ${user?.email ?? ""}`,
    `Talep zamanı: ${createdAt}`,
  ].join("\n");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("artist_support_messages")
    .insert({
      artist_id: artist.id,
      artist_name: artist.artistName,
      account_email: user?.email ?? "",
      message: requestBody,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "Talep gönderilemedi." }, { status: 400 });
  }

  await admin
    .from("artists")
    .update({
      access_status: "pending",
    })
    .eq("id", artist.id);

  const notificationTitle = "Yeni Pro erişim talebi";
  const notificationBody = `${artist.artistName} (${artist.slug}) Pro erişim talebi gönderdi.`;

  await Promise.all([
    sendAdminSupportNotification(mapSupportMessage(data as Record<string, unknown>)),
    sendAdminProAccessEmail({
      artistName: artist.artistName,
      accountEmail: user?.email ?? "",
      slug: artist.slug,
      createdAt,
    }),
    sendAdminInboxNotification({
      title: notificationTitle,
      body: notificationBody,
      senderLabel: artist.artistName,
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/upgrade");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/notifications");

  return NextResponse.json({ message: "Pro erişim talebin gönderildi." });
}
