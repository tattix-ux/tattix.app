"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImagePlus, LoaderCircle, Pencil, RotateCcw, Save, Trash2, Upload, X } from "lucide-react";
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
import { themePresetOptions, themePresets } from "@/lib/constants/theme";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { loadDemoTheme, saveDemoTheme } from "@/lib/demo-theme-storage";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import { resolveArtistTheme } from "@/lib/theme";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistPageData, ArtistPageTheme, ArtistSavedTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

type ThemeFormInput = z.input<typeof pageThemeSchema>;
type ThemeValues = z.output<typeof pageThemeSchema>;

const colorSwatches = ["#f7b15d", "#ffffff", "#54f0dd", "#dc5c5c", "#b899ff", "#88cfa5"] as const;
const backgroundSolidSwatches = ["#09090b", "#0e131a", "#131116", "#16100e"] as const;
const backgroundGradientPresets = [
  { key: "dark-fade", label: "Dark fade", start: "#17181d", end: "#09090b" },
  { key: "blue-fade", label: "Blue fade", start: "#12253a", end: "#090d14" },
  { key: "gold-fade", label: "Gold fade", start: "#2b1c16", end: "#0e0b0a" },
] as const;
const fontOptions = [
  { value: "modern", labelTr: "Modern", labelEn: "Modern" },
  { value: "serif", labelTr: "Serif", labelEn: "Serif" },
  { value: "editorial", labelTr: "Editoryal", labelEn: "Editorial" },
  { value: "gothic", labelTr: "Gotik", labelEn: "Gothic" },
  { value: "minimal", labelTr: "Minimal", labelEn: "Minimal" },
] as const;

const quickCustomPresets = [
  { key: "dark-minimal", labelTr: "Koyu", labelEn: "Dark" },
  { key: "soft-neutral", labelTr: "Açık", labelEn: "Light" },
  { key: "luxury-serif", labelTr: "Altın ton", labelEn: "Gold tone" },
  { key: "neon-accent", labelTr: "Mavi ton", labelEn: "Blue tone" },
] as const;

const headingPreviewFonts = {
  modern: '"Avenir Next", "Helvetica Neue", sans-serif',
  serif: '"Baskerville", "Times New Roman", serif',
  editorial: '"Iowan Old Style", "Palatino Linotype", serif',
  gothic: '"Arial Narrow", "Helvetica Neue", sans-serif',
  minimal: '"SFMono-Regular", "Menlo", monospace',
} as const;

const previewHeadingFontMap = {
  "display-serif": headingPreviewFonts.editorial,
  "modern-sans": headingPreviewFonts.modern,
  "gothic-sans": headingPreviewFonts.gothic,
  "editorial-serif": headingPreviewFonts.serif,
  "mono-display": headingPreviewFonts.minimal,
} as const;

const previewBodyFonts = {
  "clean-sans": '"Inter", "Helvetica Neue", sans-serif',
  "neutral-sans": '"Avenir Next", "Helvetica Neue", sans-serif',
  "editorial-sans": '"Optima", "Avenir Next", sans-serif',
  "mono-body": '"SFMono-Regular", "Menlo", monospace',
} as const;

function ThemeSelectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/25 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md">
      <Check className="size-3" />
      {label}
    </span>
  );
}

