import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { demoArtistPageData, demoLeads } from "@/lib/demo-data";
import { styleOptions as baseStyleOptions } from "@/lib/constants/options";
import type { ArtistPageData, ArtistProfile, ClientSubmission, DashboardData, LeadStatus } from "@/lib/types";
import { CALIBRATION_SLOT_LABELS } from "@/lib/pricing/calibration-flow";
import { buildPricingV2Profile } from "@/lib/pricing/v2/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getArtistPageDataById,
  mapArtistProfile,
  mapBookingCities,
  mapFeaturedDesign,
  mapFunnelSettings,
  mapPageTheme,
  mapPricingRules,
  mapSavedTheme,
  mapStyleOption,
} from "@/lib/data/artist";
import { slugify } from "@/lib/utils";

function deriveLeadStatus(row: Record<string, unknown>): LeadStatus {
  const explicitStatus = typeof row.status === "string" ? String(row.status) : null;

  if (
    explicitStatus === "new" ||
    explicitStatus === "contacted" ||
    explicitStatus === "sold" ||
    explicitStatus === "lost"
  ) {
    return explicitStatus;
  }

  if (Boolean(row.converted_to_sale)) {
    return "sold";
  }

  if (Boolean(row.contacted)) {
    return "contacted";
  }

  return "new";
}

function mapLead(row: Record<string, unknown>): ClientSubmission {
  const status = deriveLeadStatus(row);

  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    status,
    pricingVersion: row.pricing_version ? String(row.pricing_version) : null,
    pricingSource: row.pricing_source ? String(row.pricing_source) as ClientSubmission["pricingSource"] : null,
    areaScope: row.area_scope ? String(row.area_scope) as ClientSubmission["areaScope"] : null,
    largeAreaCoverage: row.large_area_coverage ? String(row.large_area_coverage) as ClientSubmission["largeAreaCoverage"] : null,
    wideAreaTarget: row.wide_area_target ? String(row.wide_area_target) as ClientSubmission["wideAreaTarget"] : null,
    requestType: row.request_type ? String(row.request_type) as ClientSubmission["requestType"] : null,
    estimateMode: row.estimate_mode ? String(row.estimate_mode) as ClientSubmission["estimateMode"] : null,
    featuredDesignPricingMode:
      row.featured_design_pricing_mode
        ? String(row.featured_design_pricing_mode) as ClientSubmission["featuredDesignPricingMode"]
        : null,
    displayEstimateLabel: row.display_estimate_label ? String(row.display_estimate_label) : null,
    intent: String(row.intent) as ClientSubmission["intent"],
    selectedDesignId: row.selected_design_id ? String(row.selected_design_id) : null,
    bodyAreaGroup: String(row.body_area_group) as ClientSubmission["bodyAreaGroup"],
    bodyAreaDetail: String(row.body_area_detail) as ClientSubmission["bodyAreaDetail"],
    sizeMode: row.size_mode ? (String(row.size_mode) as ClientSubmission["sizeMode"]) : null,
    approximateSizeCm:
      row.approximate_size_cm === null ? null : Number(row.approximate_size_cm),
    sizeCategory: String(row.size_category) as ClientSubmission["sizeCategory"],
    widthCm: row.width_cm === null ? null : Number(row.width_cm),
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    referenceImageUrl: row.reference_image_url ? String(row.reference_image_url) : null,
    referenceImagePath: row.reference_image_path ? String(row.reference_image_path) : null,
    referenceDescription: row.reference_description ? String(row.reference_description) : null,
    city: row.city ? String(row.city) : null,
    preferredStartDate: row.preferred_start_date ? String(row.preferred_start_date) : null,
    preferredEndDate: row.preferred_end_date ? String(row.preferred_end_date) : null,
    gender: row.customer_gender ? String(row.customer_gender) as ClientSubmission["gender"] : null,
    ageRange: row.customer_age_range ? String(row.customer_age_range) as ClientSubmission["ageRange"] : null,
    colorMode: row.color_mode ? String(row.color_mode) as ClientSubmission["colorMode"] : null,
    workStyle: row.work_style ? String(row.work_style) as ClientSubmission["workStyle"] : null,
    realismLevel: row.realism_level ? String(row.realism_level) as ClientSubmission["realismLevel"] : null,
    layoutStyle: row.layout_style ? String(row.layout_style) as ClientSubmission["layoutStyle"] : null,
    coverUp:
      typeof row.cover_up === "boolean"
        ? row.cover_up
        : row.cover_up === null || row.cover_up === undefined
          ? null
          : Boolean(row.cover_up),
    style: String(row.style) as ClientSubmission["style"],
    notes: row.notes ? String(row.notes) : null,
    estimatedMin: Number(row.estimated_min),
    estimatedMax: Number(row.estimated_max),
    contactMessage: String(row.contact_message ?? ""),
    contacted: status === "contacted" || status === "sold",
    convertedToSale: status === "sold",
    soldAt: status === "sold" && row.sold_at ? String(row.sold_at) : null,
    createdAt: String(row.created_at),
    updatedAt: row.updated_at ? String(row.updated_at) : String(row.created_at),
  };
}

