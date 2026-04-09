import { notFound } from "next/navigation";

import { demoArtistPageData } from "@/lib/demo-data";
import { buildDefaultArtistTheme } from "@/lib/theme";
import type {
  ArtistFeaturedDesign,
  ArtistFunnelSettings,
  ArtistPageData,
  ArtistPageTheme,
  ArtistPricingRules,
  ArtistProfile,
  ArtistStyleOption,
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
    currency: String(row.currency ?? "TRY") as ArtistProfile["currency"],
    active: Boolean(row.active),
  };
}

function mapFunnelSettings(row: Record<string, unknown>, artistId: string): ArtistFunnelSettings {
  return {
    artistId,
    introEyebrow: String(row.intro_eyebrow ?? "TatBot intake"),
    introTitle: String(row.intro_title ?? ""),
    introDescription: String(row.intro_description ?? ""),
    showFeaturedDesigns: Boolean(row.show_featured_designs ?? true),
    defaultLanguage: String(row.default_language ?? "en") as ArtistFunnelSettings["defaultLanguage"],
  };
}

function mapStyleOption(row: Record<string, unknown>): ArtistStyleOption {
  return {
    id: String(row.id),
    artistId: String(row.artist_id),
    styleKey: String(row.style_key) as ArtistStyleOption["styleKey"],
    label: String(row.label),
    enabled: Boolean(row.enabled),
    multiplier: Number(row.multiplier ?? 1),
    isCustom: Boolean(row.is_custom ?? false),
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
    referencePriceMin:
      row.reference_price_min === null ? null : Number(row.reference_price_min),
    referencePriceMax:
      row.reference_price_max === null ? null : Number(row.reference_price_max),
    active: Boolean(row.active ?? true),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapPricingRules(row: Record<string, unknown>, artistId: string): ArtistPricingRules {
  return {
    artistId,
    minimumSessionPrice: Number(row.minimum_session_price ?? 0),
    sizeBaseRanges: row.size_base_ranges as ArtistPricingRules["sizeBaseRanges"],
    sizeTimeRanges:
      (row.size_time_ranges as ArtistPricingRules["sizeTimeRanges"]) ?? {
        tiny: { minHours: 0.5, maxHours: 1 },
        small: { minHours: 1, maxHours: 2 },
        medium: { minHours: 2, maxHours: 4 },
        large: { minHours: 4, maxHours: 6 },
      },
    placementMultipliers:
      (row.placement_multipliers as ArtistPricingRules["placementMultipliers"]) ?? {},
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

async function fetchArtistBundleById(artistId: string) {
  const supabase = await createSupabaseServerClient();
  const [artistRow, funnelSettingsRow, styleRows, designRows, pricingRulesRow, pageThemeRow] =
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
    ]);

  if (!artistRow.data) {
    return null;
  }

  return {
    profile: mapArtistProfile(artistRow.data as Record<string, unknown>),
    funnelSettings: mapFunnelSettings(
      (funnelSettingsRow.data ?? {}) as Record<string, unknown>,
      artistId,
    ),
    styleOptions: (styleRows.data ?? []).map((row) =>
      mapStyleOption(row as Record<string, unknown>),
    ),
    featuredDesigns: (designRows.data ?? []).map((row) =>
      mapFeaturedDesign(row as Record<string, unknown>),
    ),
    pricingRules: mapPricingRules(
      (pricingRulesRow.data ?? {}) as Record<string, unknown>,
      artistId,
    ),
    pageTheme: mapPageTheme((pageThemeRow.data ?? {}) as Record<string, unknown>, artistId),
  } satisfies ArtistPageData;
}

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
