import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { profileSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid profile payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist profile changes.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("artists")
    .update({
      artist_name: parsed.data.artistName,
      slug: parsed.data.slug,
      profile_image_url: parsed.data.profileImageUrl || null,
      cover_image_url: parsed.data.coverImageUrl || null,
      short_bio: parsed.data.shortBio,
      welcome_headline: parsed.data.welcomeHeadline,
      whatsapp_number: parsed.data.whatsappNumber,
      instagram_handle: parsed.data.instagramHandle,
      currency: "TRY",
      active: parsed.data.active,
    })
    .eq("id", artist.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Artist profile saved." });
}
