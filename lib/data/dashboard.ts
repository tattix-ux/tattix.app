import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { demoArtistPageData, demoLeads } from "@/lib/demo-data";
import { styleOptions as baseStyleOptions } from "@/lib/constants/options";
import type { ArtistProfile, ClientSubmission, DashboardData, LeadStatus } from "@/lib/types";
import { CALIBRATION_SLOT_LABELS } from "@/lib/pricing/calibration-flow";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getArtistPageDataById } from "@/lib/data/artist";
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
    style: String(row.style) as ClientSubmission["style"],
    notes: row.notes ? String(row.notes) : null,
    estimatedMin: Number(row.estimated_min),
    estimatedMax: Number(row.estimated_max),
    contactMessage: String(row.contact_message ?? ""),
    contacted: status === "contacted" || status === "sold",
    convertedToSale: status === "sold",
    soldAt: status === "sold" && row.sold_at ? String(row.sold_at) : null,
    createdAt: String(row.created_at),
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
    currency: String(row.currency ?? "TRY") as ArtistProfile["currency"],
    active: Boolean(row.active),
    planType: String(row.plan_type ?? "free") as ArtistProfile["planType"],
    accessStatus: String(row.access_status ?? "active") as ArtistProfile["accessStatus"],
  };
}

export const getDashboardData = cache(async function getDashboardData(
  userId: string | null,
): Promise<DashboardData> {
  if (!isSupabaseConfigured() || !userId) {
    return {
      ...demoArtistPageData,
      leads: demoLeads,
      demoMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingArtist } = await supabase
    .from("artists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const artist = existingArtist?.id
    ? existingArtist
    : await (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return null;
        }

        return ensureArtistForUser(user);
      })();

  if (!artist) {
    return {
      ...demoArtistPageData,
      leads: demoLeads,
      demoMode: true,
    };
  }

  const pageData = await getArtistPageDataById(String(artist.id));

  if (!pageData) {
    return {
      ...demoArtistPageData,
      leads: demoLeads,
      demoMode: true,
    };
  }

  const { data: leadsRows } = await supabase
    .from("client_submissions")
    .select("*")
    .eq("artist_id", pageData.profile.id)
    .order("created_at", { ascending: false });

  return {
    ...pageData,
    leads: (leadsRows ?? []).map((row) => mapLead(row as Record<string, unknown>)),
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
      intro_eyebrow: "Tattix intake",
      intro_title: "Tell us the placement, size, and style.",
      intro_description:
        "This quick mobile flow captures the basics before you move into consultation.",
      show_featured_designs: true,
      default_language: "tr",
    }),
    supabase.from("artist_pricing_rules").upsert({
      artist_id: artist.id,
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
      preset_theme: "dark-minimal",
      background_type: "solid",
      background_color: "#09090b",
      gradient_start: "#111114",
      gradient_end: "#09090b",
      background_image_url: null,
      primary_color: "#f7b15d",
      secondary_color: "#2b2c31",
      card_color: "#131316",
      card_opacity: 0.78,
      heading_font: "display-serif",
      body_font: "clean-sans",
      font_pairing_preset: "premium-editorial",
      radius_style: "large",
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
