"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  LoaderCircle,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  SwatchBook,
  Type,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { themePresetOptions, themePresets, type ThemePresetKey } from "@/lib/constants/theme";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { loadDemoTheme, saveDemoTheme } from "@/lib/demo-theme-storage";
import { resolveArtistTheme } from "@/lib/theme";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFunnelSettings, ArtistPageTheme, ArtistProfile, ArtistSavedTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

type ThemeFormInput = z.input<typeof pageThemeSchema>;
type ThemeValues = z.output<typeof pageThemeSchema>;
type PreviewMode = "welcome" | "designs" | "result";
type BackgroundStyleChoice = "solid" | "soft-gradient" | "deep-gradient";

type CustomizePageArtist = {
  profile: ArtistProfile;
  funnelSettings: ArtistFunnelSettings;
};

const accentSwatches = ["#A86E45", "#8E5F41", "#D6A574", "#C87856", "#8D7AE6", "#4D98C7", "#79A979", "#D35F6A"] as const;
const solidSwatches = ["#F6F1E8", "#E8DCCF", "#EDE4D8", "#161922", "#0B0D11", "#132030"] as const;
const neutralSurfaceSwatches = ["#FFFDF8", "#F7EFE6", "#12161C", "#161B22"] as const;

const backgroundPalettePresets = [
  {
    key: "graphite",
    labelTr: "Graphite",
    labelEn: "Graphite",
    style: "deep-gradient" as const,
    mode: "dark" as const,
    start: "#1A212A",
    end: "#0A0D12",
  },
  {
    key: "sand",
    labelTr: "Sand",
    labelEn: "Sand",
    style: "soft-gradient" as const,
    mode: "light" as const,
    start: "#F3ECE3",
    end: "#E6D7C7",
  },
  {
    key: "midnight",
    labelTr: "Midnight",
    labelEn: "Midnight",
    style: "deep-gradient" as const,
    mode: "dark" as const,
    start: "#151922",
    end: "#07090C",
  },
  {
    key: "ink-blue",
    labelTr: "Ink blue",
    labelEn: "Ink blue",
    style: "soft-gradient" as const,
    mode: "dark" as const,
    start: "#1B2B41",
    end: "#0C1119",
  },
] as const;

const fontOptions = [
  {
    value: "inter",
    label: "Inter",
    helperTr: "Temiz ve dengeli",
    helperEn: "Clean and balanced",
  },
  {
    value: "manrope",
    label: "Manrope",
    helperTr: "Yumuşak ve çağdaş",
    helperEn: "Soft and contemporary",
  },
  {
    value: "outfit",
    label: "Outfit",
    helperTr: "Net ve daha karakterli",
    helperEn: "Crisp and more distinctive",
  },
] as const;

const previewModeOptions = [
  { value: "welcome" as const, labelTr: "Karşılama", labelEn: "Welcome" },
  { value: "designs" as const, labelTr: "Tasarım listesi", labelEn: "Design list" },
  { value: "result" as const, labelTr: "Sonuç", labelEn: "Result" },
] as const;

const presetMeta: Record<
  ThemePresetKey,
  {
    title: string;
    descriptionTr: string;
    descriptionEn: string;
    chipsTr: string[];
    chipsEn: string[];
  }
> = {
  "studio-light": {
    title: "Studio Light",
    descriptionTr: "Açık, temiz ve editoryal",
    descriptionEn: "Bright, clean, and editorial",
    chipsTr: ["Açık", "Editoryal", "Temiz"],
    chipsEn: ["Light", "Editorial", "Clean"],
  },
  "warm-canvas": {
    title: "Warm Canvas",
    descriptionTr: "Sıcak, yumuşak ve daha butik",
    descriptionEn: "Warm, soft, and more boutique",
    chipsTr: ["Sıcak", "Yumuşak", "Butik"],
    chipsEn: ["Warm", "Soft", "Boutique"],
  },
  "midnight-ink": {
    title: "Midnight Ink",
    descriptionTr: "Koyu, net ve premium",
    descriptionEn: "Dark, sharp, and premium",
    chipsTr: ["Koyu", "Net", "Premium"],
    chipsEn: ["Dark", "Sharp", "Premium"],
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
  if (headingFont === "manrope") {
    return "manrope";
  }
  if (headingFont === "outfit" || headingFont === "dm-sans" || headingFont === "general-sans") {
    return "outfit";
  }
  return "inter";
}

function inferBackgroundStyle(backgroundType: string, themeMode: string): BackgroundStyleChoice {
  if (backgroundType === "solid") {
    return "solid";
  }
  return themeMode === "light" ? "soft-gradient" : "deep-gradient";
}

function SectionCard({
  title,
  description,
  children,
  icon,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="surface-border border-white/8 bg-white/[0.02] shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="mt-0.5 inline-flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-[var(--accent)]">
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
          ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_18%,transparent)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-white/[0.03] text-[var(--foreground-muted)] hover:border-white/18 hover:bg-white/[0.05] hover:text-white",
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
          ? "scale-[1.05] border-white/70 shadow-[0_0_0_4px_rgba(255,255,255,0.07)]"
          : "border-white/10 hover:scale-[1.02] hover:border-white/20",
      )}
      style={{ backgroundColor: color }}
    />
  );
}

