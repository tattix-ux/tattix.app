import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = pageThemeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid page customization payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Preview updates locally but won’t persist yet.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const values = parsed.data;
  const { error } = await supabase.from("artist_page_themes").upsert({
    artist_id: artist.id,
    preset_theme: values.presetTheme,
    background_type: values.backgroundType,
    background_color: values.backgroundColor,
    gradient_start: values.gradientStart,
    gradient_end: values.gradientEnd,
    background_image_url: values.backgroundImageUrl || null,
    primary_color: values.primaryColor,
    secondary_color: values.secondaryColor,
    card_color: values.cardColor,
    card_opacity: values.cardOpacity,
    heading_font: values.headingFont,
    body_font: values.bodyFont,
    font_pairing_preset: values.fontPairingPreset,
    radius_style: values.radiusStyle,
    theme_mode: values.themeMode,
    custom_welcome_title: values.customWelcomeTitle || null,
    custom_intro_text: values.customIntroText || null,
    custom_cta_label: values.customCtaLabel || null,
    featured_section_label_1: values.featuredSectionLabel1 || null,
    featured_section_label_2: values.featuredSectionLabel2 || null,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Page customization saved." });
}
