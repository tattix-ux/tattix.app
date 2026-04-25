import { NextResponse } from "next/server";

import { getPublicArtistPageData } from "@/lib/data/artist";
import { submissionSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import { buildSubmissionMessage, buildWhatsAppLink } from "@/lib/messages";
import { estimateSubmissionPriceV2 } from "@/lib/pricing/v2";
import { hasFeaturedDesignPricingMetadata } from "@/lib/pricing/v2/featured-design";
import { getAreaScopeLabel, getRequestTypeLabel, getWideAreaTargetLabel } from "@/lib/pricing/v2/output";
import { hasUsablePricingV2Profile } from "@/lib/pricing/v2/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubmissionRequest } from "@/lib/types";

function resolveRequestedPricingSource(submission: SubmissionRequest) {
  if (submission.pricingSource) {
    return submission.pricingSource;
  }

  return submission.selectedDesignId ? "featured_design" : "custom_request";
}

function getUnavailableEstimateCopy(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Talebini sanatçıya ilet",
      body: "Talebin doğrudan sanatçıya iletilir. Sanatçı, detaylara göre sana net bir dönüş yapar.",
    };
  }

  return {
    title: "Send your request to the artist",
    body: "Your request goes straight to the artist. They will reply with a clear quote after reviewing the details.",
  };
}

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
  const pricingSource = resolveRequestedPricingSource(submission);
  const estimateAvailable =
    hasUsablePricingV2Profile(artist.pricingRules) &&
    (pricingSource !== "featured_design" || hasFeaturedDesignPricingMetadata(selectedDesign));
  const estimate = estimateAvailable
    ? estimateSubmissionPriceV2(submission, {
        locale,
        currency: artist.profile.currency,
        pricingRules: artist.pricingRules,
        featuredDesigns: artist.featuredDesigns,
      })
    : null;
  const requestTypeLabel = estimate?.requestType ?? submission.requestType
    ? getRequestTypeLabel((estimate?.requestType ?? submission.requestType)!, locale)
    : null;
  const areaScopeLabel =
    submission.areaScope === "wide_area" && submission.wideAreaTarget
      ? getWideAreaTargetLabel(submission.wideAreaTarget, locale)
      : submission.areaScope
        ? getAreaScopeLabel(submission.areaScope, locale)
        : null;
  const unavailableEstimateCopy = getUnavailableEstimateCopy(locale);
  const message = buildSubmissionMessage(
    submission,
    {
      locale,
      pricingSource: estimate?.pricingSource ?? pricingSource,
      requestTypeLabel,
      selectedDesignTitle: selectedDesign?.title ?? null,
      displayEstimateLabel: estimate?.displayLabel ?? null,
    },
  );
  const combinedNotes = [
    submission.notes?.trim(),
    submission.hasAllergy === null || submission.hasAllergy === undefined
      ? null
      : locale === "tr"
        ? `Alerji: ${submission.hasAllergy ? "Evet" : "Hayır"}`
        : `Allergy: ${submission.hasAllergy ? "Yes" : "No"}`,
    submission.hasAllergy && submission.allergyDetails?.trim()
      ? locale === "tr"
        ? `Alerji detayı: ${submission.allergyDetails.trim()}`
        : `Allergy details: ${submission.allergyDetails.trim()}`
      : null,
    submission.hasChronicCondition === null || submission.hasChronicCondition === undefined
      ? null
      : locale === "tr"
        ? `Kronik rahatsızlık: ${submission.hasChronicCondition ? "Evet" : "Hayır"}`
        : `Chronic condition: ${submission.hasChronicCondition ? "Yes" : "No"}`,
    submission.hasChronicCondition && submission.chronicConditionDetails?.trim()
      ? locale === "tr"
        ? `Rahatsızlık detayı: ${submission.chronicConditionDetails.trim()}`
        : `Condition details: ${submission.chronicConditionDetails.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const insertPayload = {
      artist_id: artist.profile.id,
      intent: submission.intent,
      area_scope: submission.areaScope ?? null,
      large_area_coverage: submission.largeAreaCoverage ?? null,
      wide_area_target: submission.wideAreaTarget ?? null,
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
      color_mode: submission.colorMode ?? null,
      work_style: submission.workStyle ?? null,
      realism_level: submission.realismLevel ?? null,
      layout_style: submission.layoutStyle ?? null,
      cover_up: submission.coverUp ?? null,
      style: "custom",
      notes: combinedNotes || null,
      estimated_min: estimate?.min ?? null,
      estimated_max: estimate?.max ?? null,
      pricing_version: "v2",
      pricing_source: estimate?.pricingSource ?? pricingSource,
      request_type: estimate?.requestType ?? submission.requestType ?? null,
      estimate_mode: estimate?.mode ?? null,
      featured_design_pricing_mode:
        estimate?.featuredDesignPricingMode ??
        (pricingSource === "featured_design" ? selectedDesign?.pricingMode ?? null : null),
      display_estimate_label: estimate?.displayLabel ?? null,
      contact_message: message,
      status: "new",
    };

    const { error } = await supabase.from("client_submissions").insert(insertPayload);

    if (
      error &&
      (error.message.toLowerCase().includes("status") ||
        error.message.toLowerCase().includes("customer_gender") ||
        error.message.toLowerCase().includes("customer_age_range") ||
        error.message.toLowerCase().includes("color_mode") ||
        error.message.toLowerCase().includes("work_style") ||
        error.message.toLowerCase().includes("realism_level") ||
        error.message.toLowerCase().includes("layout_style") ||
        error.message.toLowerCase().includes("area_scope") ||
        error.message.toLowerCase().includes("large_area_coverage") ||
        error.message.toLowerCase().includes("wide_area_target") ||
        error.message.toLowerCase().includes("cover_up") ||
        error.message.toLowerCase().includes("pricing_version") ||
        error.message.toLowerCase().includes("pricing_source") ||
        error.message.toLowerCase().includes("estimate_mode") ||
        error.message.toLowerCase().includes("display_estimate_label"))
    ) {
      const {
        status: _status,
        customer_gender: _customerGender,
        customer_age_range: _customerAgeRange,
        color_mode: _colorMode,
        work_style: _workStyle,
        realism_level: _realismLevel,
        layout_style: _layoutStyle,
        area_scope: _areaScope,
        large_area_coverage: _largeAreaCoverage,
        wide_area_target: _wideAreaTarget,
        cover_up: _coverUp,
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
    estimateAvailable,
    estimatedMin: estimate?.min ?? null,
    estimatedMax: estimate?.max ?? null,
    estimateMode: estimate?.mode ?? null,
    displayLabel: estimate?.displayLabel ?? null,
    summary:
      (estimate?.pricingSource ?? pricingSource) === "featured_design" && selectedDesign
        ? selectedDesign.title
        : requestTypeLabel ?? areaScopeLabel ?? "",
    disclaimer: estimate?.summaryText ?? unavailableEstimateCopy.body,
    whatsappLink: buildWhatsAppLink(artist.profile.whatsappNumber, message),
    message,
  });
}
