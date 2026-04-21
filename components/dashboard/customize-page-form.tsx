"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, ImagePlus, LoaderCircle, Save, Sparkles, SwatchBook, Type, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { themePresetOptions, themePresets, type ThemePresetKey } from "@/lib/constants/theme";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { loadDemoTheme, saveDemoTheme } from "@/lib/demo-theme-storage";
import { uploadArtistAsset } from "@/lib/supabase/storage";
import { buildThemeStyles, resolveArtistTheme } from "@/lib/theme";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFunnelSettings, ArtistPageTheme, ArtistProfile, ArtistSavedTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

type ThemeFormInput = z.input<typeof pageThemeSchema>;
type ThemeValues = z.output<typeof pageThemeSchema>;
type BackgroundStyleChoice = "solid" | "soft-gradient" | "deep-gradient" | "image";

type CustomizePageArtist = {
  profile: ArtistProfile;
  funnelSettings: ArtistFunnelSettings;
};

const accentSwatches = ["#E3C08E", "#D6B17A", "#C79A68", "#B88352", "#C6B29A"] as const;
const cardSwatches = ["#17191D", "#1D1F24", "#23262C", "#2A2D34", "#302A26"] as const;

const backgroundPalettePresets = [
  { key: "graphite", labelTr: "Düz graphite", labelEn: "Solid graphite", mode: "dark" as const, start: "#121315", end: "#121315" },
  { key: "soft-gradient", labelTr: "Soft gradient", labelEn: "Soft gradient", mode: "dark" as const, start: "#1E1E22", end: "#141518" },
  { key: "deep-gradient", labelTr: "Deep gradient", labelEn: "Deep gradient", mode: "dark" as const, start: "#1A1C22", end: "#0F1012" },
  { key: "ink-blue", labelTr: "Ink blue haze", labelEn: "Ink blue haze", mode: "dark" as const, start: "#1A2230", end: "#11161E" },
] as const;

const fontOptions = [
  { value: "inter", label: "Inter", helperTr: "Temiz ve dengeli", helperEn: "Clean and balanced" },
  { value: "manrope", label: "Manrope", helperTr: "Yumuşak ve çağdaş", helperEn: "Soft and contemporary" },
  { value: "outfit", label: "Outfit", helperTr: "Net ve daha karakterli", helperEn: "Crisp and more distinctive" },
] as const;

const presetMeta: Record<
  ThemePresetKey,
  { title: string; descriptionTr: string; descriptionEn: string; chipsTr: string[]; chipsEn: string[] }
> = {
  "bronze-studio": {
    title: "Bronze Studio",
    descriptionTr: "Sıcak grafit zemin, yumuşak bronz vurgu ve temiz editoryal denge.",
    descriptionEn: "Warm graphite surfaces with soft bronze accents and an editorial balance.",
    chipsTr: ["Sıcak", "Rafine", "Net"],
    chipsEn: ["Warm", "Refined", "Clean"],
  },
  "smoke-metal": {
    title: "Smoke Alloy",
    descriptionTr: "Daha nötr, metalik yüzeyler ve kontrollü kontrast isteyenler için.",
    descriptionEn: "A more neutral metallic surface system with controlled contrast.",
    chipsTr: ["Nötr", "Metalik", "Kontrollü"],
    chipsEn: ["Neutral", "Metallic", "Controlled"],
  },
  "dark-alloy": {
    title: "Ink Midnight",
    descriptionTr: "Daha derin koyu tonlar ve hafif ink-blue derinlik ile gece hissi verir.",
    descriptionEn: "A deeper dark mood with a subtle ink-blue depth for a night feel.",
    chipsTr: ["Derin", "Mürekkep tonu", "Gece hissi"],
    chipsEn: ["Deep", "Ink-toned", "Midnight"],
  },
};

const headingPreviewFonts = {
  inter: '"Inter", "Helvetica Neue", sans-serif',
  manrope: '"Manrope", "Inter", sans-serif',
  outfit: '"Outfit", "Inter", sans-serif',
} as const;

const bodyPreviewFonts = {
  inter: '"Inter", "Helvetica Neue", sans-serif',
  manrope: '"Manrope", "Inter", sans-serif',
  outfit: '"Outfit", "Inter", sans-serif',
} as const;

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;
  const parsed = Number.parseInt(normalized, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
}

function toRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildFormValues(source: ArtistPageTheme): ThemeValues {
  return {
    presetTheme: source.presetTheme,
    backgroundType: source.backgroundType,
    backgroundColor: source.backgroundColor,
    gradientStart: source.gradientStart,
    gradientEnd: source.gradientEnd,
    backgroundImageUrl: source.backgroundImageUrl ?? "",
    textColor: source.textColor,
    primaryColor: source.primaryColor,
    secondaryColor: source.secondaryColor,
    cardColor: source.cardColor,
    cardOpacity: source.cardOpacity,
    headingFont: source.headingFont,
    bodyFont: source.bodyFont,
    fontPairingPreset: source.fontPairingPreset,
    radiusStyle: source.radiusStyle,
    themeMode: source.themeMode,
    customWelcomeTitle: source.customWelcomeTitle ?? "",
    customIntroText: source.customIntroText ?? "",
    customCtaLabel: source.customCtaLabel ?? "",
    featuredSectionLabel1: source.featuredSectionLabel1 ?? "",
    featuredSectionLabel2: source.featuredSectionLabel2 ?? "",
  };
}

