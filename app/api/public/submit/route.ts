import { NextResponse } from "next/server";

import { getPublicArtistPageData } from "@/lib/data/artist";
import { submissionSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import { buildSubmissionMessage, buildWhatsAppLink } from "@/lib/messages";
import { estimateSubmissionPriceV2 } from "@/lib/pricing/v2";
import { getRequestTypeLabel } from "@/lib/pricing/v2/output";
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
  const estimate = estimateSubmissionPriceV2(submission, {
    locale,
    currency: artist.profile.currency,
    pricingRules: artist.pricingRules,
    featuredDesigns: artist.featuredDesigns,
  });
  const requestTypeLabel = estimate.requestType
    ? getRequestTypeLabel(estimate.requestType, locale)
    : null;
  const message = buildSubmissionMessage(
    submission,
    {
      locale,
      pricingSource: estimate.pricingSource,
      requestTypeLabel,
      selectedDesignTitle: selectedDesign?.title ?? null,
      displayEstimateLabel: estimate.displayLabel,
    },
  );
  const combinedNotes = [
    submission.notes?.trim(),
  ]
    .filter(Boolean)
    .join(" | ");

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const insertPayload = {
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
      customer_gender: submission.gender ?? null,
      customer_age_range: submission.ageRange ?? null,
      work_style: submission.workStyle ?? null,
      style: submission.style ?? "custom",
      notes: combinedNotes || null,
      estimated_min: estimate.min,
      estimated_max: estimate.max ?? estimate.min,
      pricing_version: "v2",
      pricing_source: estimate.pricingSource,
      request_type: estimate.requestType,
      estimate_mode: estimate.mode,
      featured_design_pricing_mode: estimate.featuredDesignPricingMode,
      display_estimate_label: estimate.displayLabel,
      contact_message: message,
      status: "new",
    };

    const { error } = await supabase.from("client_submissions").insert(insertPayload);

    if (
      error &&
      (error.message.toLowerCase().includes("status") ||
        error.message.toLowerCase().includes("customer_gender") ||
        error.message.toLowerCase().includes("customer_age_range") ||
        error.message.toLowerCase().includes("work_style") ||
        error.message.toLowerCase().includes("pricing_version") ||
        error.message.toLowerCase().includes("pricing_source") ||
        error.message.toLowerCase().includes("estimate_mode") ||
        error.message.toLowerCase().includes("display_estimate_label"))
    ) {
      const {
        status: _status,
        customer_gender: _customerGender,
        customer_age_range: _customerAgeRange,
        work_style: _workStyle,
        pricing_version: _pricingVersion,
        pricing_source: _pricingSource,
        request_type: _requestType,
        estimate_mode: _estimateMode,
        featured_design_pricing_mode: _featuredDesignPricingMode,
        display_estimate_label: _displayEstimateLabel,
        ...legacyPayload
      } = insertPayload;
      await supabase.from("client_submissions").insert(legacyPayload);
    }
  }

  return NextResponse.json({
    estimatedMin: estimate.min,
    estimatedMax: estimate.max ?? estimate.min,
    estimateMode: estimate.mode,
    displayLabel: estimate.displayLabel,
    summary:
      estimate.pricingSource === "featured_design" && selectedDesign
        ? selectedDesign.title
        : requestTypeLabel ?? "",
    disclaimer: estimate.summaryText,
    whatsappLink: buildWhatsAppLink(artist.profile.whatsappNumber, message),
    message,
  });
}
