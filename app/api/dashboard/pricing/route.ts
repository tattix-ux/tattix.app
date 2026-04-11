import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pricingSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = pricingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid pricing payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist pricing rules.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const existingStyles = await supabase
    .from("artist_style_options")
    .select("style_key,enabled,label,is_custom,style_description,deleted")
    .eq("artist_id", artist.id);

  const { error: pricingError } = await supabase.from("artist_pricing_rules").upsert({
    artist_id: artist.id,
    minimum_session_price: parsed.data.minimumSessionPrice,
    size_base_ranges: parsed.data.sizeBaseRanges,
    size_time_ranges: parsed.data.sizeTimeRanges,
    placement_multipliers: parsed.data.placementMultipliers,
    intent_multipliers: parsed.data.intentMultipliers,
  });

  const { error: stylesError } = await supabase.from("artist_style_options").upsert(
    (existingStyles.data ?? []).map((style) => {
      const existing = existingStyles.data?.find((item) => item.style_key === style.style_key);

      return {
        artist_id: artist.id,
        style_key: style.style_key,
        label: existing?.label ?? style.label,
        style_description: existing?.style_description ?? null,
        enabled: existing?.enabled ?? true,
        multiplier: parsed.data.styleMultipliers[style.style_key] ?? 1,
        is_custom: existing?.is_custom ?? false,
        deleted: existing?.deleted ?? false,
      };
    }),
    {
      onConflict: "artist_id,style_key",
    },
  );

  const error = pricingError ?? stylesError;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Pricing rules saved." });
}
