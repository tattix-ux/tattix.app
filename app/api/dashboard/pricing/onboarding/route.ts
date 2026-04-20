import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pricingOnboardingSchema } from "@/lib/forms/schemas";
import { buildPricingV2Profile } from "@/lib/pricing/v2/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArtistPricingRules } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = pricingOnboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid pricing onboarding payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist pricing setup.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const nextPricingProfile = buildPricingV2Profile(parsed.data);

  const supabase = await createSupabaseServerClient();
  const existingPricing = await supabase
    .from("artist_pricing_rules")
    .select("calibration_examples")
    .eq("artist_id", artist.id)
    .maybeSingle();

  const existingCalibrationExamples =
    (existingPricing.data?.calibration_examples as ArtistPricingRules["calibrationExamples"] | undefined) ??
    undefined;

  const nextCalibrationExamples = {
    ...(existingCalibrationExamples ?? {}),
    pricingV2Profile: nextPricingProfile,
  };

  const basePayload = {
    artist_id: artist.id,
    anchor_price: parsed.data.minimumJobPrice,
    base_price: parsed.data.minimumJobPrice,
    minimum_charge: parsed.data.minimumJobPrice,
    minimum_session_price: parsed.data.minimumJobPrice,
    calibration_examples: nextCalibrationExamples,
  };

  const { error: v2Error } = await supabase.from("artist_pricing_rules").upsert({
    ...basePayload,
    pricing_version: "v2",
  });

  const error =
    v2Error && v2Error.message.toLowerCase().includes("pricing_version")
      ? (
          await supabase.from("artist_pricing_rules").upsert(basePayload)
        ).error
      : v2Error;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Pricing settings saved.",
    pricingProfile: nextPricingProfile,
  });
}
