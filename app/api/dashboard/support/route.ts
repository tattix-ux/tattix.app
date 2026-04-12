import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupportMessage, sendAdminSupportNotification } from "@/lib/support";

const payloadSchema = z.object({
  message: z.string().trim().min(4).max(1200),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid support payload." }, { status: 400 });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("artist_support_messages")
    .insert({
      artist_id: artist.id,
      artist_name: artist.artistName,
      account_email: user?.email ?? "",
      message: parsed.data.message,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "Unable to send support message." }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/messages");
  await sendAdminSupportNotification(mapSupportMessage(data as Record<string, unknown>));

  return NextResponse.json({ message: "Support message sent." });
}
