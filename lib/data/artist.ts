import { cache } from "react";
import { notFound } from "next/navigation";

import { demoArtistPageData } from "@/lib/demo-data";
import { CALIBRATION_SLOT_LABELS } from "@/lib/pricing/calibration-flow";
import { buildDefaultArtistTheme } from "@/lib/theme";
import type {
  ArtistBookingCity,
  ArtistFeaturedDesign,
  ArtistFunnelSettings,
  ArtistPageData,
  ArtistPageTheme,
  ArtistPricingRules,
  ArtistProfile,
  ArtistSavedTheme,
  ArtistStyleOption,
  ColorModeValue,
  DetailLevelValue,
  PriceRange,
  PricingCalibrationReferenceSlot,
} from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function mapArtistProfile(row: Record<string, unknown>): ArtistProfile {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    artistName: String(row.artist_name),
    slug: String(row.slug),
    profileImageUrl: row.profile_image_url ? String(row.profile_image_url) : null,
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
    shortBio: String(row.short_bio ?? ""),
    welcomeHeadline: String(row.welcome_headline ?? ""),
    whatsappNumber: String(row.whatsapp_number ?? ""),
    instagramHandle: String(row.instagram_handle ?? ""),
    currency: "TRY",
    active: Boolean(row.active),
    planType: String(row.plan_type ?? "free") as ArtistProfile["planType"],
    accessStatus: String(row.access_status ?? "active") as ArtistProfile["accessStatus"],
  };
}

function mapFunnelSettings(row: Record<string, unknown>, artistId: string): ArtistFunnelSettings {
  return {
    artistId,
    introEyebrow: String(row.intro_eyebrow ?? "Tattix intake"),
    introTitle: String(row.intro_title ?? ""),
    introDescription: String(row.intro_description ?? ""),
    showFeaturedDesigns: Boolean(row.show_featured_designs ?? true),
    defaultLanguage: String(row.default_language ?? "tr") as ArtistFunnelSettings["defaultLanguage"],
    bookingCities: [],
  };
}

function mapBookingCities(
  rows: Array<Record<string, unknown>>,
  dateRows: Array<Record<string, unknown>>,
): ArtistBookingCity[] {
  return rows
    .map((row) => {
      const locationId = String(row.id);
      const availableDates = dateRows
        .filter((dateRow) => String(dateRow.artist_location_id) === locationId)
        .map((dateRow) => String(dateRow.available_date))
        .sort();

      return {
        id: locationId,
        cityName: String(row.city_name),
        availableDates,
      };
    })
    .sort((left, right) => left.cityName.localeCompare(right.cityName, "tr"));
}

function mapStyleOption(row: Record<string, unknown>): ArtistStyleOption {
  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    styleKey: String(row.style_key) as ArtistStyleOption["styleKey"],
    label: String(row.label),
    description: row.style_description ? String(row.style_description) : null,
    imageUrl: row.example_image_url ? String(row.example_image_url) : null,
    imagePath: row.example_image_path ? String(row.example_image_path) : null,
    enabled: Boolean(row.enabled),
    multiplier: Number(row.multiplier ?? 1),
    isCustom: Boolean(row.is_custom ?? false),
    deleted: Boolean(row.deleted ?? false),
  };
}

function mapFeaturedDesign(row: Record<string, unknown>): ArtistFeaturedDesign {
  const rawCategory = String(row.category);

  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    category: (rawCategory === "wanna-do-designs" ? "flash-designs" : rawCategory) as ArtistFeaturedDesign["category"],
    title: String(row.title),
    shortDescription: String(row.short_description ?? ""),
    imageUrl: row.image_url ? String(row.image_url) : null,
    imagePath: row.image_path ? String(row.image_path) : null,
    priceNote: row.price_note ? String(row.price_note) : null,
    referenceDetailLevel:
      row.reference_detail_level ? String(row.reference_detail_level) as DetailLevelValue : null,
    referencePriceMin:
      row.reference_price_min === null ? null : Number(row.reference_price_min),
    referencePriceMax:
      row.reference_price_max === null ? null : Number(row.reference_price_max),
    active: Boolean(row.active ?? true),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function midpoint(range: PriceRange | undefined) {
  if (!range) {
    return null;
  }

  return (Number(range.min ?? 0) + Number(range.max ?? 0)) / 2;
}

function normalizeRange(
  value: unknown,
  fallback: PriceRange,
): PriceRange {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Record<string, unknown>;
  const min = Number(candidate.min ?? fallback.min);
  const max = Number(candidate.max ?? fallback.max);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return fallback;
  }

  return {
    min: Math.max(0, min),
    max: Math.max(Math.max(0, min), max),
  };
}