function normalizeAuthenticatedArtist(row: Record<string, unknown>): ArtistProfile {
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

export type DashboardCoreData = ArtistPageData & {
  demoMode: boolean;
};

async function resolveDashboardArtistId(userId: string | null) {
  if (!isSupabaseConfigured() || !userId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingArtist } = await supabase
    .from("artists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingArtist?.id) {
    return String(existingArtist.id);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const artist = await ensureArtistForUser(user);
  return artist?.id ? String(artist.id) : null;
}

export const getDashboardCoreData = cache(async function getDashboardCoreData(
  userId: string | null,
): Promise<DashboardCoreData> {
  const artistId = await resolveDashboardArtistId(userId);

  if (!artistId) {
    return {
      ...demoArtistPageData,
      demoMode: true,
    };
  }

  const pageData = await getArtistPageDataById(artistId);

  if (!pageData) {
    return {
      ...demoArtistPageData,
      demoMode: true,
    };
  }

  return {
    ...pageData,
    demoMode: false,
  };
});

export const getDashboardData = cache(async function getDashboardData(
  userId: string | null,
): Promise<DashboardData> {
  const coreData = await getDashboardCoreData(userId);

  if (coreData.demoMode) {
    return {
      ...coreData,
      leads: demoLeads,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: leadsRows } = await supabase
    .from("client_submissions")
    .select("*")
    .eq("artist_id", coreData.profile.id)
    .order("created_at", { ascending: false });

  return {
    ...coreData,
    leads: (leadsRows ?? []).map((row) => mapLead(row as Record<string, unknown>)),
  };
});

export const getDashboardShellData = cache(async function getDashboardShellData(
  userId: string | null,
): Promise<Pick<DashboardCoreData, "profile" | "funnelSettings" | "demoMode">> {
  const artistId = await resolveDashboardArtistId(userId);

  if (!artistId) {
    return {
      profile: demoArtistPageData.profile,
      funnelSettings: demoArtistPageData.funnelSettings,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [artistRow, funnelSettingsRow] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
    supabase.from("artist_funnel_settings").select("*").eq("artist_id", artistId).maybeSingle(),
  ]);

  return {
    profile: mapArtistProfile((artistRow.data ?? {}) as Record<string, unknown>),
    funnelSettings: {
      ...mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId),
      bookingCities: [],
    },
    demoMode: false,
  };
});

export const getDashboardPricingData = cache(async function getDashboardPricingData(
  userId: string | null,
) {
  const artistId = await resolveDashboardArtistId(userId);

  if (!artistId) {
    return {
      pricingRules: demoArtistPageData.pricingRules,
      locale: demoArtistPageData.funnelSettings.defaultLanguage,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [funnelSettingsRow, pricingRulesRow] = await Promise.all([
    supabase.from("artist_funnel_settings").select("*").eq("artist_id", artistId).maybeSingle(),
    supabase.from("artist_pricing_rules").select("*").eq("artist_id", artistId).maybeSingle(),
  ]);

  return {
    pricingRules: mapPricingRules((pricingRulesRow.data ?? {}) as Record<string, unknown>, artistId),
    locale: mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId)
      .defaultLanguage,
    demoMode: false,
  };
});

export async function getDashboardDesignsData(userId: string | null) {
  const artistId = await resolveDashboardArtistId(userId);

  if (!artistId) {
    return {
      profile: demoArtistPageData.profile,
      locale: demoArtistPageData.funnelSettings.defaultLanguage,
      featuredDesigns: demoArtistPageData.featuredDesigns,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [artistRow, funnelSettingsRow, designRows] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
    supabase.from("artist_funnel_settings").select("*").eq("artist_id", artistId).maybeSingle(),
    supabase.from("artist_featured_designs").select("*").eq("artist_id", artistId).order("sort_order"),
  ]);

  return {
    profile: mapArtistProfile((artistRow.data ?? {}) as Record<string, unknown>),
    locale: mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId)
      .defaultLanguage,
    featuredDesigns: (designRows.data ?? []).map((row) => mapFeaturedDesign(row as Record<string, unknown>)),
    demoMode: false,
  };
}

export const getDashboardCustomizeData = cache(async function getDashboardCustomizeData(
  userId: string | null,
) {
  const artistId = await resolveDashboardArtistId(userId);

  if (!artistId) {
    return {
      profile: demoArtistPageData.profile,
      funnelSettings: demoArtistPageData.funnelSettings,
      pageTheme: demoArtistPageData.pageTheme,
      savedThemes: demoArtistPageData.savedThemes,
      locale: demoArtistPageData.funnelSettings.defaultLanguage,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [artistRow, funnelSettingsRow, pageThemeRow, savedThemesRows] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
    supabase.from("artist_funnel_settings").select("*").eq("artist_id", artistId).maybeSingle(),
    supabase.from("artist_page_themes").select("*").eq("artist_id", artistId).maybeSingle(),
    supabase.from("artist_saved_themes").select("*").eq("artist_id", artistId).order("created_at", { ascending: true }),
  ]);

  return {
    profile: mapArtistProfile((artistRow.data ?? {}) as Record<string, unknown>),
    funnelSettings: {
      ...mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId),
      bookingCities: [],
    },
    pageTheme: mapPageTheme((pageThemeRow.data ?? {}) as Record<string, unknown>, artistId),
    savedThemes: (savedThemesRows.data ?? []).map((row) =>
      mapSavedTheme(row as Record<string, unknown>, artistId),
    ),
    locale: mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId)
      .defaultLanguage,
    demoMode: false,
  };
});