function ColorField({
  label,
  value,
  onChange,
  swatches,
  customLabel,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  swatches: readonly string[];
  customLabel: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {swatches.map((swatch) => {
          const active = value.toLowerCase() === swatch.toLowerCase();

          return (
            <button
              key={swatch}
              type="button"
              onClick={() => onChange(swatch)}
              className={cn(
                "size-10 rounded-full border transition",
                active ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.18)]" : "border-white/10",
              )}
              style={{ backgroundColor: swatch }}
              aria-label={swatch}
            />
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-16 rounded-xl border border-white/10 bg-transparent"
        />
        <Input aria-label={customLabel} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

function ThemeCardPreview({
  artist,
  theme,
  variant = "card",
}: {
  artist: ArtistPageData;
  theme: ArtistPageTheme;
  variant?: "card" | "panel";
}) {
  const title = theme.customWelcomeTitle || artist.funnelSettings.introTitle || artist.profile.welcomeHeadline || "Aklında ne var?";
  const intro = theme.customIntroText || artist.funnelSettings.introDescription || artist.profile.shortBio || "Dövme fikrini birkaç adımda netleştir.";
  const cta = theme.customCtaLabel || "Fiyat tahmini al";
  const isPanel = variant === "panel";
  const headingColor =
    theme.themeMode === "light"
      ? "color-mix(in srgb, var(--artist-card-text, #1f1814) 94%, transparent)"
      : "var(--artist-card-text, #f8f5ef)";
  const bodyColor =
    theme.themeMode === "light"
      ? "color-mix(in srgb, var(--artist-card-muted, #5b5147) 96%, transparent)"
      : "var(--artist-card-muted, #d4ccc2)";
  const background =
    theme.backgroundType === "image" && theme.backgroundImageUrl
      ? `linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.48)), url(${theme.backgroundImageUrl})`
      : theme.backgroundType === "gradient"
        ? `linear-gradient(180deg, ${theme.gradientStart}, ${theme.gradientEnd})`
        : theme.backgroundColor;
  const outerShell = theme.themeMode === "light" ? "rgba(255,255,255,0.56)" : "rgba(255,255,255,0.06)";
  const innerShell = theme.themeMode === "light" ? "rgba(255,255,255,0.82)" : "rgba(9,9,12,0.92)";
  const screenGlow =
    theme.themeMode === "light"
      ? `radial-gradient(circle at top, color-mix(in srgb, ${theme.primaryColor} 18%, white), transparent 60%)`
      : `radial-gradient(circle at top, color-mix(in srgb, ${theme.primaryColor} 24%, transparent), transparent 62%)`;
  const bodyFont = previewBodyFonts[theme.bodyFont] ?? previewBodyFonts["clean-sans"];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10",
        isPanel ? "min-h-[560px] p-6 sm:p-7" : "min-h-[360px] p-5",
      )}
      style={{
        background:
          theme.themeMode === "light"
            ? `linear-gradient(180deg, color-mix(in srgb, ${theme.cardColor} 92%, white), color-mix(in srgb, ${theme.backgroundColor} 84%, white))`
            : `linear-gradient(180deg, color-mix(in srgb, ${theme.cardColor} 34%, #0a0a0d), color-mix(in srgb, ${theme.backgroundColor} 88%, #060608))`,
        boxShadow:
          theme.themeMode === "light"
            ? "inset 0 1px 0 rgba(255,255,255,0.7), 0 20px 60px rgba(9,10,14,0.08)"
            : "inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 90px rgba(0,0,0,0.28)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-32 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${theme.primaryColor} 20%, transparent), transparent 70%)`,
        }}
      />
      <div
        className={cn(
          "relative flex h-full items-center",
          isPanel ? "justify-center" : "justify-center",
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-[10%] top-5 h-28 rounded-full blur-3xl"
          style={{ background: screenGlow, opacity: theme.themeMode === "light" ? 0.7 : 0.85 }}
        />
        <div className={cn("relative w-full", isPanel ? "max-w-[310px]" : "max-w-[210px]")}>
          <div
            className={cn(
              "relative overflow-hidden border shadow-[0_24px_80px_rgba(0,0,0,0.42)]",
              isPanel ? "rounded-[36px] p-2.5" : "rounded-[28px] p-2",
            )}
            style={{
              borderColor: "color-mix(in srgb, white 10%, transparent)",
              background: `linear-gradient(180deg, ${outerShell}, color-mix(in srgb, ${theme.cardColor} 16%, transparent))`,
            }}
          >
            <div className="pointer-events-none absolute inset-x-6 top-2 h-5 rounded-full bg-white/8 blur-md" />
            <div
              className={cn(
                "overflow-hidden border",
                isPanel ? "rounded-[30px]" : "rounded-[24px]",
              )}
              style={{
                borderColor: "color-mix(in srgb, white 6%, transparent)",
                backgroundColor: innerShell,
              }}
            >
              <div
                className="overflow-hidden"
                style={{
                  background,
                  backgroundSize: theme.backgroundType === "image" ? "cover" : undefined,
                  backgroundPosition: theme.backgroundType === "image" ? "center" : undefined,
                }}
              >
                <div className={cn("space-y-4", isPanel ? "p-5" : "p-3.5")}>
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[20px] border border-white/10 bg-black/15",
                      isPanel ? "h-24" : "h-16",
                    )}
                  >
                    {artist.profile.coverImageUrl ? (
                      <img
                        src={artist.profile.coverImageUrl}
                        alt={artist.profile.artistName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/45" />
                  </div>
                  <div className={cn("flex items-end gap-3", isPanel ? "-mt-11" : "-mt-8")}>
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[18px] border border-white/12 bg-black/30 shadow-[0_10px_25px_rgba(0,0,0,0.28)]",
                        isPanel ? "size-14" : "size-11",
                      )}
                    >
                      {artist.profile.profileImageUrl ? (
                        <img
                          src={artist.profile.profileImageUrl}
                          alt={artist.profile.artistName}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 pb-0.5">
                      <p
                        className={cn("truncate font-medium", isPanel ? "text-[15px]" : "text-[13px]")}
                        style={{ color: headingColor, fontFamily: bodyFont }}
                      >
                        {artist.profile.artistName}
                      </p>
                      <div
                        className="mt-1 inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium"
                        style={{
                          backgroundColor: "color-mix(in srgb, white 10%, transparent)",
                          color: bodyColor,
                        }}
                      >
                        {artist.profile.instagramHandle ? `@${artist.profile.instagramHandle}` : artist.profile.artistName.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p
                      className={cn("leading-tight tracking-[-0.02em]", isPanel ? "text-[1.75rem]" : "text-[1.18rem]")}
                      style={{
                        fontFamily: previewHeadingFontMap[theme.headingFont] ?? headingPreviewFonts.modern,
                        color: headingColor,
                      }}
                    >
                      {title}
                    </p>
                    <p className={cn(isPanel ? "text-[13px] leading-5" : "text-[11px] leading-4")} style={{ color: bodyColor, fontFamily: bodyFont }}>
                      {intro}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "inline-flex rounded-full font-medium shadow-[0_10px_30px_rgba(0,0,0,0.2)]",
                      isPanel ? "px-4 py-2 text-xs" : "px-3 py-1.5 text-[11px]",
                    )}
                    style={{
                      backgroundColor: theme.primaryColor,
                      color: theme.themeMode === "light" ? "#1b120f" : "#0b0b0c",
                    }}
                  >
                    {cta}
                  </div>

                  <div
                    className={cn("border", isPanel ? "rounded-[22px] p-3.5" : "rounded-[18px] p-3")}
                    style={{
                      borderColor: "color-mix(in srgb, white 8%, transparent)",
                      backgroundColor:
                        theme.themeMode === "light"
                          ? "color-mix(in srgb, white 78%, transparent)"
                          : "color-mix(in srgb, black 18%, transparent)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium" style={{ color: headingColor, fontFamily: bodyFont }}>
                          Aklında ne var?
                        </p>
                        <p className="mt-1 text-[11px]" style={{ color: bodyColor, fontFamily: bodyFont }}>
                          Talep türünü seç.
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-medium"
                        style={{
                          backgroundColor: theme.secondaryColor,
                          color: theme.textColor,
                        }}
                      >
                        STEP 1
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div
                        className="rounded-[16px] border border-white/10 px-3 py-2 text-xs"
                        style={{
                          color: headingColor,
                          backgroundColor: theme.themeMode === "light" ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.14)",
                        }}
                      >
                        Özel tasarım dövme
                      </div>
                      <div
                        className="rounded-[16px] border border-white/10 px-3 py-2 text-xs"
                        style={{
                          color: bodyColor,
                          backgroundColor: theme.themeMode === "light" ? "rgba(255,255,255,0.36)" : "rgba(0,0,0,0.08)",
                        }}
                      >
                        Flash tasarım
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemePresetCard({
  title,
  description,
  active,
  onSelect,
  artist,
  theme,
  selectedLabel,
}: {
  title: string;
  description: string;
  active: boolean;
  onSelect: () => void;
  artist: ArtistPageData;
  theme: ArtistPageTheme;
  selectedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-[30px] border p-5 text-left transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_82%,white)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_0_0_1px_rgba(247,177,93,0.10),0_24px_80px_rgba(0,0,0,0.34),0_0_70px_rgba(247,177,93,0.10)]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_24px_70px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:border-white/16 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
        style={{
          background: `radial-gradient(circle at top, color-mix(in srgb, ${theme.primaryColor} 18%, transparent), transparent 72%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-[1px] rounded-[28px] border border-white/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[1.05rem] font-semibold tracking-[-0.02em] text-white">{title}</p>
          <p className="mt-1.5 max-w-[28ch] text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_90%,white_6%)]">
            {description}
          </p>
        </div>
        {active ? <ThemeSelectionBadge label={selectedLabel} /> : null}
      </div>

      <div className="relative mt-5">
        <ThemeCardPreview artist={artist} theme={theme} />
      </div>
    </button>
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
          presetTitle: "Hazır temalar",
          presetDescription: "Hazır bir tema seç ve hemen uygula.",
          presetHint: "En hızlı yol hazır temalardan birini seçmek.",
          presetMode: "Hazır tema kullan",
          customMode: "Kendi stilini oluştur",
          previewTitle: "Canlı önizleme",
          previewDescription: "Seçtiğin görünüm müşteri sayfanda böyle görünür.",
          customTitle: "Gelişmiş ayarlar",
          customDescription: "Renkleri kendine göre düzenle.",
          quickPresets: "Hızlı seçimler",
          quickPresetsDescription: "Tek tıkla temel görünümü değiştir.",
          colors: "Renkler",
          colorsDescription: "Sadece ana vurgu rengini seç.",
          primaryColor: "Ana renk",
          customColor: "Detaylı renk seç",
          backgrounds: "Arka plan",
          backgroundsDescription: "Düz veya degrade bir arka plan seç.",
          solid: "Düz renk",
          gradient: "Degrade",
          image: "Görsel",
          backgroundType: "Arka plan türü",
          backgroundColor: "Arka plan rengi",
          gradientStart: "Başlangıç rengi",
          gradientEnd: "Bitiş rengi",
          backgroundImage: "Arka plan görseli",
          backgroundImageHelp: "Sadece görsel yükle. Mobil için dikey 1080 × 1920'e yakın bir görsel en iyi sonucu verir.",
          noBackground: "Henüz arka plan görseli seçilmedi",
          uploadImage: "Görsel yükle",
          removeImage: "Görseli kaldır",
          fonts: "Font",
          fontsDescription: "Sayfanın genel yazı karakterini seç.",
          fontLabel: "Font stili",
          saveTheme: "Bu görünümü kaydet",
          saveThemeDescription: "Bu ayarları tekrar kullanmak için kaydedebilirsin.",
          presetName: "Tema adı",
          presetNamePlaceholder: "Örn. Gece altını",
          savePreset: "Temayı kaydet",
          savedThemes: "Kaydedilen temalar",
          savedThemesDescription: "Daha önce kaydettiğin stilleri buradan tekrar uygulayabilirsin.",
          applyTheme: "Uygula",
          renameTheme: "Yeniden adlandır",
          deleteTheme: "Sil",
          renamePrompt: "Tema için yeni adı gir",
          resetDefaults: "Varsayılana dön",
          save: "Görünümü uygula",
          saveHelp: "Seçtiğin tema müşteri sayfanda görünür.",
          saving: "Kaydediliyor",
          demo: "Demo modunda yalnızca önizleme",
          selected: "Seçildi",
        }
      : {
          presetTitle: "Preset themes",
          presetDescription: "Pick a theme and apply it right away.",
          presetHint: "The fastest path is choosing one of the preset themes.",
          presetMode: "Use preset theme",
          customMode: "Build your own style",
          previewTitle: "Live preview",
          previewDescription: "This is how the selected look appears on the client page.",
          customTitle: "Advanced settings",
          customDescription: "Adjust the colors to fit your style.",
          quickPresets: "Quick presets",
          quickPresetsDescription: "Change the overall mood in one click.",
          colors: "Colors",
          colorsDescription: "Pick the main accent color.",
          primaryColor: "Primary color",
          customColor: "Fine tune color",
          backgrounds: "Background",
          backgroundsDescription: "Choose a solid or gradient background.",
          solid: "Solid",
          gradient: "Gradient",
          image: "Image",
          backgroundType: "Background type",
          backgroundColor: "Background color",
          gradientStart: "Start color",
          gradientEnd: "End color",
          backgroundImage: "Background image",
          backgroundImageHelp: "Upload only. A vertical image close to 1080 × 1920 works best on mobile.",
          noBackground: "No background image selected",
          uploadImage: "Upload image",
          removeImage: "Remove image",
          fonts: "Font",
          fontsDescription: "Pick the font feel for the whole page.",
          fontLabel: "Font style",
          saveTheme: "Save this look",
          saveThemeDescription: "Save these settings if you want to reuse them.",
          presetName: "Theme name",
          presetNamePlaceholder: "e.g. Night gold",
          savePreset: "Save theme",
          savedThemes: "Saved themes",
          savedThemesDescription: "Reuse your saved styles from here.",
          applyTheme: "Apply",
          renameTheme: "Rename",
          deleteTheme: "Delete",
          renamePrompt: "Enter a new name for this theme",
          resetDefaults: "Reset to default",
          save: "Apply look",
          saveHelp: "The selected look will show on your client page.",
          saving: "Saving",
          demo: "Preview only in demo mode",
          selected: "Selected",
        };

  const presetDescriptions =
    locale === "tr"
      ? {
          "dark-minimal": "Sade ve temiz görünüm",
          "gothic-black": "Daha sert, soğuk ve dramatik",
          "soft-neutral": "Açık, yumuşak ve ferah",
          "luxury-serif": "Daha premium ve klasik",
          "neon-accent": "Daha dikkat çekici",
        }
      : {
          "dark-minimal": "Clean and minimal",
          "gothic-black": "Sharper, colder, and more dramatic",
          "soft-neutral": "Light, soft, and airy",
          "luxury-serif": "More premium and classic",
          "neon-accent": "More attention-grabbing",
        };

  const unifiedFontMap = {
    modern: { headingFont: "modern-sans", bodyFont: "clean-sans", fontPairingPreset: "bold-modern" },
    serif: { headingFont: "editorial-serif", bodyFont: "clean-sans", fontPairingPreset: "elegant-editorial" },
    editorial: { headingFont: "display-serif", bodyFont: "editorial-sans", fontPairingPreset: "premium-editorial" },
    gothic: { headingFont: "gothic-sans", bodyFont: "neutral-sans", fontPairingPreset: "edgy-clean" },
    minimal: { headingFont: "mono-display", bodyFont: "mono-body", fontPairingPreset: "minimal-sans" },
  } as const;

  const inferFontStyle = (headingFont: string) => {
    if (headingFont === "display-serif") {
      return "editorial";
    }
    if (headingFont === "editorial-serif") {
      return "serif";
    }
    if (headingFont === "gothic-sans") {
      return "gothic";
    }
    if (headingFont === "mono-display") {
      return "minimal";
    }
    return "modern";
  };

  const [presetName, setPresetName] = useState("");
  const [customizeMode, setCustomizeMode] = useState<"preset" | "custom">("preset");

  const form = useForm<ThemeFormInput, unknown, ThemeValues>({
    resolver: zodResolver(pageThemeSchema),
    defaultValues: {
      presetTheme: theme.presetTheme,
      backgroundType: theme.backgroundType,
      backgroundColor: theme.backgroundColor,
      gradientStart: theme.gradientStart,
      gradientEnd: theme.gradientEnd,
      backgroundImageUrl: theme.backgroundImageUrl ?? "",
      textColor: theme.textColor,
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
  const currentTextColor = watchedValues.textColor ?? theme.textColor;
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentGradientStart = watchedValues.gradientStart ?? theme.gradientStart;
  const currentGradientEnd = watchedValues.gradientEnd ?? theme.gradientEnd;
  const currentBackgroundType = watchedValues.backgroundType ?? theme.backgroundType;
  const currentCardOpacity =
    typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
  const currentFontStyle = inferFontStyle(watchedValues.headingFont ?? theme.headingFont);

  const previewTheme = useMemo(
    () =>
      resolveArtistTheme({
        artistId: artist.profile.id,
        presetTheme: currentPreset,
        backgroundType: currentBackgroundType,
        backgroundColor: currentBackgroundColor,
        gradientStart: currentGradientStart,
        gradientEnd: currentGradientEnd,
        backgroundImageUrl: watchedValues.backgroundImageUrl || null,
        textColor: currentTextColor,
        primaryColor: currentPrimaryColor,
        secondaryColor: currentSecondaryColor,
        cardColor: currentCardColor,
        cardOpacity: currentCardOpacity,
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
      currentBackgroundType,
      currentCardColor,
      currentCardOpacity,
      currentGradientEnd,
      currentGradientStart,
      currentPreset,
      currentTextColor,
      currentPrimaryColor,
      currentSecondaryColor,
      theme.bodyFont,
      watchedValues.backgroundImageUrl,
      theme.fontPairingPreset,
      theme.headingFont,
      theme.radiusStyle,
      watchedValues.bodyFont,
      watchedValues.customCtaLabel,
      watchedValues.customIntroText,
      watchedValues.customWelcomeTitle,
      watchedValues.featuredSectionLabel1,
      watchedValues.featuredSectionLabel2,
      watchedValues.fontPairingPreset,
      watchedValues.headingFont,
      watchedValues.radiusStyle,
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
      textColor: storedTheme.textColor,
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

  async function onSubmit(values: ThemeValues) {
    await saveTheme(values, false);
  }

  async function handleBackgroundUpload(file: File) {
    if (demoMode) {
      form.setError("root", { message: locale === "tr" ? "Demo modunda arka plan görseli yüklenemez." : "Background upload is unavailable in demo mode." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: locale === "tr" ? "Yalnızca görsel dosyaları yükleyebilirsin." : "Only image files are allowed." });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      form.setError("root", { message: locale === "tr" ? "Görseller en fazla 8 MB olabilir." : "Background images must be 8 MB or smaller." });
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
      form.setValue("backgroundType", "image", { shouldDirty: true, shouldValidate: true });
      form.setError("root", { message: locale === "tr" ? "Arka plan görseli yüklendi." : "Background image uploaded." });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : locale === "tr" ? "Arka plan görseli yüklenemedi." : "Unable to upload background image.",
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
      form.setValue("backgroundType", "gradient", { shouldDirty: true, shouldValidate: true });
    }
  }

  function normalizeThemeValues(values: ThemeValues): ThemeValues {
    const resolved = resolveArtistTheme({
      artistId: artist.profile.id,
      ...values,
      backgroundImageUrl: values.backgroundImageUrl || null,
      themeMode: values.themeMode,
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
      textColor: resolved.textColor,
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
          locale === "tr"
            ? "Demo görünümü yerel olarak kaydedildi."
            : "Demo theme saved locally.",
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
        message: payload.message ?? (locale === "tr" ? "Görünüm kaydedilemedi." : "Unable to save appearance."),
      });
      return;
    }

    form.setError("root", {
      message:
        payload.message ?? (locale === "tr" ? "Görünüm kaydedildi." : "Appearance saved."),
    });
    if (savePreset) {
      setPresetName("");
    }
    router.refresh();
  }

  function applyPreset(presetKey: ThemeFormInput["presetTheme"]) {
    const preset = themePresets[presetKey];
    form.setValue("presetTheme", presetKey, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundType", preset.backgroundType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("backgroundColor", preset.backgroundColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", preset.gradientStart, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", preset.gradientEnd, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundImageUrl", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("textColor", preset.textColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("primaryColor", preset.primaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("secondaryColor", preset.secondaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardColor", preset.cardColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardOpacity", preset.cardOpacity, { shouldDirty: true, shouldValidate: true });
    form.setValue("headingFont", preset.headingFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("bodyFont", preset.bodyFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("fontPairingPreset", preset.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
    form.setValue("radiusStyle", preset.radiusStyle, { shouldDirty: true, shouldValidate: true });
    form.setValue("themeMode", preset.themeMode, { shouldDirty: true, shouldValidate: true });
  }

  function resetThemeToDefault() {
    applyPreset("dark-minimal");
    form.setValue("backgroundImageUrl", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("customWelcomeTitle", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("customIntroText", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("customCtaLabel", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("featuredSectionLabel1", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("featuredSectionLabel2", "", { shouldDirty: true, shouldValidate: true });
  }

  function applySavedTheme(savedTheme: ArtistSavedTheme) {
    const values = savedTheme.theme;
    form.setValue("presetTheme", values.presetTheme, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundType", values.backgroundType, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("backgroundColor", values.backgroundColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", values.gradientStart, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", values.gradientEnd, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundImageUrl", values.backgroundImageUrl ?? "", { shouldDirty: true, shouldValidate: true });
    form.setValue("textColor", values.textColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("primaryColor", values.primaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("secondaryColor", values.secondaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardColor", values.cardColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardOpacity", values.cardOpacity, { shouldDirty: true, shouldValidate: true });
    form.setValue("headingFont", values.headingFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("bodyFont", values.bodyFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("fontPairingPreset", values.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
    form.setValue("radiusStyle", values.radiusStyle, { shouldDirty: true, shouldValidate: true });
    form.setValue("themeMode", values.themeMode, { shouldDirty: true, shouldValidate: true });
    form.setValue("customWelcomeTitle", values.customWelcomeTitle ?? "", { shouldDirty: true, shouldValidate: true });
    form.setValue("customIntroText", values.customIntroText ?? "", { shouldDirty: true, shouldValidate: true });
    form.setValue("customCtaLabel", values.customCtaLabel ?? "", { shouldDirty: true, shouldValidate: true });
    form.setValue("featuredSectionLabel1", values.featuredSectionLabel1 ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("featuredSectionLabel2", values.featuredSectionLabel2 ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    });
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

  function setFontStyle(next: keyof typeof unifiedFontMap) {
    const mapped = unifiedFontMap[next];
    form.setValue("headingFont", mapped.headingFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("bodyFont", mapped.bodyFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("fontPairingPreset", mapped.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
  }

  function applyBackgroundPreset(preset: (typeof backgroundGradientPresets)[number]) {
    form.setValue("backgroundType", "gradient", { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", preset.start, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", preset.end, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="inline-flex flex-wrap rounded-full border border-white/10 bg-black/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <Button
            type="button"
            size="sm"
            variant={customizeMode === "preset" ? "secondary" : "ghost"}
            className={cn(
              "rounded-full",
              customizeMode === "preset" ? "shadow-[0_12px_30px_rgba(0,0,0,0.18)]" : "text-[var(--foreground-muted)]",
            )}
            onClick={() => setCustomizeMode("preset")}
          >
            {copy.presetMode}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={customizeMode === "custom" ? "secondary" : "ghost"}
            className={cn(
              "rounded-full",
              customizeMode === "custom" ? "shadow-[0_12px_30px_rgba(0,0,0,0.18)]" : "text-[var(--foreground-muted)]",
            )}
            onClick={() => setCustomizeMode("custom")}
          >
            {copy.customMode}
          </Button>
        </div>

        <div
          className={cn(
            "grid gap-6 xl:items-start",
            customizeMode === "custom" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "xl:grid-cols-1",
          )}
        >
          <div className="space-y-6">
            {customizeMode === "preset" ? (
              <Card className="surface-border overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] shadow-[0_32px_120px_rgba(0,0,0,0.28)]">
                <CardHeader className="relative overflow-hidden pb-4">
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(247,177,93,0.10),transparent_72%)]" />
                  <CardTitle className="relative text-[1.2rem] tracking-[-0.02em]">{copy.presetTitle}</CardTitle>
                  <CardDescription className="relative max-w-[56ch] text-[15px] leading-7 text-[color:color-mix(in_srgb,var(--foreground-muted)_92%,white_4%)]">
                    {copy.presetDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_90%,white_3%)]">
                    {copy.presetHint}
                  </p>
                  <div className="grid gap-4 xl:grid-cols-2">
                    {themePresetOptions.map((presetKey) => {
                      const preset = themePresets[presetKey];
                      const active = currentPreset === presetKey;
                      const presetTheme = resolveArtistTheme({
                        artistId: artist.profile.id,
                        presetTheme: presetKey,
                        backgroundType: preset.backgroundType,
                        backgroundColor: preset.backgroundColor,
                        gradientStart: preset.gradientStart,
                        gradientEnd: preset.gradientEnd,
                        backgroundImageUrl: null,
                        primaryColor: preset.primaryColor,
                        secondaryColor: preset.secondaryColor,
                        cardColor: preset.cardColor,
                        cardOpacity: preset.cardOpacity,
                        headingFont: preset.headingFont,
                        bodyFont: preset.bodyFont,
                        fontPairingPreset: preset.fontPairingPreset,
                        radiusStyle: preset.radiusStyle,
                        themeMode: preset.themeMode,
                        customWelcomeTitle: artist.funnelSettings.introTitle || artist.profile.welcomeHeadline,
                        customIntroText: artist.funnelSettings.introDescription || artist.profile.shortBio,
                        customCtaLabel: locale === "tr" ? "Fiyat tahmini al" : "Start estimate",
                        featuredSectionLabel1: null,
                        featuredSectionLabel2: null,
                      });
                      const presetArtist = {
                        ...artist,
                        pageTheme: presetTheme,
                      };

                      return (
                        <ThemePresetCard
                          key={presetKey}
                          title={preset.label}
                          description={presetDescriptions[presetKey]}
                          active={active}
                          onSelect={() => applyPreset(presetKey)}
                          artist={presetArtist}
                          theme={presetTheme}
                          selectedLabel={copy.selected}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {customizeMode === "custom" ? (
              <Card className="surface-border overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] shadow-[0_32px_120px_rgba(0,0,0,0.28)]">
                <CardHeader className="relative overflow-hidden pb-4">
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(247,177,93,0.10),transparent_72%)]" />
                  <CardTitle className="relative text-[1.2rem] tracking-[-0.02em]">{copy.customTitle}</CardTitle>
                  <CardDescription className="relative max-w-[56ch] text-[15px] leading-7 text-[color:color-mix(in_srgb,var(--foreground-muted)_92%,white_4%)]">
                    {copy.customDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                        <div className="space-y-4 rounded-[26px] border border-white/8 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div>
                            <h3 className="text-sm font-medium text-white">{copy.quickPresets}</h3>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.quickPresetsDescription}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {quickCustomPresets.map((preset) => (
                              <Button
                                key={preset.key}
                                type="button"
                                variant={currentPreset === preset.key ? "secondary" : "outline"}
                                size="sm"
                                className={cn(
                                  "rounded-full",
                                  currentPreset === preset.key && "shadow-[0_14px_30px_rgba(0,0,0,0.18)]",
                                )}
                                onClick={() => applyPreset(preset.key)}
                              >
                                {locale === "tr" ? preset.labelTr : preset.labelEn}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4 rounded-[26px] border border-white/8 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div>
                            <h3 className="text-sm font-medium text-white">{copy.colors}</h3>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.colorsDescription}</p>
                          </div>
                          <div className="grid gap-4 lg:grid-cols-2">
                            <ColorField
                              label={copy.primaryColor}
                              value={currentPrimaryColor}
                              onChange={(value) => form.setValue("primaryColor", value, { shouldDirty: true, shouldValidate: true })}
                              swatches={colorSwatches}
                              customLabel={copy.customColor}
                            />
                          </div>
                        </div>

                        <div className="space-y-4 rounded-[26px] border border-white/8 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div>
                            <h3 className="text-sm font-medium text-white">{copy.backgrounds}</h3>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.backgroundsDescription}</p>
                          </div>
                          <Field label={copy.backgroundType}>
                            <NativeSelect
                              value={currentBackgroundType}
                              onChange={(event) =>
                                form.setValue("backgroundType", event.target.value as "solid" | "gradient" | "image", {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            >
                              <option value="solid">{copy.solid}</option>
                              <option value="gradient">{copy.gradient}</option>
                              <option value="image">{copy.image}</option>
                            </NativeSelect>
                          </Field>
                          {currentBackgroundType === "solid" ? (
                            <ColorField
                              label={copy.backgroundColor}
                              value={currentBackgroundColor}
                              onChange={(value) => form.setValue("backgroundColor", value, { shouldDirty: true, shouldValidate: true })}
                              swatches={backgroundSolidSwatches}
                              customLabel={copy.customColor}
                            />
                          ) : null}
                          {currentBackgroundType === "gradient" ? (
                            <>
                              <div className="flex flex-wrap gap-2">
                                {backgroundGradientPresets.map((preset) => (
                                  <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => applyBackgroundPreset(preset)}
                                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/8"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                              <div className="grid gap-4 lg:grid-cols-2">
                                <ColorField
                                  label={copy.gradientStart}
                                  value={currentGradientStart}
                                  onChange={(value) => form.setValue("gradientStart", value, { shouldDirty: true, shouldValidate: true })}
                                  swatches={backgroundSolidSwatches}
                                  customLabel={copy.customColor}
                                />
                                <ColorField
                                  label={copy.gradientEnd}
                                  value={currentGradientEnd}
                                  onChange={(value) => form.setValue("gradientEnd", value, { shouldDirty: true, shouldValidate: true })}
                                  swatches={backgroundSolidSwatches}
                                  customLabel={copy.customColor}
                                />
                              </div>
                            </>
                          ) : null}
                          {currentBackgroundType === "image" ? (
                            <Field label={copy.backgroundImage} description={copy.backgroundImageHelp}>
                              <div className="space-y-3">
                                <div className="relative flex min-h-[180px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
                                  {watchedValues.backgroundImageUrl ? (
                                    <div
                                      className="absolute inset-0 bg-cover bg-center"
                                      style={{ backgroundImage: `url(${watchedValues.backgroundImageUrl})` }}
                                      aria-label="Background preview"
                                      role="img"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-[var(--foreground-muted)]">
                                      <ImagePlus className="size-6" />
                                      <span>{copy.noBackground}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                              </div>
                            </Field>
                          ) : null}
                        </div>

                        <div className="space-y-4 rounded-[26px] border border-white/8 bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                          <div>
                            <h3 className="text-sm font-medium text-white">{copy.fonts}</h3>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.fontsDescription}</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            {fontOptions.map((option) => {
                              const active = currentFontStyle === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setFontStyle(option.value)}
                                  className={cn(
                                    "rounded-[20px] border px-4 py-4 text-left transition",
                                    active
                                      ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(247,177,93,0.08),0_18px_40px_rgba(0,0,0,0.16)]"
                                      : "border-white/8 bg-black/20 hover:-translate-y-0.5 hover:border-white/14",
                                  )}
                                >
                                  <p className="text-sm font-medium text-white">
                                    {locale === "tr" ? option.labelTr : option.labelEn}
                                  </p>
                                  <p
                                    className="mt-2 text-lg"
                                    style={{
                                      fontFamily: headingPreviewFonts[option.value],
                                    }}
                                  >
                                    Aklında ne var?
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <Card className="surface-border">
                          <CardHeader>
                            <CardTitle>{copy.saveTheme}</CardTitle>
                            <CardDescription>{copy.saveThemeDescription}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
                            </div>

                            {savedThemes.length ? (
                              <div className="grid gap-3 lg:grid-cols-2">
                                {savedThemes.map((savedTheme) => (
                                  <div key={savedTheme.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="font-medium text-white">{savedTheme.name}</p>
                                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.savedThemesDescription}</p>
                                      </div>
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
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {customizeMode === "custom" ? (
            <Card className="surface-border overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] shadow-[0_30px_90px_rgba(0,0,0,0.28)] xl:sticky xl:top-6">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(247,177,93,0.10),transparent_72%)]" />
                <CardTitle className="relative text-[1.15rem] tracking-[-0.02em]">{copy.previewTitle}</CardTitle>
                <CardDescription className="relative text-[15px] leading-7 text-[color:color-mix(in_srgb,var(--foreground-muted)_92%,white_4%)]">
                  {copy.previewDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ThemeCardPreview artist={previewArtist} theme={previewTheme} variant="panel" />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-3">
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
          <p className="text-sm text-[var(--foreground-muted)]">{copy.saveHelp}</p>
        </div>

        <input type="hidden" {...form.register("bodyFont")} />
        <input type="hidden" {...form.register("fontPairingPreset")} />
        <input type="hidden" {...form.register("backgroundImageUrl")} />
        <input type="hidden" {...form.register("textColor")} />
        <input type="hidden" {...form.register("cardOpacity")} value={String(currentCardOpacity)} />
        <input type="hidden" {...form.register("radiusStyle")} />
        <input type="hidden" {...form.register("themeMode")} value={watchedValues.themeMode ?? theme.themeMode} />
        <input type="hidden" {...form.register("customWelcomeTitle")} />
        <input type="hidden" {...form.register("customIntroText")} />
        <input type="hidden" {...form.register("customCtaLabel")} />
        <input type="hidden" {...form.register("featuredSectionLabel1")} />
        <input type="hidden" {...form.register("featuredSectionLabel2")} />

        {form.formState.errors.root?.message ? (
          <p className="text-sm text-[var(--accent-soft)]">{form.formState.errors.root.message}</p>
        ) : null}
      </form>
    </div>
  );
}