function buildDefaultCalibrationReferenceSlots(): PricingCalibrationReferenceSlot[] {
  return CALIBRATION_SLOT_LABELS.map((slot) => ({ ...slot }));
}

function mapPricingRules(row: Record<string, unknown>, artistId: string): ArtistPricingRules {
  const minimumSessionPrice = Number(row.minimum_session_price ?? 0);
  const sizeBaseRanges = row.size_base_ranges as ArtistPricingRules["sizeBaseRanges"];
  const anchorPrice =
    Number(row.anchor_price) ||
    Number(row.base_price) ||
    midpoint(sizeBaseRanges?.small) ||
    midpoint(sizeBaseRanges?.medium) ||
    minimumSessionPrice ||
    3000;
  const basePrice =
    Number(row.base_price) ||
    midpoint(sizeBaseRanges?.medium) ||
    midpoint(sizeBaseRanges?.small) ||
    minimumSessionPrice ||
    3000;
  const minimumCharge = Number(row.minimum_charge ?? minimumSessionPrice ?? 0);
  const defaultSizeModifiers = {
    tiny: normalizeRange(
      sizeBaseRanges?.tiny
        ? {
            min: sizeBaseRanges.tiny.min / basePrice,
            max: sizeBaseRanges.tiny.max / basePrice,
          }
        : null,
      { min: 0.35, max: 0.6 },
    ),
    small: normalizeRange(
      sizeBaseRanges?.small
        ? {
            min: sizeBaseRanges.small.min / basePrice,
            max: sizeBaseRanges.small.max / basePrice,
          }
        : null,
      { min: 0.55, max: 0.85 },
    ),
    medium: normalizeRange(
      sizeBaseRanges?.medium
        ? {
            min: sizeBaseRanges.medium.min / basePrice,
            max: sizeBaseRanges.medium.max / basePrice,
          }
        : null,
      { min: 0.95, max: 1.2 },
    ),
    large: normalizeRange(
      sizeBaseRanges?.large
        ? {
            min: sizeBaseRanges.large.min / basePrice,
            max: sizeBaseRanges.large.max / basePrice,
          }
        : null,
      { min: 1.8, max: 2.4 },
    ),
  } satisfies ArtistPricingRules["sizeModifiers"];
  const legacyPlacementMultipliers =
    (row.placement_multipliers as ArtistPricingRules["placementMultipliers"]) ?? {};
  const placementModifiers = Object.fromEntries(
    Object.entries(
      (row.placement_modifiers as ArtistPricingRules["placementModifiers"]) ?? {},
    ).map(([key, value]) => [key, normalizeRange(value, { min: 1, max: 1 })]),
  ) as ArtistPricingRules["placementModifiers"];
  const derivedPlacementModifiers = Object.fromEntries(
    Object.entries(legacyPlacementMultipliers).map(([key, value]) => [
      key,
      normalizeRange({ min: value, max: value }, { min: 1, max: 1 }),
    ]),
  ) as ArtistPricingRules["placementModifiers"];
  const detailDefaults: Record<DetailLevelValue, PriceRange> = {
    simple: { min: 0.9, max: 1 },
    standard: { min: 1, max: 1.15 },
    detailed: { min: 1.15, max: 1.35 },
  };
  const colorDefaults: Record<ColorModeValue, PriceRange> = {
    "black-only": { min: 0.95, max: 1 },
    "black-grey": { min: 1, max: 1.1 },
    "full-color": { min: 1.18, max: 1.35 },
  };
  const sizeModifiers = {
    tiny: normalizeRange((row.size_modifiers as Record<string, unknown> | undefined)?.tiny, defaultSizeModifiers.tiny),
    small: normalizeRange((row.size_modifiers as Record<string, unknown> | undefined)?.small, defaultSizeModifiers.small),
    medium: normalizeRange((row.size_modifiers as Record<string, unknown> | undefined)?.medium, defaultSizeModifiers.medium),
    large: normalizeRange((row.size_modifiers as Record<string, unknown> | undefined)?.large, defaultSizeModifiers.large),
  };
  const detailLevelModifiers = {
    simple: normalizeRange((row.detail_level_modifiers as Record<string, unknown> | undefined)?.simple, detailDefaults.simple),
    standard: normalizeRange((row.detail_level_modifiers as Record<string, unknown> | undefined)?.standard, detailDefaults.standard),
    detailed: normalizeRange((row.detail_level_modifiers as Record<string, unknown> | undefined)?.detailed, detailDefaults.detailed),
  };
  const colorModeModifiers = {
    "black-only": normalizeRange((row.color_mode_modifiers as Record<string, unknown> | undefined)?.["black-only"], colorDefaults["black-only"]),
    "black-grey": normalizeRange((row.color_mode_modifiers as Record<string, unknown> | undefined)?.["black-grey"], colorDefaults["black-grey"]),
    "full-color": normalizeRange((row.color_mode_modifiers as Record<string, unknown> | undefined)?.["full-color"], colorDefaults["full-color"]),
  };
  const placementModifiersResolved =
    Object.keys(placementModifiers).length > 0 ? placementModifiers : derivedPlacementModifiers;
  const defaultCalibrationExamples = {
      size: {
        tiny: Math.round(anchorPrice * midpoint(sizeModifiers.tiny)!),
        small: Math.round(anchorPrice * midpoint(sizeModifiers.small)!),
        medium: Math.round(anchorPrice * midpoint(sizeModifiers.medium)!),
        large: Math.round(anchorPrice * midpoint(sizeModifiers.large)!),
      },
      sizeCurve: {
        "8": Math.round(anchorPrice * midpoint(sizeModifiers.tiny)!),
        "12": Math.round(anchorPrice * midpoint(sizeModifiers.small)!),
        "18": Math.round(anchorPrice * midpoint(sizeModifiers.medium)!),
        "25": Math.round(anchorPrice * midpoint(sizeModifiers.large)!),
      },
      detailLevel: {
        simple: Math.round(anchorPrice * midpoint(detailLevelModifiers.simple)!),
        standard: Math.round(anchorPrice * midpoint(detailLevelModifiers.standard)!),
        detailed: Math.round(anchorPrice * midpoint(detailLevelModifiers.detailed)!),
        ultra: Math.round(anchorPrice * Math.max((midpoint(detailLevelModifiers.detailed) ?? 1.18) * 1.14, 1.34)),
      },
      placement: Object.fromEntries(
        Object.entries(placementModifiersResolved).map(([key, value]) => [
          key,
          Math.round(anchorPrice * (midpoint(value) ?? 1)),
        ]),
      ),
      placementDifficulty: {
        easy: Math.round(anchorPrice * 1),
        medium: Math.round(anchorPrice * 1.1),
        hard: Math.round(anchorPrice * 1.18),
      },
      colorMode: {
        "black-only": Math.round(anchorPrice * midpoint(colorModeModifiers["black-only"])!),
        "black-grey": Math.round(anchorPrice * midpoint(colorModeModifiers["black-grey"])!),
        "full-color": Math.round(anchorPrice * midpoint(colorModeModifiers["full-color"])!),
      },
      globalScale: 1,
      detailCalibration: null,
      pricingRawInputs: null,
      pricingProfile: null,
      finalValidation: {
        validationRound: 1 as const,
        perExampleFeedback: {},
        appliedGlobalValidationAdjustment: 1,
        validationStatus: "pending" as const,
        calibratedAndValidated: false,
      },
    };
  const storedCalibrationExamples =
    (row.calibration_examples as ArtistPricingRules["calibrationExamples"] | undefined) ?? undefined;
  const calibrationExamples: ArtistPricingRules["calibrationExamples"] = {
    size: storedCalibrationExamples?.size ?? defaultCalibrationExamples.size,
    sizeCurve: storedCalibrationExamples?.sizeCurve ?? defaultCalibrationExamples.sizeCurve,
    detailLevel: {
      ...(storedCalibrationExamples?.detailLevel ?? defaultCalibrationExamples.detailLevel),
      ultra:
        storedCalibrationExamples?.detailLevel?.ultra ??
        defaultCalibrationExamples.detailLevel.ultra,
    },
    placement: storedCalibrationExamples?.placement ?? defaultCalibrationExamples.placement,
    placementDifficulty: {
      easy:
        storedCalibrationExamples?.placementDifficulty?.easy ??
        defaultCalibrationExamples.placementDifficulty.easy,
      medium:
        storedCalibrationExamples?.placementDifficulty?.medium ??
        defaultCalibrationExamples.placementDifficulty.medium,
      hard:
        storedCalibrationExamples?.placementDifficulty?.hard ??
        defaultCalibrationExamples.placementDifficulty.hard,
    },
    colorMode: storedCalibrationExamples?.colorMode ?? defaultCalibrationExamples.colorMode,
    globalScale:
      typeof storedCalibrationExamples?.globalScale === "number" &&
      Number.isFinite(storedCalibrationExamples.globalScale)
        ? storedCalibrationExamples.globalScale
        : defaultCalibrationExamples.globalScale,
    detailCalibration: storedCalibrationExamples?.detailCalibration ?? defaultCalibrationExamples.detailCalibration,
    pricingRawInputs: storedCalibrationExamples?.pricingRawInputs ?? defaultCalibrationExamples.pricingRawInputs,
    pricingProfile: storedCalibrationExamples?.pricingProfile ?? defaultCalibrationExamples.pricingProfile,
    finalValidation:
      storedCalibrationExamples?.finalValidation ?? defaultCalibrationExamples.finalValidation,
  };
  const calibrationReferenceSlots =
    (row.calibration_reference_slots as PricingCalibrationReferenceSlot[] | undefined) ??
    buildDefaultCalibrationReferenceSlots();

  return {
    artistId,
    anchorPrice,
    basePrice,
    minimumCharge,
    calibrationExamples,
    calibrationReferenceSlots,
    sizeModifiers,
    placementModifiers: placementModifiersResolved,
    detailLevelModifiers,
    colorModeModifiers,
    addonFees: {
      coverUp: normalizeRange((row.addon_fees as Record<string, unknown> | undefined)?.coverUp, {
        min: 500,
        max: 1500,
      }),
      customDesign: normalizeRange((row.addon_fees as Record<string, unknown> | undefined)?.customDesign, {
        min: 250,
        max: 1000,
      }),
    },
    minimumSessionPrice,
    sizeBaseRanges,
    sizeTimeRanges:
      (row.size_time_ranges as ArtistPricingRules["sizeTimeRanges"]) ?? {
        tiny: { minHours: 0.5, maxHours: 1 },
        small: { minHours: 1, maxHours: 2 },
        medium: { minHours: 2, maxHours: 4 },
        large: { minHours: 4, maxHours: 6 },
      },
    placementMultipliers: legacyPlacementMultipliers,
    intentMultipliers:
      (row.intent_multipliers as ArtistPricingRules["intentMultipliers"]) ?? {},
  };
}

