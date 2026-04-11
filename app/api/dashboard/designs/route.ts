import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { hasProAccess } from "@/lib/access";
import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { featuredDesignsSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = featuredDesignsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid featured design payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist featured designs.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!hasProAccess(artist)) {
    return NextResponse.json({ message: "Contact for Pro access." }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingDesigns } = await supabase
    .from("artist_featured_designs")
    .select("image_path")
    .eq("artist_id", artist.id);

  const keptPaths = new Set(
    parsed.data.designs
      .map((design) => design.imagePath?.trim())
      .filter((path): path is string => Boolean(path)),
  );
  const removedPaths = (existingDesigns ?? [])
    .map((design) => design.image_path)
    .filter((path): path is string => Boolean(path) && !keptPaths.has(String(path)));

  if (removedPaths.length > 0) {
    await supabase.storage.from("artist-designs").remove(removedPaths);
  }

  const { error: deleteError } = await supabase
    .from("artist_featured_designs")
    .delete()
    .eq("artist_id", artist.id);

  if (deleteError) {
    return NextResponse.json({ message: deleteError.message }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("artist_featured_designs").insert(
    parsed.data.designs.map((design, index) => ({
      id: design.id ?? randomUUID(),
      artist_id: artist.id,
      category: design.category,
      title: design.title,
      short_description: design.shortDescription,
      image_url: design.imageUrl || null,
      image_path: design.imagePath || null,
      price_note: design.priceNote || null,
      reference_price_min: design.referencePriceMin ?? null,
      reference_price_max: design.referencePriceMax ?? null,
      active: design.active ?? true,
      sort_order: design.sortOrder ?? index,
    })),
  );

  if (insertError) {
    return NextResponse.json({ message: insertError.message }, { status: 400 });
  }

  revalidatePath("/dashboard/designs");
  revalidatePath(`/${artist.slug}`);

  return NextResponse.json({ message: "Featured designs saved." });
}
