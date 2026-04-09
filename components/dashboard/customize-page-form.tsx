"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Monitor, Smartphone, ImagePlus, LoaderCircle, Save, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { ArtistPagePreview } from "@/components/artist-page/artist-page-preview";
import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  bodyFontOptions,
  fontPairingPresetOptions,
  headingFontOptions,
  radiusStyleOptions,
  themeModeOptions,
  themePresetOptions,
  themePresets,
} from "@/lib/constants/theme";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { loadDemoTheme, saveDemoTheme } from "@/lib/demo-theme-storage";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import { resolveArtistTheme } from "@/lib/theme";
import type { ArtistPageData, ArtistPageTheme } from "@/lib/types";

type ThemeFormInput = z.input<typeof pageThemeSchema>;
type ThemeValues = z.output<typeof pageThemeSchema>;

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-16 rounded-xl border border-white/10 bg-transparent"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

export function CustomizePageForm({
  artist,
  theme,
  demoMode,
}: {
  artist: ArtistPageData;
  theme: ArtistPageTheme;
  demoMode: boolean;
}) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const form = useForm<ThemeFormInput, unknown, ThemeValues>({
    resolver: zodResolver(pageThemeSchema),
    defaultValues: {
      presetTheme: theme.presetTheme,
      backgroundType: theme.backgroundType,
      backgroundColor: theme.backgroundColor,
      gradientStart: theme.gradientStart,
      gradientEnd: theme.gradientEnd,
      backgroundImageUrl: theme.backgroundImageUrl ?? "",
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      cardColor: theme.cardColor,
      cardOpacity: theme.cardOpacity,
      headingFont: theme.headingFont,
      bodyFont: theme.bodyFont,
      fontPairingPreset: theme.fontPairingPreset,
      radiusStyle: theme.radiusStyle,
      themeMode: theme.themeMode,
      customWelcomeTitle: theme.customWelcomeTitle ?? "",
      customIntroText: theme.customIntroText ?? "",
      customCtaLabel: theme.customCtaLabel ?? "",
      featuredSectionLabel1: theme.featuredSectionLabel1 ?? "",
      featuredSectionLabel2: theme.featuredSectionLabel2 ?? "",
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const currentPreset = watchedValues.presetTheme ?? theme.presetTheme;
  const currentBackgroundColor = watchedValues.backgroundColor ?? theme.backgroundColor;
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentGradientStart = watchedValues.gradientStart ?? theme.gradientStart;
  const currentGradientEnd = watchedValues.gradientEnd ?? theme.gradientEnd;
  const previewTheme = useMemo(
    () =>
      resolveArtistTheme({
        artistId: artist.profile.id,
        presetTheme: currentPreset,
        backgroundType: watchedValues.backgroundType ?? theme.backgroundType,
        backgroundColor: currentBackgroundColor,
        gradientStart: currentGradientStart,
        gradientEnd: currentGradientEnd,
        backgroundImageUrl: watchedValues.backgroundImageUrl || null,
        primaryColor: currentPrimaryColor,
        secondaryColor: currentSecondaryColor,
        cardColor: currentCardColor,
        cardOpacity:
          typeof watchedValues.cardOpacity === "number"
            ? watchedValues.cardOpacity
            : theme.cardOpacity,
        headingFont: watchedValues.headingFont ?? theme.headingFont,
        bodyFont: watchedValues.bodyFont ?? theme.bodyFont,
        fontPairingPreset: watchedValues.fontPairingPreset ?? theme.fontPairingPreset,
        radiusStyle: watchedValues.radiusStyle ?? theme.radiusStyle,
        themeMode: watchedValues.themeMode ?? theme.themeMode,
        customWelcomeTitle: watchedValues.customWelcomeTitle || null,
        customIntroText: watchedValues.customIntroText || null,
        customCtaLabel: watchedValues.customCtaLabel || null,
        featuredSectionLabel1: watchedValues.featuredSectionLabel1 || null,
        featuredSectionLabel2: watchedValues.featuredSectionLabel2 || null,
      }),
    [
      artist.profile.id,
      currentBackgroundColor,
      currentCardColor,
      currentGradientEnd,
      currentGradientStart,
      currentPreset,
      currentPrimaryColor,
      currentSecondaryColor,
      theme.backgroundType,
      theme.bodyFont,
      theme.cardOpacity,
      theme.fontPairingPreset,
      theme.headingFont,
      theme.radiusStyle,
      theme.themeMode,
      watchedValues.backgroundImageUrl,
      watchedValues.backgroundType,
      watchedValues.bodyFont,
      watchedValues.cardOpacity,
      watchedValues.customCtaLabel,
      watchedValues.customIntroText,
      watchedValues.customWelcomeTitle,
      watchedValues.featuredSectionLabel1,
      watchedValues.featuredSectionLabel2,
      watchedValues.fontPairingPreset,
      watchedValues.headingFont,
      watchedValues.radiusStyle,
      watchedValues.themeMode,
    ],
  );

  useEffect(() => {
    if (!demoMode) {
      return;
    }

    const storedTheme = loadDemoTheme();

    if (!storedTheme) {
      return;
    }

    form.reset({
      presetTheme: storedTheme.presetTheme,
      backgroundType: storedTheme.backgroundType,
      backgroundColor: storedTheme.backgroundColor,
      gradientStart: storedTheme.gradientStart,
      gradientEnd: storedTheme.gradientEnd,
      backgroundImageUrl: storedTheme.backgroundImageUrl ?? "",
      primaryColor: storedTheme.primaryColor,
      secondaryColor: storedTheme.secondaryColor,
      cardColor: storedTheme.cardColor,
      cardOpacity: storedTheme.cardOpacity,
      headingFont: storedTheme.headingFont,
      bodyFont: storedTheme.bodyFont,
      fontPairingPreset: storedTheme.fontPairingPreset,
      radiusStyle: storedTheme.radiusStyle,
      themeMode: storedTheme.themeMode,
      customWelcomeTitle: storedTheme.customWelcomeTitle ?? "",
      customIntroText: storedTheme.customIntroText ?? "",
      customCtaLabel: storedTheme.customCtaLabel ?? "",
      featuredSectionLabel1: storedTheme.featuredSectionLabel1 ?? "",
      featuredSectionLabel2: storedTheme.featuredSectionLabel2 ?? "",
    });
  }, [demoMode, form]);

  async function handleBackgroundUpload(file: File) {
    if (demoMode) {
      form.setError("root", { message: "Background upload is unavailable in demo mode." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: "Only image files are allowed." });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      form.setError("root", { message: "Background images must be 8 MB or smaller." });
      return;
    }

    const previousUrl = form.getValues("backgroundImageUrl");

    try {
      const uploaded = await uploadArtistAsset(file, {
        artistId: artist.profile.id,
        bucket: "artist-assets",
        prefix: "page-background",
      });

      if (previousUrl?.includes("/storage/v1/object/public/artist-assets/")) {
        const previousPath = previousUrl.split("/artist-assets/")[1];
        if (previousPath) {
          await removeArtistAsset(previousPath, { bucket: "artist-assets" }).catch(() => undefined);
        }
      }

      form.setValue("backgroundImageUrl", uploaded.publicUrl, { shouldDirty: true, shouldValidate: true });
      form.setValue("backgroundType", "image", { shouldDirty: true });
      form.setError("root", { message: "Background uploaded. Save customization to persist it." });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to upload background image.",
      });
    }
  }

  async function handleBackgroundRemove() {
    const currentUrl = form.getValues("backgroundImageUrl");

    if (!demoMode && currentUrl?.includes("/storage/v1/object/public/artist-assets/")) {
      const currentPath = currentUrl.split("/artist-assets/")[1];
      if (currentPath) {
        await removeArtistAsset(currentPath, { bucket: "artist-assets" }).catch(() => undefined);
      }
    }

    form.setValue("backgroundImageUrl", "", { shouldDirty: true, shouldValidate: true });
    if (form.getValues("backgroundType") === "image") {
      form.setValue("backgroundType", "gradient", { shouldDirty: true });
    }
  }

  async function onSubmit(values: ThemeValues) {
    if (demoMode) {
      saveDemoTheme({
        ...previewTheme,
        artistId: artist.profile.id,
      });
      form.setError("root", {
        message:
          "Demo theme saved locally. Refresh or reopen the demo artist page to see it as a client.",
      });
      return;
    }

    const response = await fetch("/api/dashboard/customize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", {
        message: payload.message ?? "Unable to save page customization.",
      });
      return;
    }

    form.setError("root", {
      message:
        payload.message ??
        "Page customization saved.",
    });
  }

  function applyPreset(presetKey: ThemeFormInput["presetTheme"]) {
    const preset = themePresets[presetKey];
    form.setValue("presetTheme", presetKey);
    form.setValue("backgroundType", preset.backgroundType);
    form.setValue("backgroundColor", preset.backgroundColor);
    form.setValue("gradientStart", preset.gradientStart);
    form.setValue("gradientEnd", preset.gradientEnd);
    form.setValue("primaryColor", preset.primaryColor);
    form.setValue("secondaryColor", preset.secondaryColor);
    form.setValue("cardColor", preset.cardColor);
    form.setValue("cardOpacity", preset.cardOpacity);
    form.setValue("headingFont", preset.headingFont);
    form.setValue("bodyFont", preset.bodyFont);
    form.setValue("fontPairingPreset", preset.fontPairingPreset);
    form.setValue("radiusStyle", preset.radiusStyle);
    form.setValue("themeMode", preset.themeMode);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_560px]">
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="surface-border">
          <CardHeader>
            <CardTitle>Theme Presets</CardTitle>
            <CardDescription>
              Start with a polished preset, then fine-tune only what you need.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {themePresetOptions.map((presetKey) => {
              const preset = themePresets[presetKey];
              const active = currentPreset === presetKey;

              return (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => applyPreset(presetKey)}
                  className={`rounded-[24px] border p-4 text-left transition ${
                    active
                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/12"
                      : "border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{preset.label}</p>
                    <div className="flex gap-2">
                      <span
                        className="size-4 rounded-full border border-white/10"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span
                        className="size-4 rounded-full border border-white/10"
                        style={{ backgroundColor: preset.cardColor }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    {preset.themeMode === "dark" ? "Dark" : "Light"} mode, {preset.radiusStyle} radius.
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader>
            <CardTitle>Fonts</CardTitle>
            <CardDescription>Keep font choices curated so the page stays readable and premium.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3">
            <Field label="Font pairing">
              <NativeSelect {...form.register("fontPairingPreset")}>
                {fontPairingPresetOptions.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset.replaceAll("-", " ")}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Heading font">
              <NativeSelect {...form.register("headingFont")}>
                {headingFontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Body font">
              <NativeSelect {...form.register("bodyFont")}>
                {bodyFontOptions.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>
              Set brand accents while contrast is kept on the safe side automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ColorField
              label="Background color"
              value={currentBackgroundColor}
              onChange={(value) => form.setValue("backgroundColor", value)}
            />
            <ColorField
              label="Primary button color"
              value={currentPrimaryColor}
              onChange={(value) => form.setValue("primaryColor", value)}
            />
            <ColorField
              label="Secondary button color"
              value={currentSecondaryColor}
              onChange={(value) => form.setValue("secondaryColor", value)}
            />
            <ColorField
              label="Card color"
              value={currentCardColor}
              onChange={(value) => form.setValue("cardColor", value)}
            />
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader>
            <CardTitle>Backgrounds</CardTitle>
            <CardDescription>Choose between solid, gradient, or background image styling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Background type">
                <NativeSelect {...form.register("backgroundType")}>
                  <option value="solid">Solid</option>
                  <option value="gradient">Gradient</option>
                  <option value="image">Background image</option>
                </NativeSelect>
              </Field>
              <Field label="Theme mode">
                <NativeSelect {...form.register("themeMode")}>
                  {themeModeOptions.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode[0].toUpperCase() + mode.slice(1)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ColorField
                label="Gradient start"
                value={currentGradientStart}
                onChange={(value) => form.setValue("gradientStart", value)}
              />
              <ColorField
                label="Gradient end"
                value={currentGradientEnd}
                onChange={(value) => form.setValue("gradientEnd", value)}
              />
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <Field
                label="Background image"
                description="Upload directly or keep using a URL."
              >
                <div className="space-y-3">
                  <div
                    className="relative flex h-28 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/5"
                  >
                    {watchedValues.backgroundImageUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${watchedValues.backgroundImageUrl})` }}
                        aria-label="Background preview"
                        role="img"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--foreground-muted)]">
                        <ImagePlus className="size-5" />
                        <span>No background selected</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                      <Upload className="size-4" />
                      Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleBackgroundUpload(file);
                          }
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {watchedValues.backgroundImageUrl ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => void handleBackgroundRemove()}>
                        <X className="size-4" />
                        Remove image
                      </Button>
                    ) : null}
                  </div>
                  <Input placeholder="https://..." {...form.register("backgroundImageUrl")} />
                </div>
              </Field>
              <Field label="Card glass">
                <Input
                  type="number"
                  step="0.01"
                  min="0.45"
                  max="0.98"
                  {...form.register("cardOpacity")}
                />
              </Field>
              <Field label="Radius style">
                <NativeSelect {...form.register("radiusStyle")}>
                  {radiusStyleOptions.map((radius) => (
                    <option key={radius} value={radius}>
                      {radius[0].toUpperCase() + radius.slice(1)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader>
            <CardTitle>Content Text</CardTitle>
            <CardDescription>
              Override hero copy and featured section labels without touching the funnel logic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="Custom welcome headline">
              <Input {...form.register("customWelcomeTitle")} placeholder="Optional override" />
            </Field>
            <Field label="Custom intro text">
              <Textarea {...form.register("customIntroText")} placeholder="Optional override" />
            </Field>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Custom CTA label">
                <Input {...form.register("customCtaLabel")} placeholder="Start estimate" />
              </Field>
              <Field label="Featured label 1">
                <Input {...form.register("featuredSectionLabel1")} placeholder="Featured collections" />
              </Field>
              <Field label="Featured label 2">
                <Input {...form.register("featuredSectionLabel2")} placeholder="Pre-drawn ideas clients can pick from" />
              </Field>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save customization
              </>
            )}
          </Button>
          {demoMode ? <Badge variant="accent">Preview-only in demo mode</Badge> : null}
        </div>
        {form.formState.errors.root?.message ? (
          <p className="text-sm text-[var(--accent-soft)]">{form.formState.errors.root.message}</p>
        ) : null}
      </form>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Card className="surface-border">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  Real-time approximation of the public artist page.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={device === "mobile" ? "secondary" : "outline"}
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="size-4" />
                  Mobile
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={device === "desktop" ? "secondary" : "outline"}
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor className="size-4" />
                  Desktop
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ArtistPagePreview
              artist={{ ...artist, pageTheme: previewTheme }}
              theme={previewTheme}
              device={device}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
