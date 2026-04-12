import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("artist_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("artist_id", artist.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return NextResponse.json({ message: "Notification marked as read." });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = (await params) as { id: string };
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("artist_notifications")
    .delete()
    .eq("id", id)
    .eq("artist_id", artist.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return NextResponse.json({ message: "Notification deleted." });
}
