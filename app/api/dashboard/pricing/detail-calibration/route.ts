import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { detailCalibrationSubmissionSchema } from "@/lib/forms/schemas";
import {
  buildDetailCalibrationDebugSnapshot,
  deriveDetailCalibrationProfile,
  isDetailCalibrationSampleId,
} from "@/lib/pricing/detail-calibration";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArtistPricingRules } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = detailCalibrationSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid detail calibration payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist detail calibration.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const sampleOrder = parsed.data.sampleOrder.filter(isDetailCalibrationSampleId);
  const responses = parsed.data.responses.reduce<
    Array<{
      sampleId: (typeof sampleOrder)[number];
      selectedDetailLevel: (typeof parsed.data.responses)[number]["selectedDetailLevel"];
    }>
  >((accumulator, response) => {
    if (!isDetailCalibrationSampleId(response.sampleId)) {
      return accumulator;
    }

    accumulator.push({
      sampleId: response.sampleId,
      selectedDetailLevel: response.selectedDetailLevel,
    });

    return accumulator;
  }, []);

  const profile = deriveDetailCalibrationProfile({
    sampleOrder,
    responses,
  });

  if (process.env.NODE_ENV !== "production") {
    console.debug("[detail-calibration]", buildDetailCalibrationDebugSnapshot(profile));
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
    detailCalibration: profile,
  };

  const { error } = await supabase.from("artist_pricing_rules").upsert({
    artist_id: artist.id,
    calibration_examples: nextCalibrationExamples,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Detail calibration saved.",
    detailCalibration: profile,
  });
}
