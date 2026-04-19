import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { styleOptions as baseStyleOptions } from "@/lib/constants/options";
import { funnelSettingsSchema } from "@/lib/forms/schemas";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildStyleKey(label: string, usedKeys: Set<string>) {
  const base =
    label
      .trim()
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "custom-style";

  let candidate = base;
  let suffix = 2;
  while (usedKeys.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedKeys.add(candidate);
  return candidate;
}

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
  const usedCustomKeys = new Set<string>(builtInKeys);
  const normalizedCustomStyles = parsed.data.customStyles.map((style) => {
    const existingKey = style.styleKey?.trim();
    if (existingKey) {
      usedCustomKeys.add(existingKey);
    }

    return {
      ...style,
      styleKey: existingKey || buildStyleKey(style.label, usedCustomKeys),
    };
  });
  const customKeys = normalizedCustomStyles.map((style) => style.styleKey);
  const removedBuiltInKeys = new Set(parsed.data.removedBuiltInStyles);
  const hasDuplicateCustomKeys = new Set(customKeys).size !== customKeys.length;
  const conflictsWithBuiltIns = customKeys.some((key) => builtInKeys.has(key));
  const normalizedCities = parsed.data.bookingCities.map((city) =>
    city.cityName.trim().toLocaleLowerCase("tr-TR"),
  );
  const hasDuplicateCities = new Set(normalizedCities).size !== normalizedCities.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const hasPastDates = parsed.data.bookingCities.some((city) =>
    city.availableDates.some((date) => {
      const parsedDate = new Date(`${date}T00:00:00`);
      return Number.isNaN(parsedDate.getTime()) || parsedDate < today;
    }),
  );

  if (hasDuplicateCustomKeys || conflictsWithBuiltIns) {
    return NextResponse.json(
      { message: "Custom style keys must be unique and cannot reuse built-in style keys." },
      { status: 400 },
    );
  }

  if (hasDuplicateCities) {
    return NextResponse.json({ message: "Cities must be unique." }, { status: 400 });
  }

  if (hasPastDates) {
    return NextResponse.json({ message: "Past dates are not allowed." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const enabledSet = new Set(parsed.data.enabledStyles);
  const builtInStyleMap = new Map(parsed.data.builtInStyles.map((style) => [style.styleKey, style]));
  const existingStyles = await supabase
    .from("artist_style_options")
    .select(
      "style_key,multiplier,label,is_custom,style_description,example_image_url,example_image_path,deleted",
    )
    .eq("artist_id", artist.id);

  const { error: settingsError } = await supabase.from("artist_funnel_settings").upsert({
    artist_id: artist.id,
    intro_eyebrow: parsed.data.introEyebrow,
    intro_title: parsed.data.introTitle,
    intro_description: parsed.data.introDescription,
    show_featured_designs: parsed.data.showFeaturedDesigns,
    default_language: "tr",
  });

  const builtInRows = baseStyleOptions.map((style) => {
    const existingStyle = existingStyles.data?.find((item) => item.style_key === style.value);
    const builtInStyle = builtInStyleMap.get(style.value);

    return {
      artist_id: artist.id,
      style_key: style.value,
      label: existingStyle?.label ?? style.label,
      style_description: builtInStyle?.description?.trim() || existingStyle?.style_description || null,
      example_image_url: builtInStyle?.imageUrl?.trim() || existingStyle?.example_image_url || null,
      example_image_path: builtInStyle?.imagePath?.trim() || existingStyle?.example_image_path || null,
      multiplier: existingStyle?.multiplier ?? 1,
      enabled: !removedBuiltInKeys.has(style.value) && enabledSet.has(style.value),
      is_custom: false,
      deleted: removedBuiltInKeys.has(style.value),
    };
  });

  const customRows = normalizedCustomStyles.map((style) => ({
    artist_id: artist.id,
    style_key: style.styleKey,
    label: style.label,
    style_description: style.description || null,
    example_image_url: style.imageUrl?.trim() || null,
    example_image_path: style.imagePath?.trim() || null,
    multiplier:
      existingStyles.data?.find((item) => item.style_key === style.styleKey)?.multiplier ?? 1,
    enabled: style.enabled,
    is_custom: true,
    deleted: false,
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

  const existingLocations = await supabase
    .from("artist_booking_locations")
    .select("id")
    .eq("artist_id", artist.id);

  const existingLocationIds = (existingLocations.data ?? []).map((row) => row.id);

  const { error: deleteDatesError } =
    existingLocationIds.length > 0
      ? await supabase
          .from("artist_booking_location_dates")
          .delete()
          .in("artist_location_id", existingLocationIds)
      : { error: null };

  const { error: deleteLocationsError } = await supabase
    .from("artist_booking_locations")
    .delete()
    .eq("artist_id", artist.id);

  let locationInsertError: { message: string } | null = null;
  let dateInsertError: { message: string } | null = null;

  if (!deleteDatesError && !deleteLocationsError && parsed.data.bookingCities.length > 0) {
    const { data: insertedLocations, error } = await supabase
      .from("artist_booking_locations")
      .insert(
        parsed.data.bookingCities.map((city) => ({
          artist_id: artist.id,
          city_name: city.cityName.trim(),
        })),
      )
      .select("id,city_name");

    locationInsertError = error;

    if (!error && insertedLocations) {
      const cityIdMap = new Map(insertedLocations.map((row) => [row.city_name, row.id]));
      const dateRows = parsed.data.bookingCities.flatMap((city) =>
        city.availableDates.map((date) => ({
          artist_location_id: cityIdMap.get(city.cityName.trim()),
          available_date: date,
        })),
      ).filter((row) => Boolean(row.artist_location_id));

      if (dateRows.length > 0) {
        const { error: datesError } = await supabase
          .from("artist_booking_location_dates")
          .insert(dateRows as { artist_location_id: string; available_date: string }[]);
        dateInsertError = datesError;
      }
    }
  }

  const error =
    settingsError ??
    deleteCustomError ??
    stylesError ??
    deleteDatesError ??
    deleteLocationsError ??
    locationInsertError ??
    dateInsertError;

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Request settings saved." });
}