function mapPageTheme(row: Record<string, unknown>, artistId: string): ArtistPageTheme {
  const defaults = buildDefaultArtistTheme();

  return {
    ...defaults,
    artistId,
    presetTheme: String(row.preset_theme ?? defaults.presetTheme) as ArtistPageTheme["presetTheme"],
    backgroundType: String(
      row.background_type ?? defaults.backgroundType,
    ) as ArtistPageTheme["backgroundType"],
    backgroundColor: String(row.background_color ?? defaults.backgroundColor),
    gradientStart: String(row.gradient_start ?? defaults.gradientStart),
    gradientEnd: String(row.gradient_end ?? defaults.gradientEnd),
    backgroundImageUrl: row.background_image_url ? String(row.background_image_url) : null,
    textColor: String(row.text_color ?? defaults.textColor),
    primaryColor: String(row.primary_color ?? defaults.primaryColor),
    secondaryColor: String(row.secondary_color ?? defaults.secondaryColor),
    cardColor: String(row.card_color ?? defaults.cardColor),
    cardOpacity: Number(row.card_opacity ?? defaults.cardOpacity),
    headingFont: String(row.heading_font ?? defaults.headingFont) as ArtistPageTheme["headingFont"],
    bodyFont: String(row.body_font ?? defaults.bodyFont) as ArtistPageTheme["bodyFont"],
    fontPairingPreset: String(
      row.font_pairing_preset ?? defaults.fontPairingPreset,
    ) as ArtistPageTheme["fontPairingPreset"],
    radiusStyle: String(
      row.radius_style ?? defaults.radiusStyle,
    ) as ArtistPageTheme["radiusStyle"],
    themeMode: String(row.theme_mode ?? defaults.themeMode) as ArtistPageTheme["themeMode"],
    customWelcomeTitle: row.custom_welcome_title ? String(row.custom_welcome_title) : null,
    customIntroText: row.custom_intro_text ? String(row.custom_intro_text) : null,
    customCtaLabel: row.custom_cta_label ? String(row.custom_cta_label) : null,
    featuredSectionLabel1: row.featured_section_label_1
      ? String(row.featured_section_label_1)
      : null,
    featuredSectionLabel2: row.featured_section_label_2
      ? String(row.featured_section_label_2)
      : null,
  };
}