function inferFontStyle(headingFont: string) {
  if (headingFont === "manrope") return "manrope";
  if (headingFont === "outfit" || headingFont === "dm-sans" || headingFont === "general-sans") return "outfit";
  return "inter";
}

function inferBackgroundStyle(backgroundType: string, themeMode: string): BackgroundStyleChoice {
  if (backgroundType === "image") return "image";
  if (backgroundType === "solid") return "solid";
  return themeMode === "light" ? "soft-gradient" : "deep-gradient";
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-0.5 inline-flex size-10 items-center justify-center rounded-[18px] border border-[var(--border-soft)] bg-white/[0.03] text-[var(--accent)]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-[1.02rem] tracking-[-0.02em]">{title}</CardTitle>
            {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function SelectionPill({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2.5 text-sm font-medium transition",
        active
          ? "border-[var(--border-strong)] bg-[rgba(214,177,122,0.14)] text-[var(--text-primary)] shadow-[0_0_0_1px_rgba(214,177,122,0.08),0_8px_24px_rgba(0,0,0,0.2)]"
          : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ColorDot({
  active,
  color,
  onClick,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={color}
      className={cn(
        "size-10 rounded-full border transition",
        active
          ? "scale-[1.05] border-[rgba(255,255,255,0.72)] shadow-[0_0_0_4px_rgba(214,177,122,0.08)]"
          : "border-[rgba(255,255,255,0.1)] hover:scale-[1.02] hover:border-[rgba(255,255,255,0.2)]",
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function ThemeMiniPalette({ theme }: { theme: ArtistPageTheme }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full border border-white/10" style={{ backgroundColor: theme.backgroundColor }} />
      <span className="size-3 rounded-full border border-white/10" style={{ backgroundColor: theme.cardColor }} />
      <span className="size-3 rounded-full border border-white/10" style={{ backgroundColor: theme.primaryColor }} />
    </div>
  );
}

function ThemePresetPreview({
  theme,
  title,
  locale,
}: {
  theme: ArtistPageTheme;
  title: string;
  locale: PublicLocale;
}) {
  const accentGlow = toRgba(theme.primaryColor, 0.2);
  const textSoft = toRgba(theme.textColor, 0.48);
  const textStrong = toRgba(theme.textColor, 0.94);
  const cardTint = toRgba(theme.cardColor, Math.min(theme.cardOpacity + 0.02, 0.96));
  const heading =
    locale === "tr" ? "Hazır tasarımlar ve talep akışı" : "Ready-made designs and request flow";
  const supporting =
    locale === "tr"
      ? "Müşteri tasarımları görür, yaklaşık fiyatı inceler ve sana talep yollar."
      : "Clients browse designs, review an estimate, and send a request.";

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-white/8 p-5"
      style={{
        background:
          theme.backgroundType === "gradient"
            ? `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`
            : theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at top left, ${accentGlow}, transparent 42%), radial-gradient(circle at 82% 20%, ${toRgba(theme.secondaryColor, 0.24)}, transparent 36%)`,
        }}
      />
      <div className="relative space-y-5">
        <div className="flex items-center justify-between gap-4">
          <ThemeMiniPalette theme={theme} />
          <span
            className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: textStrong, backgroundColor: toRgba(theme.primaryColor, 0.14) }}
          >
            {title}
          </span>
        </div>
        <div className="max-w-[30rem] space-y-2">
          <p
            className="text-[1.02rem] font-semibold tracking-[-0.03em]"
            style={{ color: textStrong, fontFamily: headingPreviewFonts[theme.headingFont] }}
          >
            {heading}
          </p>
          <p className="text-[12px] leading-6" style={{ color: textSoft, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
            {supporting}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_220px] lg:items-center">
          <div className="rounded-[22px] border p-4" style={{ borderColor: toRgba(theme.textColor, 0.09), backgroundColor: cardTint }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] border p-4" style={{ borderColor: toRgba(theme.textColor, 0.08), backgroundColor: toRgba(theme.cardColor, 0.72) }}>
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: textSoft }}>
                    {locale === "tr" ? "Profil üst alanı" : "Profile header"}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: textStrong }}>
                    Gizem Oder
                  </p>
                  <p className="text-[12px]" style={{ color: textSoft }}>
                    {locale === "tr" ? "@itsgizo • Özel tasarım ve flash" : "@itsgizo • Custom work and flash"}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.18), color: textStrong }}>
                    {locale === "tr" ? "Hazır tasarımlar" : "Flash designs"}
                  </span>
                  <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.textColor, 0.08), color: textSoft }}>
                    {locale === "tr" ? "Talep formu" : "Request form"}
                  </span>
                </div>
              </div>
              <div className="rounded-[18px] border p-4" style={{ borderColor: toRgba(theme.textColor, 0.08), backgroundColor: toRgba(theme.cardColor, 0.68) }}>
                <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: textSoft }}>
                  {locale === "tr" ? "Tasarım listesi" : "Design list"}
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3 rounded-[14px] border px-3 py-2.5" style={{ borderColor: toRgba(theme.textColor, 0.08), backgroundColor: toRgba(theme.cardColor, 0.58) }}>
                    <div className="size-10 rounded-[12px]" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16) }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: textStrong }}>
                        Dagger
                      </p>
                      <p className="text-[11px]" style={{ color: textSoft }}>
                        {locale === "tr" ? "Flash tasarım • 10 cm" : "Flash design • 10 cm"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[14px] border px-3 py-2.5" style={{ borderColor: toRgba(theme.textColor, 0.08), backgroundColor: toRgba(theme.cardColor, 0.58) }}>
                    <div className="size-10 rounded-[12px]" style={{ backgroundColor: toRgba(theme.primaryColor, 0.12) }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: textStrong }}>
                        ₺8.000 – ₺10.500
                      </p>
                      <p className="text-[11px]" style={{ color: textSoft }}>
                        {locale === "tr" ? "Yaklaşık fiyat aralığı" : "Estimated price range"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="w-[220px] rounded-[32px] border border-white/10 bg-[rgba(10,10,12,0.45)] p-2.5 shadow-[0_20px_48px_rgba(0,0,0,0.24)]">
              <div
                className="overflow-hidden rounded-[26px] border p-3"
                style={{
                  borderColor: toRgba(theme.textColor, 0.08),
                  background:
                    theme.backgroundType === "gradient"
                      ? `linear-gradient(180deg, ${theme.gradientStart}, ${theme.gradientEnd})`
                      : theme.backgroundColor,
                }}
              >
                <div className="rounded-[18px] border p-3.5" style={{ borderColor: toRgba(theme.textColor, 0.09), backgroundColor: toRgba(theme.cardColor, 0.34) }}>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-[14px] border border-white/10 bg-white/10" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: textStrong }}>
                        Gizem Oder
                      </p>
                      <p className="text-[11px]" style={{ color: textSoft }}>
                        @itsgizo
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-[20px] border p-4" style={{ borderColor: toRgba(theme.textColor, 0.09), backgroundColor: toRgba(theme.cardColor, 0.76) }}>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16), color: textStrong }}>
                    {locale === "tr" ? "Talep formu" : "Request form"}
                  </span>
                  <p
                    className="mt-3 text-lg font-semibold leading-tight tracking-[-0.03em]"
                    style={{ color: textStrong, fontFamily: headingPreviewFonts[theme.headingFont] }}
                  >
                    {locale === "tr" ? "Aklındaki işi birlikte netleştirelim." : "Let's shape the idea together."}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="h-10 rounded-[14px]" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16) }} />
                    <div className="h-10 rounded-[14px] border" style={{ borderColor: toRgba(theme.textColor, 0.1), backgroundColor: toRgba(theme.cardColor, 0.58) }} />
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

function BackgroundStyleCard({
  title,
  active,
  preview,
  onClick,
}: {
  title: string;
  active: boolean;
  preview: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[22px] border p-3 text-left transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_54%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]"
          : "border-white/8 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.04]",
      )}
    >
      <div className="space-y-3">
        <div className="overflow-hidden rounded-[16px] border border-white/8 p-3">
          {preview}
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      </div>
    </button>
  );
}

function MediaUploadField({
  imageUrl,
  emptyLabel,
  uploadLabel,
  removeLabel,
  onUpload,
  onRemove,
}: {
  imageUrl: string;
  emptyLabel: string;
  uploadLabel: string;
  removeLabel: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-[20px] border border-white/8 bg-white/[0.03]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={uploadLabel} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-[var(--foreground-muted)]">
            <ImagePlus className="size-5" />
            <span>{emptyLabel}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-sm text-white transition hover:bg-white/[0.08]">
          <Upload className="size-4" />
          {uploadLabel}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        {imageUrl ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <X className="size-4" />
            {removeLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ThemePresetCard({
  active,
  title,
  description,
  chips,
  onSelect,
  theme,
  selectedLabel,
  locale,
}: {
  active: boolean;
  title: string;
  description: string;
  chips: string[];
  onSelect: () => void;
  theme: ArtistPageTheme;
  selectedLabel: string;
  locale: PublicLocale;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-[30px] border p-5 text-left transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
          : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.035]",
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
        <div className="relative">
          <ThemePresetPreview theme={theme} title={title} locale={locale} />
          {active ? (
            <span className="absolute right-4 top-4 rounded-full border border-white/18 bg-black/24 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              {selectedLabel}
            </span>
          ) : null}
        </div>
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-white">{title}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--foreground-muted)]">{description}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-[var(--text-muted)]">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

function AppearancePreview({
  artist,
  theme,
  locale,
}: {
  artist: CustomizePageArtist;
  theme: ArtistPageTheme;
  locale: PublicLocale;
}) {
  const { wrapperStyle, tokens } = buildThemeStyles(theme);
  const headingColor = tokens.text;
  const mutedColor = tokens.muted;
  const cardText = tokens.cardText;
  const cardMuted = tokens.cardMuted;
  const shellBackground = String(wrapperStyle.background ?? theme.backgroundColor);
  const cardBackground = toRgba(theme.cardColor, theme.cardOpacity);
  const cardBorder = tokens.borderColor;
  const accentForeground = tokens.primaryForeground;
  const title = artist.profile.welcomeHeadline?.trim() || (locale === "tr" ? "Aklında ne var?" : "What do you have in mind?");
  const intro =
    artist.profile.shortBio?.trim() ||
    (locale === "tr"
      ? "Müşteri sana yazmadan önce temel detayları burada paylaşır."
      : "Clients share the key details here before they message you.");

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,#1B1D21_0%,#15171B_100%)] p-5 shadow-[0_28px_72px_rgba(0,0,0,0.26)] sm:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,177,122,0.06),transparent_34%)]" />
      <div className="relative mx-auto max-w-[560px]">
        <div className="rounded-[42px] border border-[rgba(255,255,255,0.08)] bg-[rgba(16,17,20,0.72)] p-3.5 shadow-[0_24px_56px_rgba(0,0,0,0.28)]">
          <div className="overflow-hidden rounded-[34px] border" style={{ borderColor: cardBorder, background: shellBackground }}>
            <div className="p-5 sm:p-6">
              <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.28) }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-[18px] border border-white/12 bg-white/10" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: cardText, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
                        {artist.profile.artistName}
                      </p>
                      <p className="text-xs" style={{ color: cardMuted }}>
                        {artist.profile.instagramHandle ? `@${artist.profile.instagramHandle}` : "tattix"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.18), color: cardText }}>
                    {locale === "tr" ? "Profil" : "Profile"}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-5 rounded-[32px] border p-6 sm:p-7" style={{ borderColor: cardBorder, backgroundColor: cardBackground }}>
                <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16), color: headingColor }}>
                  {artist.funnelSettings.introEyebrow || (locale === "tr" ? "Talep formu" : "Request form")}
                </div>
                <div>
                  <p className="text-[1.9rem] font-semibold leading-tight tracking-[-0.03em]" style={{ color: cardText, fontFamily: headingPreviewFonts[theme.headingFont] }}>
                    {title}
                  </p>
                  <p className="mt-3 text-sm leading-7" style={{ color: cardMuted, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
                    {intro}
                  </p>
                </div>
                <div className="grid gap-3.5">
                  <div className="flex items-center gap-3 rounded-[24px] border p-4.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.46) }}>
                    <div className="size-12 rounded-[16px] border border-white/10 bg-white/10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: cardText }}>
                        {locale === "tr" ? "Hazır tasarımlar" : "Ready-made designs"}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: cardMuted }}>
                        {locale === "tr" ? "Flash tasarım • 10 cm" : "Flash design • 10 cm"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[24px] border p-4.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.46) }}>
                    <div className="size-12 rounded-[16px] border border-white/10 bg-white/10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold" style={{ color: cardText }}>
                        {locale === "tr" ? "Tahmini fiyat aralığı" : "Estimated price range"}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: cardMuted }}>
                        ₺8.000 – ₺10.500
                      </p>
                    </div>
                  </div>
                </div>
                <div className="inline-flex rounded-full px-4 py-2.5 text-sm font-medium shadow-[0_10px_24px_rgba(0,0,0,0.18)]" style={{ backgroundColor: theme.primaryColor, color: accentForeground }}>
                  {locale === "tr" ? "Fiyat tahmini al" : "Start estimate"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomizePageForm({
  artist,
  theme,
  savedThemes: _savedThemes,
  demoMode,
  locale = "en",
}: {
  artist: CustomizePageArtist;
  theme: ArtistPageTheme;
  savedThemes: ArtistSavedTheme[];
  demoMode: boolean;
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const copy =
    locale === "tr"
      ? {
          presetMode: "Hazır görünümler",
          customMode: "Kendi görünümün",
          previewTitle: "Önizleme",
          previewDescription: "Müşterinin göreceği mobil profil burada anlık görünür.",
          previewToggleOpen: "Önizlemeyi göster",
          previewToggleClose: "Önizlemeyi gizle",
          presetSectionTitle: "Hazır görünümler",
          presetSectionDescription: "Her görünüm müşterinin göreceği mobil profil hissini farklı bir karakterle sunar.",
          customTitle: "Kendi görünümün",
          accentTitle: "Vurgu rengi",
          backgroundTitle: "Arka plan stili",
          backgroundSolid: "Düz",
          backgroundSoft: "Yumuşak degrade",
          backgroundDeep: "Derin degrade",
          backgroundImage: "Görsel",
          backgroundUploadEmpty: "Arka plan görseli ekleyebilirsin.",
          backgroundUpload: "Görsel yükle",
          backgroundRemove: "Kaldır",
          cardTitle: "Kart rengi",
          fontTitle: "Yazı stili",
          resetDefaults: "Varsayılana dön",
          save: "Görünümü uygula",
          cancel: "Vazgeç",
          stickyHint: "Önizleme anlık güncellenir. Kaydettiğinde profil sayfanda görünür.",
          saving: "Kaydediliyor",
          demo: "Demo modunda yalnızca önizleme",
          selected: "Seçili",
          savedToast: "Görünüm güncellendi",
          uploadUnavailable: "Demo modunda arka plan görseli yüklenemiyor.",
          uploadType: "Sadece görsel dosyaları yükleyebilirsin.",
          uploadSize: "Görseller en fazla 6 MB olabilir.",
          uploadQueued: "Arka plan görseli yüklendi.",
          uploadFailed: "Arka plan görseli yüklenemedi.",
        }
      : {
          presetMode: "Ready-made looks",
          customMode: "Your look",
          previewTitle: "Preview",
          previewDescription: "The customer-facing mobile profile updates here instantly.",
          previewToggleOpen: "Show preview",
          previewToggleClose: "Hide preview",
          presetSectionTitle: "Ready-made looks",
          presetSectionDescription: "Each preset gives the client-facing mobile profile a distinct character.",
          customTitle: "Your look",
          accentTitle: "Accent color",
          backgroundTitle: "Background style",
          backgroundSolid: "Solid",
          backgroundSoft: "Soft gradient",
          backgroundDeep: "Deep gradient",
          backgroundImage: "Image",
          backgroundUploadEmpty: "You can add a background image.",
          backgroundUpload: "Upload image",
          backgroundRemove: "Remove",
          cardTitle: "Card color",
          fontTitle: "Type style",
          resetDefaults: "Reset to default",
          save: "Apply look",
          cancel: "Discard",
          stickyHint: "The preview updates instantly. It appears on your profile page after you save.",
          saving: "Saving",
          demo: "Preview only in demo mode",
          selected: "Selected",
          savedToast: "Appearance updated",
          uploadUnavailable: "Background uploads are unavailable in demo mode.",
          uploadType: "Only image files are allowed.",
          uploadSize: "Images must be 6 MB or smaller.",
          uploadQueued: "Background image uploaded.",
          uploadFailed: "Unable to upload background image.",
        };

  const form = useForm<ThemeFormInput, unknown, ThemeValues>({
    resolver: zodResolver(pageThemeSchema),
    defaultValues: buildFormValues(theme),
  });

  const watchedValues = useWatch({ control: form.control });
  const currentPreset = watchedValues.presetTheme ?? theme.presetTheme;
  const currentBackgroundType = watchedValues.backgroundType ?? theme.backgroundType;
  const currentBackgroundColor = watchedValues.backgroundColor ?? theme.backgroundColor;
  const currentGradientStart = watchedValues.gradientStart ?? theme.gradientStart;
  const currentGradientEnd = watchedValues.gradientEnd ?? theme.gradientEnd;
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentTextColor = watchedValues.textColor ?? theme.textColor;
  const currentCardOpacity =
    typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
  const currentThemeMode = watchedValues.themeMode ?? theme.themeMode;
  const currentFontStyle = inferFontStyle(watchedValues.headingFont ?? theme.headingFont);
  const currentBackgroundStyle = inferBackgroundStyle(currentBackgroundType, currentThemeMode);

  const [customizeMode, setCustomizeMode] = useState<"preset" | "custom">("preset");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!flashMessage) return;
    const timeout = window.setTimeout(() => setFlashMessage(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    if (!demoMode) return;
    const storedTheme = loadDemoTheme();
    if (storedTheme) form.reset(buildFormValues(storedTheme));
  }, [demoMode, form]);

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
        secondaryColor: watchedValues.secondaryColor ?? theme.secondaryColor,
        cardColor: currentCardColor,
        cardOpacity: currentCardOpacity,
        headingFont: watchedValues.headingFont ?? theme.headingFont,
        bodyFont: watchedValues.bodyFont ?? theme.bodyFont,
        fontPairingPreset: watchedValues.fontPairingPreset ?? theme.fontPairingPreset,
        radiusStyle: watchedValues.radiusStyle ?? theme.radiusStyle,
        themeMode: currentThemeMode,
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
      currentPrimaryColor,
      currentTextColor,
      currentThemeMode,
      theme.bodyFont,
      theme.fontPairingPreset,
      theme.headingFont,
      theme.radiusStyle,
      theme.secondaryColor,
      watchedValues.backgroundImageUrl,
      watchedValues.bodyFont,
      watchedValues.customCtaLabel,
      watchedValues.customIntroText,
      watchedValues.customWelcomeTitle,
      watchedValues.featuredSectionLabel1,
      watchedValues.featuredSectionLabel2,
      watchedValues.fontPairingPreset,
      watchedValues.headingFont,
      watchedValues.radiusStyle,
      watchedValues.secondaryColor,
    ],
  );

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
    return buildFormValues(resolved);
  }

  function applyPreset(presetKey: ThemePresetKey) {
    const preset = themePresets[presetKey];
    form.setValue("presetTheme", presetKey, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundType", preset.backgroundType, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundColor", preset.backgroundColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", preset.gradientStart, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", preset.gradientEnd, { shouldDirty: true, shouldValidate: true });
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

  function resetThemeToCurrent() {
    form.reset(buildFormValues(theme));
    form.clearErrors("root");
  }

  function resetThemeToDefault() {
    const defaultTheme = resolveArtistTheme({ presetTheme: "dark-alloy", artistId: artist.profile.id });
    form.reset(buildFormValues(defaultTheme));
    form.clearErrors("root");
  }

  function setFontStyle(next: (typeof fontOptions)[number]["value"]) {
    const mapped =
      next === "manrope"
        ? ({ headingFont: "manrope", bodyFont: "manrope", fontPairingPreset: "manrope-refined" } as const)
        : next === "outfit"
          ? ({ headingFont: "outfit", bodyFont: "inter", fontPairingPreset: "outfit-modern" } as const)
          : ({ headingFont: "inter", bodyFont: "inter", fontPairingPreset: "inter-neutral" } as const);

    form.setValue("headingFont", mapped.headingFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("bodyFont", mapped.bodyFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("fontPairingPreset", mapped.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
  }

  function setBackgroundStyle(next: BackgroundStyleChoice) {
    if (next === "image") {
      form.setValue("backgroundType", "image", { shouldDirty: true, shouldValidate: true });
      return;
    }

    if (next === "solid") {
      form.setValue("backgroundType", "solid", { shouldDirty: true, shouldValidate: true });
      form.setValue("themeMode", "dark", { shouldDirty: true, shouldValidate: true });
      form.setValue("backgroundColor", "#121315", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const preset = next === "soft-gradient" ? backgroundPalettePresets[1] : backgroundPalettePresets[2];
    applyBackgroundPalette(preset.key);
  }

  async function handleBackgroundUpload(file: File) {
    form.clearErrors("root");

    if (demoMode) {
      form.setError("root", { message: copy.uploadUnavailable });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: copy.uploadType });
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      form.setError("root", { message: copy.uploadSize });
      return;
    }

    try {
      const uploaded = await uploadArtistAsset(file, {
        artistId: artist.profile.id,
        prefix: "background",
      });
      form.setValue("backgroundImageUrl", uploaded.publicUrl, { shouldDirty: true, shouldValidate: true });
      form.setValue("backgroundType", "image", { shouldDirty: true, shouldValidate: true });
      setFlashMessage(copy.uploadQueued);
    } catch {
      form.setError("root", { message: copy.uploadFailed });
    }
  }

  function clearBackgroundImage() {
    form.setValue("backgroundImageUrl", "", { shouldDirty: true, shouldValidate: true });
    if (currentBackgroundType === "image") {
      form.setValue("backgroundType", "solid", { shouldDirty: true, shouldValidate: true });
    }
  }

  function applyBackgroundPalette(paletteKey: (typeof backgroundPalettePresets)[number]["key"]) {
    const palette = backgroundPalettePresets.find((item) => item.key === paletteKey);
    if (!palette) return;

    form.setValue("backgroundType", "gradient", { shouldDirty: true, shouldValidate: true });
    form.setValue("themeMode", "dark", { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundColor", palette.start, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", palette.start, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", palette.end, { shouldDirty: true, shouldValidate: true });
  }

  async function saveTheme(values: ThemeValues) {
    const normalizedValues = normalizeThemeValues(values);

    if (demoMode) {
      saveDemoTheme(
        resolveArtistTheme({
          artistId: artist.profile.id,
          ...normalizedValues,
          backgroundImageUrl: normalizedValues.backgroundImageUrl || null,
        }),
      );
      form.reset(normalizedValues);
      form.clearErrors("root");
      setFlashMessage(copy.savedToast);
      return;
    }

    const response = await fetch("/api/dashboard/customize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedValues),
    });

    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      form.setError("root", {
        message: payload.message ?? (locale === "tr" ? "Görünüm kaydedilemedi." : "Unable to save appearance."),
      });
      return;
    }

    form.reset(normalizedValues);
    form.clearErrors("root");
    setFlashMessage(copy.savedToast);
    router.refresh();
  }

  async function onSubmit(values: ThemeValues) {
    await saveTheme(values);
  }

  return (
    <div className="space-y-6">
      {flashMessage ? (
        <div className="fixed right-4 top-4 z-30 rounded-full border border-white/10 bg-[rgba(12,12,14,0.94)] px-4 py-2 text-sm text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
          {flashMessage}
        </div>
      ) : null}

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
          if (event.key === "Escape") {
            event.preventDefault();
            resetThemeToCurrent();
          }
        }}
      >
        <div className="inline-grid grid-cols-2 gap-1.5 rounded-[20px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <SelectionPill active={customizeMode === "preset"} onClick={() => setCustomizeMode("preset")} className="rounded-[16px] border-0 px-5 py-3">
            {copy.presetMode}
          </SelectionPill>
          <SelectionPill active={customizeMode === "custom"} onClick={() => setCustomizeMode("custom")} className="rounded-[16px] border-0 px-5 py-3">
            {copy.customMode}
          </SelectionPill>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(400px,620px)] xl:items-start">
          <div className="space-y-5">
            {customizeMode === "preset" ? (
              <SectionCard title={copy.presetSectionTitle} description={copy.presetSectionDescription} icon={<Sparkles className="size-4" />}>
                <div className="grid gap-5">
                  {themePresetOptions.map((presetKey) => {
                    const preset = themePresets[presetKey];
                    const meta = presetMeta[presetKey];
                    const resolvedTheme = resolveArtistTheme({
                      artistId: artist.profile.id,
                      presetTheme: presetKey,
                      backgroundType: preset.backgroundType,
                      backgroundColor: preset.backgroundColor,
                      gradientStart: preset.gradientStart,
                      gradientEnd: preset.gradientEnd,
                      primaryColor: preset.primaryColor,
                      secondaryColor: preset.secondaryColor,
                      cardColor: preset.cardColor,
                      cardOpacity: preset.cardOpacity,
                      headingFont: preset.headingFont,
                      bodyFont: preset.bodyFont,
                      fontPairingPreset: preset.fontPairingPreset,
                      radiusStyle: preset.radiusStyle,
                      themeMode: preset.themeMode,
                    });

                    return (
                      <ThemePresetCard
                        key={presetKey}
                        active={currentPreset === presetKey}
                        title={meta.title}
                        description={locale === "tr" ? meta.descriptionTr : meta.descriptionEn}
                        chips={locale === "tr" ? meta.chipsTr : meta.chipsEn}
                        onSelect={() => applyPreset(presetKey)}
                        theme={resolvedTheme}
                        selectedLabel={copy.selected}
                        locale={locale}
                      />
                    );
                  })}
                </div>
              </SectionCard>
            ) : (
              <SectionCard title={copy.customTitle} icon={<SwatchBook className="size-4" />}>
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white">{copy.accentTitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {accentSwatches.map((swatch) => (
                        <ColorDot
                          key={swatch}
                          color={swatch}
                          active={currentPrimaryColor.toLowerCase() === swatch.toLowerCase()}
                          onClick={() => form.setValue("primaryColor", swatch, { shouldDirty: true, shouldValidate: true })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white">{copy.backgroundTitle}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <BackgroundStyleCard
                        title={locale === "tr" ? backgroundPalettePresets[0].labelTr : backgroundPalettePresets[0].labelEn}
                        active={currentBackgroundStyle === "solid"}
                        onClick={() => setBackgroundStyle("solid")}
                        preview={
                          <div className="space-y-2">
                            <div className="h-12 rounded-[12px] bg-[#121315]" />
                            <div className="h-8 rounded-[12px] border border-white/8 bg-[#191B20]" />
                          </div>
                        }
                      />
                      <BackgroundStyleCard
                        title={locale === "tr" ? backgroundPalettePresets[1].labelTr : backgroundPalettePresets[1].labelEn}
                        active={
                          currentBackgroundStyle === "soft-gradient" ||
                          (currentGradientStart.toLowerCase() === backgroundPalettePresets[1].start.toLowerCase() &&
                            currentGradientEnd.toLowerCase() === backgroundPalettePresets[1].end.toLowerCase())
                        }
                        onClick={() => setBackgroundStyle("soft-gradient")}
                        preview={
                          <div className="space-y-2">
                            <div className="h-12 rounded-[12px]" style={{ background: `linear-gradient(145deg, ${backgroundPalettePresets[1].start}, ${backgroundPalettePresets[1].end})` }} />
                            <div className="h-8 rounded-[12px] border border-white/8 bg-[#201F22]" />
                          </div>
                        }
                      />
                      <BackgroundStyleCard
                        title={locale === "tr" ? backgroundPalettePresets[2].labelTr : backgroundPalettePresets[2].labelEn}
                        active={
                          currentBackgroundStyle === "deep-gradient" &&
                          currentGradientStart.toLowerCase() === backgroundPalettePresets[2].start.toLowerCase() &&
                          currentGradientEnd.toLowerCase() === backgroundPalettePresets[2].end.toLowerCase()
                        }
                        onClick={() => setBackgroundStyle("deep-gradient")}
                        preview={
                          <div className="space-y-2">
                            <div className="h-12 rounded-[12px]" style={{ background: `linear-gradient(160deg, ${backgroundPalettePresets[2].start}, ${backgroundPalettePresets[2].end})` }} />
                            <div className="h-8 rounded-[12px] border border-white/8 bg-[#17191E]" />
                          </div>
                        }
                      />
                      <BackgroundStyleCard
                        title={locale === "tr" ? backgroundPalettePresets[3].labelTr : backgroundPalettePresets[3].labelEn}
                        active={
                          currentGradientStart.toLowerCase() === backgroundPalettePresets[3].start.toLowerCase() &&
                          currentGradientEnd.toLowerCase() === backgroundPalettePresets[3].end.toLowerCase()
                        }
                        onClick={() => applyBackgroundPalette("ink-blue")}
                        preview={
                          <div className="space-y-2">
                            <div
                              className="h-12 rounded-[12px]"
                              style={{
                                background: `radial-gradient(circle at 24% 22%, rgba(76,108,160,0.18), transparent 42%), linear-gradient(160deg, ${backgroundPalettePresets[3].start}, ${backgroundPalettePresets[3].end})`,
                              }}
                            />
                            <div className="h-8 rounded-[12px] border border-white/8 bg-[#1B2130]" />
                          </div>
                        }
                      />
                    </div>
                    <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.02] p-4">
                      <p className="mb-3 text-sm font-medium text-white">{copy.backgroundImage}</p>
                      <MediaUploadField
                        imageUrl={watchedValues.backgroundImageUrl || ""}
                        emptyLabel={copy.backgroundUploadEmpty}
                        uploadLabel={copy.backgroundUpload}
                        removeLabel={copy.backgroundRemove}
                        onUpload={handleBackgroundUpload}
                        onRemove={clearBackgroundImage}
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white">{copy.cardTitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {cardSwatches.map((swatch) => (
                        <ColorDot
                          key={swatch}
                          color={swatch}
                          active={currentCardColor.toLowerCase() === swatch.toLowerCase()}
                          onClick={() => form.setValue("cardColor", swatch, { shouldDirty: true, shouldValidate: true })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-white">{copy.fontTitle}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {fontOptions.map((option) => {
                        const active = currentFontStyle === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFontStyle(option.value)}
                            className={cn(
                              "rounded-[22px] border p-4 text-left transition",
                              active
                                ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]"
                                : "border-white/8 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.04]",
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{option.label}</p>
                                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                  {locale === "tr" ? option.helperTr : option.helperEn}
                                </p>
                              </div>
                              {active ? <Check className="size-4 text-[var(--accent)]" /> : null}
                            </div>
                            <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white" style={{ fontFamily: headingPreviewFonts[option.value] }}>
                              {locale === "tr" ? "Profiline göz at" : "View your profile"}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]" style={{ fontFamily: bodyPreviewFonts[option.value] }}>
                              {locale === "tr" ? "Başlık, kısa not ve fiyat alanı birlikte görünür." : "Headings, short notes, and pricing stay easy to scan."}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={resetThemeToDefault}
                      className="text-sm text-[var(--foreground-muted)] underline decoration-white/10 underline-offset-4 transition hover:text-white"
                    >
                      {copy.resetDefaults}
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {form.formState.errors.root?.message ? (
              <div className="rounded-[22px] border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {form.formState.errors.root.message}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 xl:sticky xl:top-6">
            <div className="xl:hidden">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowMobilePreview((current) => !current)}
              >
                {showMobilePreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showMobilePreview ? copy.previewToggleClose : copy.previewToggleOpen}
              </Button>
            </div>

            <Card
              className={cn(
                "surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]",
                !showMobilePreview && "hidden xl:block",
              )}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-[1.06rem] tracking-[-0.02em]">{copy.previewTitle}</CardTitle>
                <CardDescription>{copy.previewDescription}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <AppearancePreview artist={artist} theme={previewTheme} locale={locale} />
              </CardContent>
            </Card>
          </div>
        </div>

        {form.formState.isDirty ? (
          <div className="sticky bottom-4 z-20">
            <div className="rounded-[22px] border border-white/8 bg-[rgba(11,12,16,0.94)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-md sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--foreground-muted)]">{copy.stickyHint}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {demoMode ? (
                    <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-[var(--foreground-muted)]">
                      {copy.demo}
                    </span>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={resetThemeToCurrent}>
                    {copy.cancel}
                  </Button>
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
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
