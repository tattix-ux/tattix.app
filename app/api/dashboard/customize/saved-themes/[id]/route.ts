import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { hasProAccess } from "@/lib/access";
import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const body = await request.json();
  const name =
    typeof body?.name === "string" && body.name.trim().length
      ? body.name.trim().slice(0, 60)
      : null;

  if (!name) {
    return NextResponse.json({ message: "Invalid theme name." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!hasProAccess(artist)) {
    return NextResponse.json({ message: "Contact for Pro access." }, { status: 403 });
  }

  const { id } = (await params) as { id: string };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("artist_saved_themes")
    .update({ name })
    .eq("id", id)
    .eq("artist_id", artist.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard/customize");
  return NextResponse.json({ message: "Theme renamed." });
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

  if (!hasProAccess(artist)) {
    return NextResponse.json({ message: "Contact for Pro access." }, { status: 403 });
  }

  const { id } = (await params) as { id: string };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("artist_saved_themes")
    .delete()
    .eq("id", id)
    .eq("artist_id", artist.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard/customize");
  return NextResponse.json({ message: "Theme deleted." });
}
