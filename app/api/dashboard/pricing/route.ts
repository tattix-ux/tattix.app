import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pricingSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PriceRange } from "@/lib/types";

function midpoint(range: PriceRange) {
  return (range.min + range.max) / 2;
}

function deriveCalibrationPrice(anchorPrice: number, range: PriceRange) {
  return Math.max(Math.round(anchorPrice * midpoint(range)), 0);
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
  const calibrationExamples = {
    size: {
      tiny: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.tiny),
      small: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.small),
      medium: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.medium),
      large: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.large),
    },
    detailLevel: {
      simple: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.detailLevelModifiers.simple),
      standard: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.detailLevelModifiers.standard),
      detailed: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.detailLevelModifiers.detailed),
    },
    placement: Object.fromEntries(
      Object.entries(parsed.data.placementModifiers).map(([key, range]) => [
        key,
        deriveCalibrationPrice(parsed.data.basePrice, range),
      ]),
    ),
    colorMode: {
      "black-only": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.colorModeModifiers["black-only"]),
      "black-grey": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.colorModeModifiers["black-grey"]),
      "full-color": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.colorModeModifiers["full-color"]),
    },
  };
  const calibrationReferenceSlots = [
    { slotId: "size-tiny", axis: "size", key: "tiny", label: "Size · tiny", assetRef: null },
    { slotId: "size-small", axis: "size", key: "small", label: "Size · small", assetRef: null },
    { slotId: "size-medium", axis: "size", key: "medium", label: "Size · medium", assetRef: null },
    { slotId: "size-large", axis: "size", key: "large", label: "Size · large", assetRef: null },
    { slotId: "detail-simple", axis: "detailLevel", key: "simple", label: "Detail · simple", assetRef: null },
    { slotId: "detail-standard", axis: "detailLevel", key: "standard", label: "Detail · standard", assetRef: null },
    { slotId: "detail-detailed", axis: "detailLevel", key: "detailed", label: "Detail · detailed", assetRef: null },
    { slotId: "color-black-only", axis: "colorMode", key: "black-only", label: "Color · black-only", assetRef: null },
    { slotId: "color-black-grey", axis: "colorMode", key: "black-grey", label: "Color · black-grey", assetRef: null },
    { slotId: "color-full-color", axis: "colorMode", key: "full-color", label: "Color · full-color", assetRef: null },
  ];

  const { error: pricingError } = await supabase.from("artist_pricing_rules").upsert({
    artist_id: artist.id,
    anchor_price: Math.round(parsed.data.basePrice),
    base_price: Math.round(parsed.data.basePrice),
    minimum_charge: Math.round(parsed.data.minimumCharge),
    minimum_session_price: Math.round(parsed.data.minimumCharge),
    calibration_examples: calibrationExamples,
    calibration_reference_slots: calibrationReferenceSlots,
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
