import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pricingSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PriceRange } from "@/lib/types";

function midpoint(range: PriceRange) {
  return (range.min + range.max) / 2;
}

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
    .select("style_key,enabled,label,is_custom,style_description,deleted,multiplier")
    .eq("artist_id", artist.id);
  const existingPricing = await supabase
    .from("artist_pricing_rules")
    .select("size_time_ranges,intent_multipliers")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const legacySizeBaseRanges = Object.fromEntries(
    Object.entries(parsed.data.sizeModifiers).map(([key, range]) => [
      key,
      {
        min: Math.round(parsed.data.basePrice * range.min),
        max: Math.round(parsed.data.basePrice * range.max),
      },
    ]),
  );
  const legacyPlacementMultipliers = Object.fromEntries(
    Object.entries(parsed.data.placementModifiers).map(([key, range]) => [key, Number(midpoint(range).toFixed(2))]),
  );

  const { error: pricingError } = await supabase.from("artist_pricing_rules").upsert({
    artist_id: artist.id,
    base_price: Math.round(parsed.data.basePrice),
    minimum_charge: Math.round(parsed.data.minimumCharge),
    minimum_session_price: Math.round(parsed.data.minimumCharge),
    size_modifiers: parsed.data.sizeModifiers,
    size_base_ranges: legacySizeBaseRanges,
    placement_modifiers: parsed.data.placementModifiers,
    placement_multipliers: legacyPlacementMultipliers,
    detail_level_modifiers: parsed.data.detailLevelModifiers,
    color_mode_modifiers: parsed.data.colorModeModifiers,
    addon_fees: parsed.data.addonFees,
    size_time_ranges: existingPricing.data?.size_time_ranges ?? {
      tiny: { minHours: 0.5, maxHours: 1 },
      small: { minHours: 1, maxHours: 2 },
      medium: { minHours: 2, maxHours: 4 },
      large: { minHours: 4, maxHours: 6 },
    },
    intent_multipliers: existingPricing.data?.intent_multipliers ?? {
      "custom-tattoo": 1,
      "design-in-mind": 1,
      "flash-design": 1,
      "discounted-design": 1,
      "not-sure": 1,
    },
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
        multiplier: existing?.multiplier ?? 1,
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
