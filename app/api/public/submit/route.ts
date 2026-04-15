import { NextResponse } from "next/server";

import { getPublicArtistPageData } from "@/lib/data/artist";
import { submissionSchema } from "@/lib/forms/schemas";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public";
import { buildSubmissionMessage, buildWhatsAppLink } from "@/lib/messages";
import { buildEstimateSummary, estimateTattooPrice } from "@/lib/pricing/estimate";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubmissionRequest } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid submission payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const submission = parsed.data as SubmissionRequest;
  const artist = await getPublicArtistPageData(submission.artistSlug);
  const locale = (submission.locale ?? artist.funnelSettings.defaultLanguage ?? "tr") as PublicLocale;
  const bookingCities = artist.funnelSettings.bookingCities;
  const selectedBookingCity = bookingCities.find((city) => city.cityName === submission.city?.trim()) ?? null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingCities.length > 0) {
    if (!selectedBookingCity) {
      return NextResponse.json({ message: "Invalid city selection." }, { status: 400 });
    }

    if (!submission.preferredStartDate || !selectedBookingCity.availableDates.includes(submission.preferredStartDate)) {
      return NextResponse.json({ message: "Invalid appointment date selection." }, { status: 400 });
    }

    const selectedDate = new Date(`${submission.preferredStartDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
      return NextResponse.json({ message: "Appointment date is no longer available." }, { status: 400 });
    }
  }

  const selectedDesign = submission.selectedDesignId
    ? artist.featuredDesigns.find((design) => design.id === submission.selectedDesignId) ?? null
    : null;
  const selectedStyle = artist.styleOptions.find((style) => style.styleKey === submission.style) ?? null;
  const estimate = estimateTattooPrice(submission, {
    pricingRules: artist.pricingRules,
    styleOptions: artist.styleOptions,
  });
  const copy = getPublicCopy(locale);
  const message = buildSubmissionMessage(
    submission,
    artist.profile,
    estimate.min,
    estimate.max,
    locale,
    selectedDesign?.title ?? null,
    selectedStyle?.label ?? null,
  );
  const combinedNotes = [
    submission.notes?.trim(),
  ]
    .filter(Boolean)
    .join(" | ");

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.from("client_submissions").insert({
      artist_id: artist.profile.id,
      intent: submission.intent,
      selected_design_id: submission.selectedDesignId ?? null,
      body_area_group: submission.bodyAreaGroup,
      body_area_detail: submission.bodyAreaDetail,
      size_mode: submission.sizeMode,
      approximate_size_cm: submission.approximateSizeCm ?? null,
      size_category: submission.sizeCategory,
      width_cm: submission.widthCm ?? null,
      height_cm: submission.heightCm ?? null,
      reference_image_url: submission.referenceImage ?? null,
      reference_image_path: submission.referenceImagePath ?? null,
      reference_description: submission.referenceDescription?.trim() || null,
      city: bookingCities.length > 0 ? selectedBookingCity?.cityName ?? null : submission.city?.trim() || null,
      preferred_start_date: bookingCities.length > 0 ? submission.preferredStartDate || null : submission.preferredStartDate || null,
      preferred_end_date: bookingCities.length > 0 ? null : submission.preferredEndDate || null,
      style: submission.style,
      notes: combinedNotes || null,
      estimated_min: estimate.min,
      estimated_max: estimate.max,
      contact_message: message,
    });
  }

  return NextResponse.json({
    estimatedMin: estimate.min,
    estimatedMax: estimate.max,
    summary: buildEstimateSummary(submission, locale, selectedStyle?.label ?? null),
    disclaimer: copy.disclaimer,
    whatsappLink: buildWhatsAppLink(artist.profile.whatsappNumber, message),
    message,
  });
}