export const getDashboardProfileData = cache(async function getDashboardProfileData(
  userId: string | null,
) {
  const artistId = await resolveDashboardArtistId(userId);

  if (!artistId) {
    return {
      profile: demoArtistPageData.profile,
      funnelSettings: demoArtistPageData.funnelSettings,
      pageTheme: demoArtistPageData.pageTheme,
      styleOptions: demoArtistPageData.styleOptions,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const [artistRow, funnelSettingsRow, styleRows, pageThemeRow, bookingLocationRows] = await Promise.all([
    supabase.from("artists").select("*").eq("id", artistId).maybeSingle(),
    supabase.from("artist_funnel_settings").select("*").eq("artist_id", artistId).maybeSingle(),
    supabase.from("artist_style_options").select("*").eq("artist_id", artistId),
    supabase.from("artist_page_themes").select("*").eq("artist_id", artistId).maybeSingle(),
    supabase.from("artist_booking_locations").select("*").eq("artist_id", artistId).order("city_name"),
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

  return {
    profile: mapArtistProfile((artistRow.data ?? {}) as Record<string, unknown>),
    funnelSettings: {
      ...mapFunnelSettings((funnelSettingsRow.data ?? {}) as Record<string, unknown>, artistId),
      bookingCities: mapBookingCities(
        (bookingLocationRows.data ?? []) as Array<Record<string, unknown>>,
        (bookingDateRows.data ?? []) as Array<Record<string, unknown>>,
      ),
    },
    pageTheme: mapPageTheme((pageThemeRow.data ?? {}) as Record<string, unknown>, artistId),
    styleOptions: ((styleRows.data ?? []) as Array<Record<string, unknown>>).map((row) =>
      mapStyleOption(row),
    ),
    demoMode: false,
  };
});

async function reserveUniqueSlug(preferredSlug: string) {
  const supabase = await createSupabaseServerClient();
  const base = slugify(preferredSlug) || `artist-${Date.now().toString().slice(-6)}`;
  let attempt = base;
  let suffix = 1;

  while (true) {
    const { data } = await supabase
      .from("artists")
      .select("id")
      .eq("slug", attempt)
      .maybeSingle();

    if (!data) {
      return attempt;
    }

    attempt = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function ensureArtistForUser(user: User) {
  const supabase = await createSupabaseServerClient();
  const { data: existingArtist } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingArtist) {
    return existingArtist;
  }

  const desiredSlug =
    String(user.user_metadata?.slug ?? user.user_metadata?.artist_name ?? user.email ?? user.id);
  const slug = await reserveUniqueSlug(desiredSlug);
  const artistName =
    String(user.user_metadata?.artist_name ?? user.email?.split("@")[0] ?? "Tattix Artist");

  const { data: artist, error } = await supabase
    .from("artists")
    .insert({
      user_id: user.id,
      artist_name: artistName,
      slug,
      short_bio: "Tell clients what kind of work you love making most.",
      welcome_headline: "Start your tattoo brief in under two minutes.",
      whatsapp_number: "+905550000000",
      instagram_handle: "@yourstudio",
      currency: "TRY",
      active: true,
      plan_type: "free",
      access_status: "active",
    })
    .select("*")
    .single();

  if (error || !artist) {
    throw error ?? new Error("Unable to create artist profile.");
  }

  await Promise.all([
    supabase.from("artist_funnel_settings").upsert({
      artist_id: artist.id,
      intro_eyebrow: "",
      intro_title: "",
      intro_description: "",
      show_featured_designs: true,
      default_language: "tr",
    }),
    supabase.from("artist_pricing_rules").upsert({
      artist_id: artist.id,
      pricing_version: "v2",
      anchor_price: 2400,
      base_price: 3200,
      minimum_charge: 1500,
      minimum_session_price: 1500,
      calibration_examples: {
        size: {
          tiny: 1200,
          small: 1800,
          medium: 2800,
          large: 5200,
        },
        sizeCurve: {
          "8": 1700,
          "12": 2400,
          "18": 3400,
          "25": 5200,
        },
        detailLevel: {
          simple: 2100,
          standard: 2400,
          detailed: 3200,
        },
        placement: {},
        placementDifficulty: {
          easy: 2400,
          hard: 3050,
        },
        colorMode: {
          "black-only": 2400,
          "black-grey": 2700,
          "full-color": 3300,
        },
        globalScale: 1,
        detailCalibration: null,
        pricingRawInputs: null,
        pricingProfile: null,
        pricingV2Profile: buildPricingV2Profile({
          minimumJobPrice: 1500,
          textStartingPrice: 1500,
          onboardingCases: [
            { id: "object-6cm-forearm", min: 1800, max: 2200 },
            { id: "object-10cm-forearm", min: 2200, max: 3000 },
            { id: "object-16cm-forearm", min: 3200, max: 4200 },
            { id: "single-figure-12cm-upper-arm", min: 3000, max: 4200 },
            { id: "ornamental-small-hard", min: 2700, max: 3800 },
            { id: "medium-color-piece", min: 3400, max: 4700 },
            { id: "small-cover-up", min: 3000, max: 4200 },
          ],
          reviewCases: [],
        }),
      },
      calibration_reference_slots: CALIBRATION_SLOT_LABELS.map((slot) => ({ ...slot })),
      size_modifiers: {
        tiny: { min: 0.35, max: 0.6 },
        small: { min: 0.55, max: 0.85 },
        medium: { min: 0.95, max: 1.2 },
        large: { min: 1.8, max: 2.4 },
      },
      size_base_ranges: {
        tiny: { min: 1000, max: 1800 },
        small: { min: 1500, max: 2500 },
        medium: { min: 3000, max: 5000 },
        large: { min: 6000, max: 9000 },
      },
      placement_modifiers: {},
      detail_level_modifiers: {
        simple: { min: 0.9, max: 1 },
        standard: { min: 1, max: 1.15 },
        detailed: { min: 1.15, max: 1.35 },
      },
      color_mode_modifiers: {
        "black-only": { min: 0.95, max: 1 },
        "black-grey": { min: 1, max: 1.1 },
        "full-color": { min: 1.18, max: 1.35 },
      },
      addon_fees: {
        coverUp: { min: 500, max: 1500 },
        customDesign: { min: 250, max: 1000 },
      },
      size_time_ranges: {
        tiny: { minHours: 0.5, maxHours: 1 },
        small: { minHours: 1, maxHours: 2 },
        medium: { minHours: 2, maxHours: 4 },
        large: { minHours: 4, maxHours: 6 },
      },
      placement_multipliers: {},
      intent_multipliers: {
        "custom-tattoo": 1,
        "design-in-mind": 1,
        "flash-design": 0.95,
        "discounted-design": 0.85,
        "not-sure": 1,
      },
    }),
    supabase.from("artist_style_options").upsert(
      baseStyleOptions.map((style) => ({
        artist_id: artist.id,
        style_key: style.value,
        label: style.label,
        style_description: null,
        example_image_url: null,
        example_image_path: null,
        enabled: ["fine-line", "blackwork", "micro-realism"].includes(style.value),
        is_custom: false,
        deleted: false,
        multiplier:
          style.value === "ornamental"
            ? 1.2
            : style.value === "blackwork"
              ? 1.12
              : 1,
      })),
      {
        onConflict: "artist_id,style_key",
      },
    ),
    supabase.from("artist_page_themes").upsert({
      artist_id: artist.id,
      preset_theme: "midnight-ink",
      background_type: "gradient",
      background_color: "#0b0d11",
      gradient_start: "#151922",
      gradient_end: "#07090c",
      background_image_url: null,
      primary_color: "#d6a574",
      secondary_color: "#1b2028",
      card_color: "#12161c",
      card_opacity: 0.9,
      heading_font: "outfit",
      body_font: "inter",
      font_pairing_preset: "outfit-modern",
      radius_style: "medium",
      theme_mode: "dark",
      custom_welcome_title: null,
      custom_intro_text: null,
      custom_cta_label: null,
      featured_section_label_1: null,
      featured_section_label_2: null,
    }),
  ]);

  return artist;
}

export async function getAuthenticatedArtist() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const artist = await ensureArtistForUser(user);
  return normalizeAuthenticatedArtist(artist as Record<string, unknown>);
}
