import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pricingOnboardingSchema } from "@/lib/forms/schemas";
import {
  buildPricingProfileDebugSnapshot,
  derivePricingProfile,
} from "@/lib/pricing/pricing-profile";
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

  const { sanitizedInputs, pricingProfile } = derivePricingProfile(parsed.data);

  if (process.env.NODE_ENV !== "production") {
    console.debug(
      "[pricing-onboarding]",
      buildPricingProfileDebugSnapshot(sanitizedInputs, pricingProfile),
    );
  }

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
    pricingRawInputs: sanitizedInputs,
    pricingProfile,
  };

  const { error } = await supabase.from("artist_pricing_rules").upsert({
    artist_id: artist.id,
    anchor_price: sanitizedInputs.minimumPrice,
    base_price: sanitizedInputs.minimumPrice,
    minimum_charge: sanitizedInputs.minimumPrice,
    minimum_session_price: sanitizedInputs.minimumPrice,
    calibration_examples: nextCalibrationExamples,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Pricing onboarding saved.",
    rawInputs: sanitizedInputs,
    pricingProfile,
  });
}
