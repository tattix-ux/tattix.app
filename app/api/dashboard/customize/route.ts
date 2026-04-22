import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { hasProAccess } from "@/lib/access";
import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveArtistTheme } from "@/lib/theme";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = pageThemeSchema.safeParse(body);
  const savePreset = body?.savePreset === true;
  const presetName =
    typeof body?.presetName === "string" && body.presetName.trim().length
      ? body.presetName.trim().slice(0, 60)
      : null;

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
  const isPro = hasProAccess(artist);
  const values = isPro
    ? parsed.data
    : (() => {
        const presetTheme = resolveArtistTheme({
          artistId: artist.id,
          presetTheme: parsed.data.presetTheme,
        });

        return {
          ...parsed.data,
          presetTheme: presetTheme.presetTheme,
          backgroundType: presetTheme.backgroundType,
          backgroundColor: presetTheme.backgroundColor,
          gradientStart: presetTheme.gradientStart,
          gradientEnd: presetTheme.gradientEnd,
          backgroundImageUrl: presetTheme.backgroundImageUrl ?? "",
          backgroundOverlayStrength: presetTheme.backgroundOverlayStrength,
          backgroundImageSoftness: presetTheme.backgroundImageSoftness,
          backgroundImageFocus: presetTheme.backgroundImageFocus,
          textColor: presetTheme.textColor,
          primaryColor: presetTheme.primaryColor,
          secondaryColor: presetTheme.secondaryColor,
          cardColor: presetTheme.cardColor,
          cardOpacity: presetTheme.cardOpacity,
          cardFeel: presetTheme.cardFeel,
          buttonStyle: presetTheme.buttonStyle,
          badgeStyle: presetTheme.badgeStyle,
          headingFont: presetTheme.headingFont,
          bodyFont: presetTheme.bodyFont,
          fontPairingPreset: presetTheme.fontPairingPreset,
          radiusStyle: presetTheme.radiusStyle,
          themeMode: presetTheme.themeMode,
        };
      })();
  const { error } = await supabase.from("artist_page_themes").upsert({
    artist_id: artist.id,
    preset_theme: values.presetTheme,
    background_type: values.backgroundType,
    background_color: values.backgroundColor,
    gradient_start: values.gradientStart,
    gradient_end: values.gradientEnd,
    background_image_url: values.backgroundImageUrl || null,
    background_overlay_strength: values.backgroundOverlayStrength,
    background_image_softness: values.backgroundImageSoftness,
    background_image_focus: values.backgroundImageFocus,
    text_color: values.textColor,
    primary_color: values.primaryColor,
    secondary_color: values.secondaryColor,
    card_color: values.cardColor,
    card_opacity: values.cardOpacity,
    card_feel: values.cardFeel,
    button_style: values.buttonStyle,
    badge_style: values.badgeStyle,
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

  if (savePreset && isPro) {
    const { count } = await supabase
      .from("artist_saved_themes")
      .select("*", { count: "exact", head: true })
      .eq("artist_id", artist.id);

    const { error: presetError } = await supabase.from("artist_saved_themes").insert({
      artist_id: artist.id,
      name: presetName ?? `Tema ${(count ?? 0) + 1}`,
      theme_snapshot: values,
    });

    if (presetError) {
      return NextResponse.json({ message: presetError.message }, { status: 400 });
    }
  }

  revalidatePath("/dashboard/customize");
  revalidatePath(`/${artist.slug}`);

  return NextResponse.json({
    message: savePreset ? "Page customization saved and preset added." : "Page customization saved.",
  });
}
