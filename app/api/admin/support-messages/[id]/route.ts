import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  replyMessage: z.string().trim().min(2).max(1200).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = (await params) as { id: string };
  const body = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid reply payload." }, { status: 400 });
  }

  const replyMessage = parsed.data.replyMessage?.trim();
  const admin = createSupabaseAdminClient();
  const { data: currentMessage, error: fetchError } = await admin
    .from("artist_support_messages")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentMessage) {
    return NextResponse.json({ message: fetchError?.message ?? "Message not found." }, { status: 400 });
  }

  const updatePayload: Record<string, string> = {
    replied_at: new Date().toISOString(),
  };

  if (replyMessage) {
    updatePayload.admin_reply = replyMessage;
  }

  const { error } = await admin
    .from("artist_support_messages")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (replyMessage) {
    const { error: notificationError } = await admin.from("artist_notifications").insert({
      artist_id: currentMessage.artist_id,
      title: "Admin yanıtı",
      body: replyMessage,
      sender_label: "Admin",
    });

    if (notificationError) {
      return NextResponse.json({ message: notificationError.message }, { status: 400 });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/messages");
  revalidatePath("/dashboard/notifications");
  return NextResponse.json({ message: "Message marked as replied." });
}
