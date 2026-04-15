import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pricingSchema } from "@/lib/forms/schemas";
import { CALIBRATION_SLOT_LABELS } from "@/lib/pricing/calibration-flow";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PriceRange } from "@/lib/types";

function midpoint(range: PriceRange) {
  return (range.min + range.max) / 2;
}

function deriveCalibrationPrice(anchorPrice: number, range: PriceRange) {
  return Math.max(Math.round(anchorPrice * midpoint(range)), 0);
}

function deriveCalibrationPriceFromRange(range: PriceRange | undefined, fallback: number) {
  if (!range) {
    return fallback;
  }

  return Math.max(Math.round(midpoint(range)), 0);
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
    .select("size_time_ranges,intent_multipliers,calibration_reference_slots")
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
  const calibrationAnswers = parsed.data.calibrationAnswers;
  const easyPlacementPrice = calibrationAnswers
    ? deriveCalibrationPriceFromRange(calibrationAnswers.placementDifficulty.easy, parsed.data.basePrice)
    : deriveCalibrationPrice(parsed.data.basePrice, { min: 1, max: 1.08 });
  const hardPlacementPrice = calibrationAnswers
    ? deriveCalibrationPriceFromRange(calibrationAnswers.placementDifficulty.hard, easyPlacementPrice)
    : deriveCalibrationPrice(parsed.data.basePrice, { min: 1.14, max: 1.3 });
  const blackPrice = calibrationAnswers
    ? deriveCalibrationPriceFromRange(calibrationAnswers.colorMode.black, parsed.data.basePrice)
    : deriveCalibrationPrice(parsed.data.basePrice, parsed.data.colorModeModifiers["black-only"]);
  const colorPrice = calibrationAnswers
    ? deriveCalibrationPriceFromRange(calibrationAnswers.colorMode.color, blackPrice)
    : deriveCalibrationPrice(parsed.data.basePrice, parsed.data.colorModeModifiers["full-color"]);

  const calibrationExamples = {
    size: {
      tiny: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.tiny),
      small: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.small),
      medium: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.medium),
      large: deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.large),
    },
    sizeCurve: calibrationAnswers
      ? {
          "8": deriveCalibrationPriceFromRange(calibrationAnswers.sizeCurve["8"], parsed.data.basePrice),
          "12": deriveCalibrationPriceFromRange(calibrationAnswers.sizeCurve["12"], parsed.data.basePrice),
          "18": deriveCalibrationPriceFromRange(calibrationAnswers.sizeCurve["18"], parsed.data.basePrice),
          "25": deriveCalibrationPriceFromRange(calibrationAnswers.sizeCurve["25"], parsed.data.basePrice),
        }
      : {
          "8": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.tiny),
          "12": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.small),
          "18": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.medium),
          "25": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.sizeModifiers.large),
        },
    detailLevel: {
      simple: calibrationAnswers
        ? deriveCalibrationPriceFromRange(calibrationAnswers.detailLevel.low, parsed.data.basePrice)
        : deriveCalibrationPrice(parsed.data.basePrice, parsed.data.detailLevelModifiers.simple),
      standard: calibrationAnswers
        ? deriveCalibrationPriceFromRange(calibrationAnswers.detailLevel.medium, parsed.data.basePrice)
        : deriveCalibrationPrice(parsed.data.basePrice, parsed.data.detailLevelModifiers.standard),
      detailed: calibrationAnswers
        ? deriveCalibrationPriceFromRange(calibrationAnswers.detailLevel.high, parsed.data.basePrice)
        : deriveCalibrationPrice(parsed.data.basePrice, parsed.data.detailLevelModifiers.detailed),
    },
    placement: Object.fromEntries(
      Object.entries(parsed.data.placementModifiers).map(([key, range]) => [
        key,
        deriveCalibrationPrice(parsed.data.basePrice, range),
      ]),
    ),
    placementDifficulty: {
      easy: easyPlacementPrice,
      hard: hardPlacementPrice,
    },
    colorMode: {
      "black-only": blackPrice,
      "black-grey": deriveCalibrationPrice(parsed.data.basePrice, parsed.data.colorModeModifiers["black-grey"]),
      "full-color": colorPrice,
    },
    globalScale: calibrationAnswers?.validation?.globalScale ?? 1,
  };
  const existingReferenceSlots =
    (existingPricing.data?.calibration_reference_slots as
      | { slotId: string; assetRef: string | null }[]
      | undefined) ?? [];
  const calibrationReferenceSlots = CALIBRATION_SLOT_LABELS.map((slot) => ({
    ...slot,
    assetRef: existingReferenceSlots.find((item) => item.slotId === slot.slotId)?.assetRef ?? null,
  }));

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