function CollapsibleHeader({
  title,
  description,
  summary,
  open,
  onToggle,
}: {
  title: string;
  description: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-4 text-left transition hover:border-white/12 hover:bg-white/[0.035]"
    >
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-[var(--foreground-muted)]">{summary}</span>
        <ChevronDown className={cn("size-4 text-[var(--foreground-muted)] transition", open && "rotate-180")} />
      </div>
    </button>
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

function ThemePresetCard({
  active,
  title,
  description,
  chips,
  onSelect,
  theme,
}: {
  active: boolean;
  title: string;
  description: string;
  chips: string[];
  onSelect: () => void;
  theme: ArtistPageTheme;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-[28px] border p-4 text-left transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-[0_16px_34px_rgba(0,0,0,0.16)]"
          : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.04]",
      )}
    >
      <div
        className="relative overflow-hidden rounded-[22px] border border-white/8 p-4"
        style={{
          background:
            theme.backgroundType === "gradient"
              ? `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`
              : theme.backgroundColor,
          color: theme.textColor,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-20 opacity-80"
          style={{
            background: `radial-gradient(circle_at_top_left, ${toRgba(theme.primaryColor, 0.22)}, transparent 64%)`,
          }}
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <ThemeMiniPalette theme={theme} />
            {active ? (
              <span className="rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                Seçili
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <div
              className="h-3 rounded-full"
              style={{ width: "58%", backgroundColor: toRgba(theme.textColor, 0.9) }}
            />
            <div
              className="h-2 rounded-full"
              style={{ width: "82%", backgroundColor: toRgba(theme.textColor, 0.36) }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-[18px] border p-3"
              style={{
                borderColor: toRgba(theme.textColor, 0.08),
                backgroundColor: toRgba(theme.cardColor, theme.cardOpacity),
              }}
            >
              <div className="h-2.5 w-10 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.82) }} />
              <div className="mt-2 h-2 w-16 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.24) }} />
            </div>
            <div
              className="rounded-[18px] border p-3"
              style={{
                borderColor: toRgba(theme.textColor, 0.08),
                backgroundColor: toRgba(theme.cardColor, theme.cardOpacity),
              }}
            >
              <div className="h-2.5 w-9 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.82) }} />
              <div
                className="mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-medium"
                style={{ backgroundColor: theme.primaryColor, color: theme.themeMode === "light" ? "#1B1511" : "#0b0d11" }}
              >
                CTA
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-base font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-[var(--foreground-muted)]">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function AppearancePreview({
  artist,
  theme,
  mode,
  locale,
}: {
  artist: CustomizePageArtist;
  theme: ArtistPageTheme;
  mode: PreviewMode;
  locale: PublicLocale;
}) {
  const headingColor = theme.textColor;
  const mutedColor = theme.themeMode === "light" ? toRgba(theme.textColor, 0.64) : toRgba(theme.textColor, 0.7);
  const shellBackground =
    theme.backgroundType === "gradient"
      ? `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`
      : theme.backgroundColor;
  const cardBackground = toRgba(theme.cardColor, theme.cardOpacity);
  const cardBorder = toRgba(theme.textColor, theme.themeMode === "light" ? 0.08 : 0.1);
  const accentForeground = theme.themeMode === "light" ? "#1B1511" : "#0b0d11";
  const title = artist.profile.welcomeHeadline?.trim() || (locale === "tr" ? "Aklında ne var?" : "What do you have in mind?");
  const intro =
    artist.profile.shortBio?.trim() ||
    (locale === "tr"
      ? "Müşteri sana yazmadan önce temel detayları burada paylaşır."
      : "Clients share the key details here before they message you.");

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-white/[0.02] p-4 shadow-[0_20px_46px_rgba(0,0,0,0.2)] sm:p-5">
      <div className="mx-auto max-w-[420px]">
        <div className="rounded-[34px] border border-white/10 bg-black/10 p-2.5 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
          <div
            className="overflow-hidden rounded-[28px] border"
            style={{
              borderColor: cardBorder,
              background: shellBackground,
            }}
          >
            <div className="p-4 sm:p-5">
              <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.28) }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-[16px] border border-white/12 bg-white/10" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: headingColor, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
                        {artist.profile.artistName}
                      </p>
                      <p className="text-xs" style={{ color: mutedColor }}>
                        {artist.profile.instagramHandle ? `@${artist.profile.instagramHandle}` : "tattix"}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-medium"
                    style={{ backgroundColor: toRgba(theme.primaryColor, 0.18), color: headingColor }}
                  >
                    {locale === "tr" ? "Profil" : "Profile"}
                  </span>
                </div>
              </div>

              {mode === "welcome" ? (
                <div className="mt-4 space-y-4 rounded-[28px] border p-5" style={{ borderColor: cardBorder, backgroundColor: cardBackground }}>
                  <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16), color: headingColor }}>
                    {artist.funnelSettings.introEyebrow || (locale === "tr" ? "Talep formu" : "Request form")}
                  </div>
                  <div>
                    <p
                      className="text-[1.7rem] font-semibold leading-tight tracking-[-0.03em]"
                      style={{ color: headingColor, fontFamily: headingPreviewFonts[theme.headingFont] }}
                    >
                      {title}
                    </p>
                    <p className="mt-3 text-sm leading-6" style={{ color: mutedColor, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
                      {intro}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: cardBorder, color: mutedColor }}>
                      {locale === "tr" ? "Hızlı form" : "Quick form"}
                    </span>
                    <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: cardBorder, color: mutedColor }}>
                      {locale === "tr" ? "Fiyat tahmini" : "Estimate"}
                    </span>
                  </div>
                  <div
                    className="inline-flex rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: theme.primaryColor, color: accentForeground }}
                  >
                    {locale === "tr" ? "Fiyat tahmini al" : "Start estimate"}
                  </div>
                </div>
              ) : null}

              {mode === "designs" ? (
                <div className="mt-4 space-y-3 rounded-[28px] border p-5" style={{ borderColor: cardBorder, backgroundColor: cardBackground }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[1.05rem] font-semibold" style={{ color: headingColor, fontFamily: headingPreviewFonts[theme.headingFont] }}>
                        {locale === "tr" ? "Hazır tasarımlar" : "Ready-made designs"}
                      </p>
                      <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                        {locale === "tr" ? "Müşteri buradan seçim yapabilir." : "Clients can choose from here."}
                      </p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16), color: headingColor }}>
                      {locale === "tr" ? "Önizleme" : "Preview"}
                    </span>
                  </div>
                  {[
                    {
                      title: locale === "tr" ? "Dagger" : "Dagger",
                      meta: locale === "tr" ? "Flash tasarım • 10 cm" : "Flash design • 10 cm",
                      price: "₺8.000–₺10.000",
                    },
                    {
                      title: locale === "tr" ? "Cherry blossom" : "Cherry blossom",
                      meta: locale === "tr" ? "Renkli parça • 12 cm" : "Color piece • 12 cm",
                      price: "₺10.000–₺12.000",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-[22px] border p-3.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.46) }}>
                      <div className="size-14 rounded-[18px] border border-white/10 bg-white/10" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: headingColor }}>
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                          {item.meta}
                        </p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16), color: headingColor }}>
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {mode === "result" ? (
                <div className="mt-4 space-y-4 rounded-[28px] border p-5" style={{ borderColor: cardBorder, backgroundColor: cardBackground }}>
                  <div>
                    <p className="text-[1.05rem] font-semibold" style={{ color: headingColor, fontFamily: headingPreviewFonts[theme.headingFont] }}>
                      {locale === "tr" ? "Tahmini fiyat aralığın" : "Your estimated price range"}
                    </p>
                    <p className="mt-2 text-sm leading-6" style={{ color: mutedColor }}>
                      {locale === "tr"
                        ? "Seçtiklerine göre çoğu durumda başlangıç seviyesi bu aralıkta olur."
                        : "Based on the choices, most requests start around this range."}
                    </p>
                  </div>
                  <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.54) }}>
                    <p className="text-[1.7rem] font-semibold tracking-[-0.03em]" style={{ color: headingColor }}>
                      ₺8.000 – ₺10.500
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: cardBorder, color: mutedColor }}>
                        {locale === "tr" ? "İç kol" : "Inner arm"}
                      </span>
                      <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: cardBorder, color: mutedColor }}>
                        {locale === "tr" ? "Orta • 10–14 cm" : "Medium • 10–14 cm"}
                      </span>
                      <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: cardBorder, color: mutedColor }}>
                        {locale === "tr" ? "Siyah-gri" : "Black-grey"}
                      </span>
                    </div>
                  </div>
                  <div className="inline-flex rounded-full px-4 py-2 text-sm font-medium" style={{ backgroundColor: theme.primaryColor, color: accentForeground }}>
                    {locale === "tr" ? "WhatsApp’tan gönder" : "Send with WhatsApp"}
                  </div>
                </div>
              ) : null}
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
  savedThemes,
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
          previewDescription: "Değişiklikler burada anlık görünür.",
          previewToggleOpen: "Önizlemeyi göster",
          previewToggleClose: "Önizlemeyi gizle",
          presetSectionTitle: "Hazır görünümler",
          presetSectionDescription: "Tek tıkla görünümü değiştir. Renk, yüzey ve yazı stili birlikte uygulanır.",
          compactAction: "Bir tasarım değil, sadece görünüm seçiyorsun. Hazır bir görünümle başla ya da kendi görünümünü oluştur.",
          customTitle: "Kendi görünümün",
          customDescription: "Vurgu rengi, arka plan ve yazı stilini seç.",
          baseLookTitle: "Başlangıç görünümü",
          baseLookDescription: "Önce bir temel görünüm seç, sonra istersen ince ayar yap.",
          accentTitle: "Vurgu rengi",
          accentDescription: "Butonlar, etiketler ve seçili alanlar bu renge göre görünür.",
          customColorLabel: "Renk kodunu elle gir",
          backgroundTitle: "Arka plan stili",
          backgroundDescription: "Sayfanın genel yüzey hissini belirle.",
          backgroundSolid: "Düz",
          backgroundSoft: "Yumuşak degrade",
          backgroundDeep: "Derin degrade",
          fontTitle: "Yazı stili",
          fontDescription: "Sayfanın genel tonunu belirler.",
          fineTitle: "İnce ayarlar (opsiyonel)",
          fineDescription: "İstersen yüzey ve metin renklerini de ayarlayabilirsin.",
          fineSummary: "İsteğe bağlı",
          saveLookTrigger: "Bu ayarı görünüm olarak kaydet",
          saveLookDescription: "Aynı ayarı sonra tekrar kullanmak istersen isim verip kaydedebilirsin.",
          presetName: "Görünüm adı",
          presetNamePlaceholder: "Örn. Gece bakırı",
          savePreset: "Görünümü kaydet",
          resetDefaults: "Varsayılana dön",
          savedLooks: "Kaydedilen görünümler",
          applyTheme: "Uygula",
          renameTheme: "Yeniden adlandır",
          deleteTheme: "Sil",
          renamePrompt: "Görünüm için yeni adı yaz",
          save: "Görünümü uygula",
          cancel: "Vazgeç",
          stickyHint: "Önizleme anlık güncellenir. Kaydettiğinde profil sayfanda görünür.",
          saving: "Kaydediliyor",
          demo: "Demo modunda yalnızca önizleme",
          selected: "Seçili",
          savedToast: "Görünüm güncellendi",
          presetSavedToast: "Görünüm kaydedildi",
          noSavedLooks: "Henüz kaydedilmiş görünüm yok.",
          advancedTextColor: "Metin rengi",
          advancedCardColor: "Kart yüzeyi",
          advancedSecondary: "İkincil yüzey",
          usingGeneralPreset: "Hazır görünüm üzerinden devam ediyorsun",
        }
      : {
          presetMode: "Ready-made looks",
          customMode: "Your look",
          previewTitle: "Preview",
          previewDescription: "Changes appear here instantly.",
          previewToggleOpen: "Show preview",
          previewToggleClose: "Hide preview",
          presetSectionTitle: "Ready-made looks",
          presetSectionDescription: "Change the look in one click. Color, surfaces, and type style apply together.",
          compactAction: "This tab is only for appearance. Start with a ready-made look or build your own.",
          customTitle: "Your look",
          customDescription: "Pick the accent color, background, and type style.",
          baseLookTitle: "Starting look",
          baseLookDescription: "Pick a base look first, then fine-tune it if you want.",
          accentTitle: "Accent color",
          accentDescription: "Buttons, tags, and selected areas follow this color.",
          customColorLabel: "Enter color code manually",
          backgroundTitle: "Background style",
          backgroundDescription: "Sets the overall surface feel of the page.",
          backgroundSolid: "Solid",
          backgroundSoft: "Soft gradient",
          backgroundDeep: "Deep gradient",
          fontTitle: "Type style",
          fontDescription: "Sets the overall tone of the page.",
          fineTitle: "Fine settings (optional)",
          fineDescription: "Open this if you want to adjust surfaces and text colors too.",
          fineSummary: "Optional",
          saveLookTrigger: "Save this setup as a look",
          saveLookDescription: "If you want to reuse this setup later, give it a name and save it.",
          presetName: "Look name",
          presetNamePlaceholder: "e.g. Midnight copper",
          savePreset: "Save look",
          resetDefaults: "Reset to default",
          savedLooks: "Saved looks",
          applyTheme: "Apply",
          renameTheme: "Rename",
          deleteTheme: "Delete",
          renamePrompt: "Enter a new name for this look",
          save: "Apply look",
          cancel: "Discard",
          stickyHint: "The preview updates instantly. It appears on your profile page after you save.",
          saving: "Saving",
          demo: "Preview only in demo mode",
          selected: "Selected",
          savedToast: "Appearance updated",
          presetSavedToast: "Look saved",
          noSavedLooks: "No saved looks yet.",
          advancedTextColor: "Text color",
          advancedCardColor: "Card surface",
          advancedSecondary: "Secondary surface",
          usingGeneralPreset: "You are building from a ready-made look",
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
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentTextColor = watchedValues.textColor ?? theme.textColor;
  const currentCardOpacity =
    typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
  const currentThemeMode = watchedValues.themeMode ?? theme.themeMode;
  const currentFontStyle = inferFontStyle(watchedValues.headingFont ?? theme.headingFont);
  const currentBackgroundStyle = inferBackgroundStyle(currentBackgroundType, currentThemeMode);

  const [customizeMode, setCustomizeMode] = useState<"preset" | "custom">("preset");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("welcome");
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showManualAccent, setShowManualAccent] = useState(false);
  const [showFineSettings, setShowFineSettings] = useState(false);
  const [showSaveLook, setShowSaveLook] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFlashMessage(null);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    if (!demoMode) {
      return;
    }

    const storedTheme = loadDemoTheme();
    if (!storedTheme) {
      return;
    }

    form.reset(buildFormValues(storedTheme));
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
        secondaryColor: currentSecondaryColor,
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
      currentSecondaryColor,
      currentTextColor,
      currentThemeMode,
      theme.bodyFont,
      theme.fontPairingPreset,
      theme.headingFont,
      theme.radiusStyle,
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
    const defaultTheme = resolveArtistTheme({ presetTheme: "midnight-ink", artistId: artist.profile.id });
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
    if (next === "solid") {
      const solidColor =
        currentThemeMode === "light"
          ? themePresets["studio-light"].backgroundColor
          : themePresets["midnight-ink"].backgroundColor;
      form.setValue("backgroundType", "solid", { shouldDirty: true, shouldValidate: true });
      form.setValue("backgroundColor", solidColor, { shouldDirty: true, shouldValidate: true });
      return;
    }

    const preset =
      next === "soft-gradient"
        ? currentThemeMode === "light"
          ? backgroundPalettePresets[1]
          : backgroundPalettePresets[3]
        : currentThemeMode === "light"
          ? backgroundPalettePresets[1]
          : backgroundPalettePresets[2];

    applyBackgroundPalette(preset.key);
  }

  function applyBackgroundPalette(paletteKey: (typeof backgroundPalettePresets)[number]["key"]) {
    const palette = backgroundPalettePresets.find((item) => item.key === paletteKey);
    if (!palette) {
      return;
    }

    form.setValue("backgroundType", "gradient", {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("themeMode", palette.mode, { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundColor", palette.start, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", palette.start, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", palette.end, { shouldDirty: true, shouldValidate: true });

    if (palette.mode === "light") {
      form.setValue("textColor", themePresets["studio-light"].textColor, { shouldDirty: true, shouldValidate: true });
      form.setValue("cardColor", themePresets["studio-light"].cardColor, { shouldDirty: true, shouldValidate: true });
      form.setValue("secondaryColor", themePresets["studio-light"].secondaryColor, { shouldDirty: true, shouldValidate: true });
    } else {
      form.setValue("textColor", themePresets["midnight-ink"].textColor, { shouldDirty: true, shouldValidate: true });
      form.setValue("cardColor", themePresets["midnight-ink"].cardColor, { shouldDirty: true, shouldValidate: true });
      form.setValue("secondaryColor", themePresets["midnight-ink"].secondaryColor, { shouldDirty: true, shouldValidate: true });
    }
  }

  function applySavedTheme(savedTheme: ArtistSavedTheme) {
    form.reset(buildFormValues(savedTheme.theme));
    form.clearErrors("root");
  }

  async function renameSavedTheme(themeId: string, currentName: string) {
    const nextName = window.prompt(copy.renamePrompt, currentName)?.trim();
    if (!nextName || nextName === currentName) {
      return;
    }

    const response = await fetch(`/api/dashboard/customize/saved-themes/${themeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? "Unable to rename theme." });
      return;
    }

    form.clearErrors("root");
    setFlashMessage(copy.presetSavedToast);
    router.refresh();
  }

  async function deleteSavedTheme(themeId: string) {
    const response = await fetch(`/api/dashboard/customize/saved-themes/${themeId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? "Unable to delete theme." });
      return;
    }

    form.clearErrors("root");
    setFlashMessage(copy.presetSavedToast);
    router.refresh();
  }

  async function saveTheme(values: ThemeValues, savePreset = false) {
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
      setFlashMessage(savePreset ? copy.presetSavedToast : copy.savedToast);
      if (savePreset) {
        setPresetName("");
        setShowSaveLook(false);
      }
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

    form.reset(normalizedValues);
    form.clearErrors("root");
    setFlashMessage(savePreset ? copy.presetSavedToast : copy.savedToast);
    if (savePreset) {
      setPresetName("");
      setShowSaveLook(false);
    }
    router.refresh();
  }

  async function onSubmit(values: ThemeValues) {
    await saveTheme(values, false);
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
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
            event.preventDefault();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            resetThemeToCurrent();
          }
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-full border border-white/8 bg-white/[0.02] p-1.5">
          <div className="inline-flex flex-wrap gap-1.5">
            <SelectionPill active={customizeMode === "preset"} onClick={() => setCustomizeMode("preset")}>
              {copy.presetMode}
            </SelectionPill>
            <SelectionPill active={customizeMode === "custom"} onClick={() => setCustomizeMode("custom")}>
              {copy.customMode}
            </SelectionPill>
          </div>
          <p className="px-3 text-sm text-[var(--foreground-muted)]">{copy.compactAction}</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
          <div className="space-y-5">
            {customizeMode === "preset" ? (
              <SectionCard
                title={copy.presetSectionTitle}
                description={copy.presetSectionDescription}
                icon={<Sparkles className="size-4" />}
              >
                <div className="grid gap-4 lg:grid-cols-3">
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
                      />
                    );
                  })}
                </div>
              </SectionCard>
            ) : (
              <div className="space-y-5">
                <SectionCard title={copy.customTitle} description={copy.customDescription} icon={<SwatchBook className="size-4" />}>
                  <div className="space-y-5">
                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white">{copy.baseLookTitle}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.baseLookDescription}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {themePresetOptions.map((presetKey) => {
                          const meta = presetMeta[presetKey];
                          const active = currentPreset === presetKey;
                          return (
                            <button
                              key={presetKey}
                              type="button"
                              onClick={() => applyPreset(presetKey)}
                              className={cn(
                                "rounded-[22px] border p-4 text-left transition",
                                active
                                  ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]"
                                  : "border-white/8 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.04]",
                              )}
                            >
                              <p className="text-sm font-semibold text-white">{meta.title}</p>
                              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                {locale === "tr" ? meta.descriptionTr : meta.descriptionEn}
                              </p>
                              <div className="mt-3 flex items-center gap-2">
                                <ThemeMiniPalette theme={resolveArtistTheme({ presetTheme: presetKey, artistId: artist.profile.id })} />
                                {active ? (
                                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white">
                                    {copy.selected}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white">{copy.accentTitle}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.accentDescription}</p>
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
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-white">
                          <span className="size-3 rounded-full" style={{ backgroundColor: currentPrimaryColor }} />
                          {currentPrimaryColor}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowManualAccent((current) => !current)}
                          className="text-sm text-[var(--foreground-muted)] underline decoration-white/10 underline-offset-4 transition hover:text-white"
                        >
                          {copy.customColorLabel}
                        </button>
                      </div>
                      {showManualAccent ? (
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <input
                            type="color"
                            value={currentPrimaryColor}
                            onChange={(event) => form.setValue("primaryColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                            className="h-11 w-full rounded-[18px] border border-white/10 bg-transparent sm:w-16"
                          />
                          <Input
                            value={currentPrimaryColor}
                            onChange={(event) => form.setValue("primaryColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white">{copy.backgroundTitle}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.backgroundDescription}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <SelectionPill active={currentBackgroundStyle === "solid"} onClick={() => setBackgroundStyle("solid")}>
                          {copy.backgroundSolid}
                        </SelectionPill>
                        <SelectionPill active={currentBackgroundStyle === "soft-gradient"} onClick={() => setBackgroundStyle("soft-gradient")}>
                          {copy.backgroundSoft}
                        </SelectionPill>
                        <SelectionPill active={currentBackgroundStyle === "deep-gradient"} onClick={() => setBackgroundStyle("deep-gradient")}>
                          {copy.backgroundDeep}
                        </SelectionPill>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {backgroundPalettePresets.map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => applyBackgroundPalette(preset.key)}
                            className="rounded-full border border-white/8 px-3.5 py-2 text-sm text-white transition hover:border-white/14 hover:bg-white/[0.05]"
                          >
                            {locale === "tr" ? preset.labelTr : preset.labelEn}
                          </button>
                        ))}
                      </div>

                      {currentBackgroundStyle === "solid" ? (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-3">
                            {solidSwatches.map((swatch) => (
                              <ColorDot
                                key={swatch}
                                color={swatch}
                                active={currentBackgroundColor.toLowerCase() === swatch.toLowerCase()}
                                onClick={() => form.setValue("backgroundColor", swatch, { shouldDirty: true, shouldValidate: true })}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <Field label={locale === "tr" ? "Başlangıç rengi" : "Start color"}>
                            <div className="flex gap-3">
                              <input
                                type="color"
                                value={currentGradientStart}
                                onChange={(event) => form.setValue("gradientStart", event.target.value, { shouldDirty: true, shouldValidate: true })}
                                className="h-11 w-14 rounded-[18px] border border-white/10 bg-transparent"
                              />
                              <Input
                                value={currentGradientStart}
                                onChange={(event) => form.setValue("gradientStart", event.target.value, { shouldDirty: true, shouldValidate: true })}
                              />
                            </div>
                          </Field>
                          <Field label={locale === "tr" ? "Bitiş rengi" : "End color"}>
                            <div className="flex gap-3">
                              <input
                                type="color"
                                value={currentGradientEnd}
                                onChange={(event) => form.setValue("gradientEnd", event.target.value, { shouldDirty: true, shouldValidate: true })}
                                className="h-11 w-14 rounded-[18px] border border-white/10 bg-transparent"
                              />
                              <Input
                                value={currentGradientEnd}
                                onChange={(event) => form.setValue("gradientEnd", event.target.value, { shouldDirty: true, shouldValidate: true })}
                              />
                            </div>
                          </Field>
                        </div>
                      )}
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                      <div className="mb-4">
                        <p className="text-sm font-medium text-white">{copy.fontTitle}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.fontDescription}</p>
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
                              <p
                                className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white"
                                style={{ fontFamily: headingPreviewFonts[option.value] }}
                              >
                                Aklında ne var?
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <CollapsibleHeader
                        title={copy.fineTitle}
                        description={copy.fineDescription}
                        summary={copy.fineSummary}
                        open={showFineSettings}
                        onToggle={() => setShowFineSettings((current) => !current)}
                      />
                      {showFineSettings ? (
                        <div className="grid gap-4 rounded-[24px] border border-white/8 bg-white/[0.02] p-4 sm:grid-cols-3">
                          <Field label={copy.advancedTextColor}>
                            <div className="flex gap-3">
                              <input
                                type="color"
                                value={currentTextColor}
                                onChange={(event) => form.setValue("textColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                                className="h-11 w-14 rounded-[18px] border border-white/10 bg-transparent"
                              />
                              <Input
                                value={currentTextColor}
                                onChange={(event) => form.setValue("textColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                              />
                            </div>
                          </Field>
                          <Field label={copy.advancedCardColor}>
                            <div className="flex gap-3">
                              <input
                                type="color"
                                value={currentCardColor}
                                onChange={(event) => form.setValue("cardColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                                className="h-11 w-14 rounded-[18px] border border-white/10 bg-transparent"
                              />
                              <Input
                                value={currentCardColor}
                                onChange={(event) => form.setValue("cardColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                              />
                            </div>
                          </Field>
                          <Field label={copy.advancedSecondary}>
                            <div className="flex gap-3">
                              <input
                                type="color"
                                value={currentSecondaryColor}
                                onChange={(event) => form.setValue("secondaryColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                                className="h-11 w-14 rounded-[18px] border border-white/10 bg-transparent"
                              />
                              <Input
                                value={currentSecondaryColor}
                                onChange={(event) => form.setValue("secondaryColor", event.target.value, { shouldDirty: true, shouldValidate: true })}
                              />
                            </div>
                          </Field>
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowSaveLook((current) => !current)}
                          className="text-sm font-medium text-white underline decoration-white/12 underline-offset-4 transition hover:text-[var(--accent)]"
                        >
                          {copy.saveLookTrigger}
                        </button>
                        <button
                          type="button"
                          onClick={resetThemeToDefault}
                          className="text-sm text-[var(--foreground-muted)] underline decoration-white/10 underline-offset-4 transition hover:text-white"
                        >
                          {copy.resetDefaults}
                        </button>
                      </div>
                      {showSaveLook ? (
                        <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                          <p className="text-sm text-[var(--foreground-muted)]">{copy.saveLookDescription}</p>
                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
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
                              variant="secondary"
                              disabled={form.formState.isSubmitting || !presetName.trim()}
                              onClick={() => void form.handleSubmit((values) => saveTheme(values, true))()}
                            >
                              <Save className="size-4" />
                              {copy.savePreset}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title={copy.savedLooks} description={copy.usingGeneralPreset} icon={<Palette className="size-4" />}>
                  {savedThemes.length ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {savedThemes.map((savedTheme) => (
                        <div key={savedTheme.id} className="rounded-[24px] border border-white/8 bg-white/[0.025] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{savedTheme.name}</p>
                              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{savedTheme.theme.presetTheme}</p>
                            </div>
                            <ThemeMiniPalette theme={savedTheme.theme} />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => applySavedTheme(savedTheme)}>
                              {copy.applyTheme}
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => void renameSavedTheme(savedTheme.id, savedTheme.name)}>
                              {copy.renameTheme}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => void deleteSavedTheme(savedTheme.id)}>
                              {copy.deleteTheme}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--foreground-muted)]">{copy.noSavedLooks}</p>
                  )}
                </SectionCard>
              </div>
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
                "surface-border border-white/8 bg-white/[0.02] shadow-[0_16px_34px_rgba(0,0,0,0.16)]",
                !showMobilePreview && "hidden xl:block",
              )}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-[1.06rem] tracking-[-0.02em]">{copy.previewTitle}</CardTitle>
                <CardDescription>{copy.previewDescription}</CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  {previewModeOptions.map((option) => (
                    <SelectionPill
                      key={option.value}
                      active={previewMode === option.value}
                      onClick={() => setPreviewMode(option.value)}
                      className="text-xs"
                    >
                      {locale === "tr" ? option.labelTr : option.labelEn}
                    </SelectionPill>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <AppearancePreview artist={artist} theme={previewTheme} mode={previewMode} locale={locale} />
              </CardContent>
            </Card>
          </div>
        </div>

        {form.formState.isDirty ? (
          <div className="sticky bottom-4 z-20">
            <div className="rounded-[22px] border border-white/8 bg-[rgba(11,12,16,0.94)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-md sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-[var(--foreground-muted)]">{copy.stickyHint}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {demoMode ? <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-[var(--foreground-muted)]">{copy.demo}</span> : null}
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

        <input type="hidden" {...form.register("bodyFont")} />
        <input type="hidden" {...form.register("fontPairingPreset")} />
        <input type="hidden" {...form.register("backgroundImageUrl")} />
        <input type="hidden" {...form.register("cardOpacity")} value={String(currentCardOpacity)} />
        <input type="hidden" {...form.register("radiusStyle")} />
        <input type="hidden" {...form.register("themeMode")} value={currentThemeMode} />
        <input type="hidden" {...form.register("customWelcomeTitle")} />
        <input type="hidden" {...form.register("customIntroText")} />
        <input type="hidden" {...form.register("customCtaLabel")} />
        <input type="hidden" {...form.register("featuredSectionLabel1")} />
        <input type="hidden" {...form.register("featuredSectionLabel2")} />
      </form>
    </div>
  );
}
