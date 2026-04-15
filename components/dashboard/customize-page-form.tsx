"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Monitor, Smartphone, ImagePlus, LoaderCircle, Pencil, RotateCcw, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { ArtistPagePreview } from "@/components/artist-page/artist-page-preview";
import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  headingFontOptions,
  themePresetOptions,
  themePresets,
} from "@/lib/constants/theme";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { loadDemoTheme, saveDemoTheme } from "@/lib/demo-theme-storage";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import { resolveArtistTheme } from "@/lib/theme";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistPageData, ArtistPageTheme, ArtistSavedTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  savedThemes,
  demoMode,
  locale = "en",
}: {
  artist: ArtistPageData;
  theme: ArtistPageTheme;
  savedThemes: ArtistSavedTheme[];
  demoMode: boolean;
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const copy =
    locale === "tr"
      ? {
          tabs: {
            presets: "Hazır temalar",
            custom: "Özel stil",
          },
          presets: "Tema hazırları",
          presetsDescription: "Önce güçlü bir hazır tema seç, sonra sadece ihtiyacın olan ayarları değiştir.",
          fonts: "Font",
          fontsDescription: "Sayfanın tamamında kullanılacak fontu seç.",
          colors: "Renkler",
          colorsDescription: "Marka renklerini ayarla.",
          backgrounds: "Arka planlar",
          backgroundsDescription: "Düz renk, degrade veya arka plan görseli kullanabilirsin.",
          backgroundColor: "Arka plan rengi",
          primaryColor: "Ana buton rengi",
          secondaryColor: "İkincil buton rengi",
          cardColor: "Kart rengi",
          fontPairing: "Font eşleşmesi",
          headingFont: "Başlık fontu",
          bodyFont: "Metin fontu",
          backgroundType: "Arka plan türü",
          gradientStart: "Degrade başlangıcı",
          gradientEnd: "Degrade bitişi",
          backgroundImage: "Arka plan görseli",
          backgroundImageHelp: "Yalnızca görsel yükle.",
          noBackground: "Henüz arka plan seçilmedi",
          uploadImage: "Görsel yükle",
          removeImage: "Görseli kaldır",
          save: "Görünümü kaydet",
          savePreset: "Temayı kaydet",
          presetName: "Tema adı",
          presetNamePlaceholder: "Örn. Tema 1",
          saving: "Kaydediliyor",
          savedThemes: "Kaydedilen temalar",
          savedThemesDescription: "Kendi oluşturduğun temaları buradan tekrar uygulayabilirsin.",
          applyTheme: "Uygula",
          renameTheme: "Yeniden adlandır",
          deleteTheme: "Sil",
          renamePrompt: "Tema için yeni adı gir",
          resetDefaults: "Varsayılana dön",
          demo: "Demo modunda yalnızca önizleme",
          preview: "Canlı önizleme",
          previewDescription: "Sanatçı sayfanın anlık bir önizlemesi.",
          mobile: "Mobil",
          desktop: "Masaüstü",
          solid: "Düz renk",
          gradient: "Degrade",
          image: "Görsel",
          singleFont: "Font",
        }
      : {
          tabs: {
            presets: "Preset Themes",
            custom: "Custom Styling",
          },
          presets: "Theme Presets",
          presetsDescription: "Start with a polished preset, then fine-tune only what you need.",
          fonts: "Font",
          fontsDescription: "Choose the font used across the whole page.",
          colors: "Colors",
          colorsDescription: "Set your brand colors.",
          backgrounds: "Backgrounds",
          backgroundsDescription: "Choose between solid, gradient, or background image styling.",
          backgroundColor: "Background color",
          primaryColor: "Primary button color",
          secondaryColor: "Secondary button color",
          cardColor: "Card color",
          fontPairing: "Font pairing",
          headingFont: "Heading font",
          bodyFont: "Body font",
          backgroundType: "Background type",
          gradientStart: "Gradient start",
          gradientEnd: "Gradient end",
          backgroundImage: "Background image",
          backgroundImageHelp: "Upload only.",
          noBackground: "No background selected",
          uploadImage: "Upload image",
          removeImage: "Remove image",
          save: "Save customization",
          savePreset: "Save theme",
          presetName: "Theme name",
          presetNamePlaceholder: "e.g. Theme 1",
          saving: "Saving",
          savedThemes: "Saved themes",
          savedThemesDescription: "Reapply the themes you created from this area.",
          applyTheme: "Apply",
          renameTheme: "Rename",
          deleteTheme: "Delete",
          renamePrompt: "Enter a new name for this theme",
          resetDefaults: "Reset to default",
          demo: "Preview-only in demo mode",
          preview: "Live Preview",
          previewDescription: "Real-time approximation of the public artist page.",
          mobile: "Mobile",
          desktop: "Desktop",
          solid: "Solid",
          gradient: "Gradient",
          image: "Background image",
          singleFont: "Font",
        };
  const unifiedFontMap = {
    "display-serif": { headingFont: "display-serif", bodyFont: "clean-sans", fontPairingPreset: "premium-editorial" },
    "modern-sans": { headingFont: "modern-sans", bodyFont: "clean-sans", fontPairingPreset: "bold-modern" },
    "gothic-sans": { headingFont: "gothic-sans", bodyFont: "clean-sans", fontPairingPreset: "edgy-clean" },
    "editorial-serif": { headingFont: "editorial-serif", bodyFont: "editorial-sans", fontPairingPreset: "elegant-editorial" },
    "mono-display": { headingFont: "mono-display", bodyFont: "mono-body", fontPairingPreset: "minimal-sans" },
  } as const;
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [editorTab, setEditorTab] = useState<"presets" | "custom">("presets");
  const [presetName, setPresetName] = useState("");

  function getBackgroundTypeLabel(type: "solid" | "gradient" | "image") {
    if (type === "gradient") {
      return copy.gradient;
    }

    if (type === "image") {
      return copy.image;
    }

    return copy.solid;
  }
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
  const currentBackgroundType = watchedValues.backgroundType ?? theme.backgroundType;
  const currentCardOpacity =
    typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
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
  const previewArtist = useMemo(
    () => ({
      ...artist,
      pageTheme: previewTheme,
    }),
    [artist, previewTheme],
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
    await saveTheme(values, false);
  }

  function normalizeThemeValues(values: ThemeValues): ThemeValues {
    const resolved = resolveArtistTheme({
      artistId: artist.profile.id,
      ...values,
      backgroundImageUrl: values.backgroundImageUrl || null,
      customWelcomeTitle: values.customWelcomeTitle || null,
      customIntroText: values.customIntroText || null,
      customCtaLabel: values.customCtaLabel || null,
      featuredSectionLabel1: values.featuredSectionLabel1 || null,
      featuredSectionLabel2: values.featuredSectionLabel2 || null,
    });

    return {
      presetTheme: resolved.presetTheme,
      backgroundType: resolved.backgroundType,
      backgroundColor: resolved.backgroundColor,
      gradientStart: resolved.gradientStart,
      gradientEnd: resolved.gradientEnd,
      backgroundImageUrl: resolved.backgroundImageUrl,
      primaryColor: resolved.primaryColor,
      secondaryColor: resolved.secondaryColor,
      cardColor: resolved.cardColor,
      cardOpacity: resolved.cardOpacity,
      headingFont: resolved.headingFont,
      bodyFont: resolved.bodyFont,
      fontPairingPreset: resolved.fontPairingPreset,
      radiusStyle: resolved.radiusStyle,
      themeMode: resolved.themeMode,
      customWelcomeTitle: resolved.customWelcomeTitle,
      customIntroText: resolved.customIntroText,
      customCtaLabel: resolved.customCtaLabel,
      featuredSectionLabel1: resolved.featuredSectionLabel1,
      featuredSectionLabel2: resolved.featuredSectionLabel2,
    };
  }

  async function saveTheme(values: ThemeValues, savePreset: boolean) {
    const normalizedValues = normalizeThemeValues(values);

    if (demoMode) {
      saveDemoTheme({
        ...resolveArtistTheme({
          artistId: artist.profile.id,
          ...normalizedValues,
        }),
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
      body: JSON.stringify({
        ...normalizedValues,
        savePreset,
        presetName: presetName.trim() || undefined,
      }),
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
    if (savePreset) {
      setPresetName("");
    }
    router.refresh();
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

  function resetThemeToDefault() {
    applyPreset("dark-minimal");
    form.setValue("backgroundImageUrl", "");
    form.setValue("customWelcomeTitle", "");
    form.setValue("customIntroText", "");
    form.setValue("customCtaLabel", "");
    form.setValue("featuredSectionLabel1", "");
    form.setValue("featuredSectionLabel2", "");
  }

  function applySavedTheme(savedTheme: ArtistSavedTheme) {
    const values = savedTheme.theme;
    form.setValue("presetTheme", values.presetTheme);
    form.setValue("backgroundType", values.backgroundType);
    form.setValue("backgroundColor", values.backgroundColor);
    form.setValue("gradientStart", values.gradientStart);
    form.setValue("gradientEnd", values.gradientEnd);
    form.setValue("backgroundImageUrl", values.backgroundImageUrl ?? "");
    form.setValue("primaryColor", values.primaryColor);
    form.setValue("secondaryColor", values.secondaryColor);
    form.setValue("cardColor", values.cardColor);
    form.setValue("cardOpacity", values.cardOpacity);
    form.setValue("headingFont", values.headingFont);
    form.setValue("bodyFont", values.bodyFont);
    form.setValue("fontPairingPreset", values.fontPairingPreset);
    form.setValue("radiusStyle", values.radiusStyle);
    form.setValue("themeMode", values.themeMode);
    form.setValue("customWelcomeTitle", values.customWelcomeTitle ?? "");
    form.setValue("customIntroText", values.customIntroText ?? "");
    form.setValue("customCtaLabel", values.customCtaLabel ?? "");
    form.setValue("featuredSectionLabel1", values.featuredSectionLabel1 ?? "");
    form.setValue("featuredSectionLabel2", values.featuredSectionLabel2 ?? "");
  }

  async function renameSavedTheme(themeId: string, currentName: string) {
    const nextName = window.prompt(copy.renamePrompt, currentName)?.trim();

    if (!nextName || nextName === currentName) {
      return;
    }

    const response = await fetch(`/api/dashboard/customize/saved-themes/${themeId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: nextName }),
    });

    const payload = (await response.json()) as { message?: string };
    form.setError("root", {
      message: payload.message ?? (response.ok ? "Theme renamed." : "Unable to rename theme."),
    });

    if (response.ok) {
      router.refresh();
    }
  }

  async function deleteSavedTheme(themeId: string) {
    const response = await fetch(`/api/dashboard/customize/saved-themes/${themeId}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as { message?: string };
    form.setError("root", {
      message: payload.message ?? (response.ok ? "Theme deleted." : "Unable to delete theme."),
    });

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        editorTab === "custom"
          ? "xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start"
          : "2xl:grid-cols-[minmax(0,1fr)_400px]",
      )}
    >
      <div
        className={cn(
          "order-first min-w-0 space-y-3",
          editorTab === "custom"
            ? "xl:sticky xl:top-4 xl:self-start"
            : "2xl:order-2 2xl:sticky 2xl:top-6 2xl:self-start",
        )}
      >
        <Card className="surface-border">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{copy.preview}</CardTitle>
                <CardDescription>
                  {copy.previewDescription}
                </CardDescription>
              </div>
              {editorTab !== "custom" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={device === "mobile" ? "secondary" : "outline"}
                    onClick={() => setDevice("mobile")}
                  >
                    <Smartphone className="size-4" />
                    {copy.mobile}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={device === "desktop" ? "secondary" : "outline"}
                    onClick={() => setDevice("desktop")}
                  >
                    <Monitor className="size-4" />
                    {copy.desktop}
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className={cn("overflow-hidden", editorTab === "custom" ? "p-3" : "p-2.5 sm:p-4")}>
            <div
              className={
                editorTab === "custom" || device === "mobile"
                  ? "mx-auto w-full max-w-[252px]"
                  : "mx-auto w-full max-w-[760px] overflow-x-auto"
              }
            >
              <div className="origin-top">
                <ArtistPagePreview
                  artist={previewArtist}
                  theme={previewTheme}
                  device={editorTab === "custom" ? "mobile" : device}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <form
        className={cn("min-w-0 space-y-6", editorTab === "custom" ? "xl:order-2" : "2xl:order-1")}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Card className="surface-border">
          <CardContent className="flex flex-wrap gap-2 p-3 sm:p-4">
            <Button
              type="button"
              size="sm"
              variant={editorTab === "presets" ? "secondary" : "outline"}
              onClick={() => setEditorTab("presets")}
            >
              {copy.tabs.presets}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={editorTab === "custom" ? "secondary" : "outline"}
              onClick={() => setEditorTab("custom")}
            >
              {copy.tabs.custom}
            </Button>
          </CardContent>
        </Card>

        {editorTab === "presets" ? (
          <Card className="surface-border">
            <CardHeader>
              <CardTitle>{copy.presets}</CardTitle>
              <CardDescription>{copy.presetsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
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
                      {getBackgroundTypeLabel(preset.backgroundType)}
                    </p>
                  </button>
                );
              })}
              {savedThemes.length ? (
                <>
                  <div className="lg:col-span-2 pt-2">
                    <p className="text-sm font-medium text-white">{copy.savedThemes}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {copy.savedThemesDescription}
                    </p>
                  </div>
                  {savedThemes.map((savedTheme) => (
                    <div
                      key={savedTheme.id}
                      className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-left transition hover:border-white/14 hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{savedTheme.name}</p>
                        <div className="flex gap-2">
                          <span
                            className="size-4 rounded-full border border-white/10"
                            style={{ backgroundColor: savedTheme.theme.primaryColor }}
                          />
                          <span
                            className="size-4 rounded-full border border-white/10"
                            style={{ backgroundColor: savedTheme.theme.cardColor }}
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => applySavedTheme(savedTheme)}>
                          {copy.applyTheme}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void renameSavedTheme(savedTheme.id, savedTheme.name)}
                        >
                          <Pencil className="size-4" />
                          {copy.renameTheme}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void deleteSavedTheme(savedTheme.id)}
                        >
                          <Trash2 className="size-4" />
                          {copy.deleteTheme}
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="surface-border">
              <CardHeader>
                <CardTitle>{copy.savePreset}</CardTitle>
                <CardDescription>{copy.savedThemesDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Field label={copy.presetName}>
                    <Input
                      value={presetName}
                      onChange={(event) => setPresetName(event.target.value)}
                      placeholder={copy.presetNamePlaceholder}
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  disabled={form.formState.isSubmitting}
                  onClick={() => void form.handleSubmit((values) => saveTheme(values, true))()}
                >
                  <Save className="size-4" />
                  {copy.savePreset}
                </Button>
                <Button type="button" variant="ghost" onClick={resetThemeToDefault}>
                  <RotateCcw className="size-4" />
                  {copy.resetDefaults}
                </Button>
              </CardContent>
            </Card>

            <Card className="surface-border">
              <CardHeader>
                <CardTitle>{copy.fonts}</CardTitle>
                <CardDescription>{copy.fontsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 xl:grid-cols-1">
                <Field label={copy.singleFont}>
                  <NativeSelect
                    value={watchedValues.headingFont ?? theme.headingFont}
                    onChange={(event) => {
                      const next = unifiedFontMap[event.target.value as keyof typeof unifiedFontMap];
                      form.setValue("headingFont", next.headingFont, { shouldDirty: true, shouldValidate: true });
                      form.setValue("bodyFont", next.bodyFont, { shouldDirty: true, shouldValidate: true });
                      form.setValue("fontPairingPreset", next.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    {headingFontOptions.map((font) => (
                      <option key={font.value} value={font.value}>
                        {font.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <input type="hidden" {...form.register("bodyFont")} />
                <input type="hidden" {...form.register("fontPairingPreset")} />
              </CardContent>
            </Card>

            <Card className="surface-border">
              <CardHeader>
                <CardTitle>{copy.colors}</CardTitle>
                <CardDescription>{copy.colorsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <ColorField
                  label={copy.primaryColor}
                  value={currentPrimaryColor}
                  onChange={(value) => form.setValue("primaryColor", value)}
                />
                <ColorField
                  label={copy.secondaryColor}
                  value={currentSecondaryColor}
                  onChange={(value) => form.setValue("secondaryColor", value)}
                />
                <ColorField
                  label={copy.cardColor}
                  value={currentCardColor}
                  onChange={(value) => form.setValue("cardColor", value)}
                />
              </CardContent>
            </Card>

            <Card className="surface-border">
              <CardHeader>
                <CardTitle>{copy.backgrounds}</CardTitle>
                <CardDescription>{copy.backgroundsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-1">
                  <Field label={copy.backgroundType}>
                    <NativeSelect {...form.register("backgroundType")}>
                      <option value="solid">{copy.solid}</option>
                      <option value="gradient">{copy.gradient}</option>
                      <option value="image">{copy.image}</option>
                    </NativeSelect>
                  </Field>
                </div>
                {currentBackgroundType === "solid" ? (
                  <ColorField
                    label={copy.backgroundColor}
                    value={currentBackgroundColor}
                    onChange={(value) => form.setValue("backgroundColor", value)}
                  />
                ) : null}
                {currentBackgroundType === "gradient" ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ColorField
                      label={copy.gradientStart}
                      value={currentGradientStart}
                      onChange={(value) => form.setValue("gradientStart", value)}
                    />
                    <ColorField
                      label={copy.gradientEnd}
                      value={currentGradientEnd}
                      onChange={(value) => form.setValue("gradientEnd", value)}
                    />
                  </div>
                ) : null}
                <div className="grid gap-5 xl:grid-cols-3">
                  {currentBackgroundType === "image" ? (
                    <Field
                      label={copy.backgroundImage}
                      description={copy.backgroundImageHelp}
                    >
                    <div className="space-y-3">
                      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/5 sm:h-28 sm:rounded-[22px]">
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
                            <span>{copy.noBackground}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                          <Upload className="size-4" />
                          {copy.uploadImage}
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
                            {copy.removeImage}
                          </Button>
                        ) : null}
                      </div>
                      <input type="hidden" {...form.register("backgroundImageUrl")} />
                    </div>
                    </Field>
                  ) : (
                    <input type="hidden" {...form.register("backgroundImageUrl")} />
                  )}
                  <input type="hidden" {...form.register("cardOpacity")} value={String(currentCardOpacity)} />
                  <input type="hidden" {...form.register("radiusStyle")} />
                  <input type="hidden" {...form.register("themeMode")} />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                {copy.saving}
              </>
            ) : (
              <>
                <Save className="size-4" />
                {copy.save}
              </>
            )}
          </Button>
          {demoMode ? <Badge variant="accent">{copy.demo}</Badge> : null}
        </div>
        {form.formState.errors.root?.message ? (
          <p className="text-sm text-[var(--accent-soft)]">{form.formState.errors.root.message}</p>
        ) : null}
      </form>

    </div>
  );
}
