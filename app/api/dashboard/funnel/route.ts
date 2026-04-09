import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { styleOptions as baseStyleOptions } from "@/lib/constants/options";
import { funnelSettingsSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = funnelSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid funnel settings payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist funnel settings.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const builtInKeys = new Set<string>(baseStyleOptions.map((style) => style.value));
  const customKeys = parsed.data.customStyles.map((style) => style.styleKey);
  const hasDuplicateCustomKeys = new Set(customKeys).size !== customKeys.length;
  const conflictsWithBuiltIns = customKeys.some((key) => builtInKeys.has(key));

  if (hasDuplicateCustomKeys || conflictsWithBuiltIns) {
    return NextResponse.json(
      { message: "Custom style keys must be unique and cannot reuse built-in style keys." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const enabledSet = new Set(parsed.data.enabledStyles);
  const existingStyles = await supabase
    .from("artist_style_options")
    .select("style_key,multiplier,label,is_custom")
    .eq("artist_id", artist.id);

  const { error: settingsError } = await supabase.from("artist_funnel_settings").upsert({
    artist_id: artist.id,
    intro_eyebrow: parsed.data.introEyebrow,
    intro_title: parsed.data.introTitle,
    intro_description: parsed.data.introDescription,
    show_featured_designs: parsed.data.showFeaturedDesigns,
    default_language: parsed.data.defaultLanguage,
  });

  const builtInRows = baseStyleOptions.map((style) => ({
    artist_id: artist.id,
    style_key: style.value,
    label:
      existingStyles.data?.find((item) => item.style_key === style.value)?.label ?? style.label,
    multiplier:
      existingStyles.data?.find((item) => item.style_key === style.value)?.multiplier ?? 1,
    enabled: enabledSet.has(style.value),
    is_custom: false,
  }));

  const customRows = parsed.data.customStyles.map((style) => ({
    artist_id: artist.id,
    style_key: style.styleKey,
    label: style.label,
    multiplier:
      existingStyles.data?.find((item) => item.style_key === style.styleKey)?.multiplier ?? 1,
    enabled: style.enabled,
    is_custom: true,
  }));

  const { error: deleteCustomError } = await supabase
    .from("artist_style_options")
    .delete()
    .eq("artist_id", artist.id)
    .eq("is_custom", true);

  const { error: stylesError } = await supabase.from("artist_style_options").upsert(
    [...builtInRows, ...customRows],
    {
      onConflict: "artist_id,style_key",
    },
  );

  const error = settingsError ?? deleteCustomError ?? stylesError;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Funnel settings saved." });
}