function mapSavedTheme(row: Record<string, unknown>, artistId: string): ArtistSavedTheme {
  return {
    id: String(row.id),
    artistId,
    name: String(row.name ?? "Tema"),
    theme: mapPageTheme((row.theme_snapshot ?? {}) as Record<string, unknown>, artistId),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

const fetchArtistBundleById = cache(async function fetchArtistBundleById(artistId: string) {
  const supabase = await createSupabaseServerClient();
  const [artistRow, funnelSettingsRow, styleRows, designRows, pricingRulesRow, pageThemeRow, savedThemesRows, bookingLocationRows] =
    await Promise.all([
      supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
      supabase
        .from("artist_funnel_settings")
        .select("*")
        .eq("artist_id", artistId)
        .maybeSingle(),
      supabase
        .from("artist_style_options")
        .select("*")
        .eq("artist_id", artistId)
        .order("label"),
      supabase
        .from("artist_featured_designs")
        .select("*")
        .eq("artist_id", artistId)
        .order("sort_order"),
      supabase
        .from("artist_pricing_rules")
        .select("*")
        .eq("artist_id", artistId)
        .maybeSingle(),
      supabase
        .from("artist_page_themes")
        .select("*")
        .eq("artist_id", artistId)
        .maybeSingle(),
      supabase
        .from("artist_saved_themes")
        .select("*")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: true }),
      supabase
        .from("artist_booking_locations")
        .select("*")
        .eq("artist_id", artistId)
        .order("city_name"),
    ]);

  const bookingLocationIds =
    (bookingLocationRows.data ?? []).map((row) => String((row as Record<string, unknown>).id));
  const bookingDateRows =
    bookingLocationIds.length > 0
      ? await supabase
          .from("artist_booking_location_dates")
          .select("*")
          .in("artist_location_id", bookingLocationIds)
          .order("available_date")
      : { data: [], error: null };

  if (!artistRow.data) {
    return null;
  }

  return {
    profile: mapArtistProfile(artistRow.data as Record<string, unknown>),
    funnelSettings: {
      ...mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId),
      bookingCities: mapBookingCities(
        (bookingLocationRows.data ?? []) as Array<Record<string, unknown>>,
        (bookingDateRows.data ?? []) as Array<Record<string, unknown>>,
      ),
    },
    styleOptions: (styleRows.data ?? [])
      .map((row) => mapStyleOption(row as Record<string, unknown>))
      .filter((style) => !style.deleted),
    featuredDesigns: (designRows.data ?? []).map((row) =>
      mapFeaturedDesign(row as Record<string, unknown>),
    ),
    pricingRules: mapPricingRules(
      (pricingRulesRow.data ?? {}) as Record<string, unknown>,
      artistId,
    ),
    pageTheme: mapPageTheme((pageThemeRow.data ?? {}) as Record<string, unknown>, artistId),
    savedThemes: (savedThemesRows.data ?? []).map((row) =>
      mapSavedTheme(row as Record<string, unknown>, artistId),
    ),
  } satisfies ArtistPageData;
});

export async function getPublicArtistPageData(slug: string): Promise<ArtistPageData> {
  if (!isSupabaseConfigured()) {
    if (slug === demoArtistPageData.profile.slug) {
      return demoArtistPageData;
    }

    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: artistRow } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!artistRow) {
    notFound();
  }

  const bundle = await fetchArtistBundleById(String(artistRow.id));

  if (!bundle) {
    notFound();
  }

  return bundle;
}

export async function getArtistPageDataById(artistId: string) {
  return fetchArtistBundleById(artistId);
}
