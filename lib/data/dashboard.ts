import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { demoArtistPageData, demoLeads } from "@/lib/demo-data";
import { styleOptions as baseStyleOptions } from "@/lib/constants/options";
import type { ClientSubmission, DashboardData } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getArtistPageDataById } from "@/lib/data/artist";
import { slugify } from "@/lib/utils";

function mapLead(row: Record<string, unknown>): ClientSubmission {
  return {
    id: String(row.id),
    artistId: String(row.artist_id),
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
    style: String(row.style) as ClientSubmission["style"],
    notes: row.notes ? String(row.notes) : null,
    estimatedMin: Number(row.estimated_min),
    estimatedMax: Number(row.estimated_max),
    contactMessage: String(row.contact_message ?? ""),
    contacted: Boolean(row.contacted),
    convertedToSale: Boolean(row.converted_to_sale ?? false),
    soldAt: row.sold_at ? String(row.sold_at) : null,
    createdAt: String(row.created_at),
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
      minimum_session_price: 1500,
      size_base_ranges: {
        tiny: { min: 1000, max: 1800 },
        small: { min: 1500, max: 2500 },
        medium: { min: 3000, max: 5000 },
        large: { min: 6000, max: 9000 },
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

  return ensureArtistForUser(user);
}
