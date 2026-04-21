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

const accentSwatches = ["#A86E45", "#8E5F41", "#D6A574", "#C87856", "#8D7AE6", "#4D98C7", "#79A979", "#D35F6A"] as const;
const solidSwatches = ["#F6F1E8", "#E8DCCF", "#EDE4D8", "#161922", "#0B0D11", "#132030"] as const;
const cardSwatches = ["#FFFDF8", "#F7EFE6", "#EEE4D7", "#1E1B1A", "#17191E", "#12161C"] as const;

const backgroundPalettePresets = [
  { key: "graphite", labelTr: "Graphite", labelEn: "Graphite", mode: "dark" as const, start: "#1A212A", end: "#0A0D12" },
  { key: "sand", labelTr: "Sand", labelEn: "Sand", mode: "light" as const, start: "#F3ECE3", end: "#E6D7C7" },
  { key: "midnight", labelTr: "Midnight", labelEn: "Midnight", mode: "dark" as const, start: "#151922", end: "#07090C" },
  { key: "ink-blue", labelTr: "Ink blue", labelEn: "Ink blue", mode: "dark" as const, start: "#1B2B41", end: "#0C1119" },
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
  "studio-light": {
    title: "Studio Light",
    descriptionTr: "Açık, temiz ve editoryal",
    descriptionEn: "Bright, clean, and editorial",
    chipsTr: ["Açık", "Editoryal", "Temiz"],
    chipsEn: ["Light", "Editorial", "Clean"],
  },
  "warm-canvas": {
    title: "Warm Canvas",
    descriptionTr: "Sıcak, yumuşak ve butik",
    descriptionEn: "Warm, soft, and boutique",
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

function ThemeMiniPalette({ theme }: { theme: ArtistPageTheme }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full border border-white/10" style={{ backgroundColor: theme.backgroundColor }} />
      <span className="size-3 rounded-full border border-white/10" style={{ backgroundColor: theme.cardColor }} />
      <span className="size-3 rounded-full border border-white/10" style={{ backgroundColor: theme.primaryColor }} />
    </div>
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
}: {
  active: boolean;
  title: string;
  description: string;
  chips: string[];
  onSelect: () => void;
  theme: ArtistPageTheme;
  selectedLabel: string;
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
          style={{ background: `radial-gradient(circle_at_top_left, ${toRgba(theme.primaryColor, 0.22)}, transparent 64%)` }}
        />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <ThemeMiniPalette theme={theme} />
            {active ? (
              <span className="rounded-full border border-white/18 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {selectedLabel}
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-full" style={{ width: "58%", backgroundColor: toRgba(theme.textColor, 0.9) }} />
            <div className="h-2 rounded-full" style={{ width: "82%", backgroundColor: toRgba(theme.textColor, 0.36) }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[18px] border p-3" style={{ borderColor: toRgba(theme.textColor, 0.08), backgroundColor: toRgba(theme.cardColor, theme.cardOpacity) }}>
              <div className="h-2.5 w-10 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.82) }} />
              <div className="mt-2 h-2 w-16 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.24) }} />
            </div>
            <div className="rounded-[18px] border p-3" style={{ borderColor: toRgba(theme.textColor, 0.08), backgroundColor: toRgba(theme.cardColor, theme.cardOpacity) }}>
              <div className="h-2.5 w-9 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.82) }} />
              <div className="mt-3 inline-flex rounded-full px-3 py-1.5 text-[11px] font-medium" style={{ backgroundColor: theme.primaryColor, color: theme.themeMode === "light" ? "#1B1511" : "#0b0d11" }}>
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
    <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-white/[0.02] p-4 shadow-[0_20px_46px_rgba(0,0,0,0.2)] sm:p-5">
      <div className="mx-auto max-w-[420px]">
        <div className="rounded-[34px] border border-white/10 bg-black/10 p-2.5 shadow-[0_18px_42px_rgba(0,0,0,0.22)]">
          <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: cardBorder, background: shellBackground }}>
            <div className="p-4 sm:p-5">
              <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.28) }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-[16px] border border-white/12 bg-white/10" />
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

              <div className="mt-4 space-y-4 rounded-[28px] border p-5" style={{ borderColor: cardBorder, backgroundColor: cardBackground }}>
                <div className="inline-flex rounded-full px-3 py-1 text-[11px] font-medium" style={{ backgroundColor: toRgba(theme.primaryColor, 0.16), color: headingColor }}>
                  {artist.funnelSettings.introEyebrow || (locale === "tr" ? "Talep formu" : "Request form")}
                </div>
                <div>
                  <p className="text-[1.7rem] font-semibold leading-tight tracking-[-0.03em]" style={{ color: cardText, fontFamily: headingPreviewFonts[theme.headingFont] }}>
                    {title}
                  </p>
                  <p className="mt-3 text-sm leading-6" style={{ color: cardMuted, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
                    {intro}
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 rounded-[22px] border p-3.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.46) }}>
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
                  <div className="flex items-center gap-3 rounded-[22px] border p-3.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.46) }}>
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
                <div className="inline-flex rounded-full px-4 py-2 text-sm font-medium" style={{ backgroundColor: theme.primaryColor, color: accentForeground }}>
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
          previewDescription: "Değişiklikler burada anlık görünür.",
          previewToggleOpen: "Önizlemeyi göster",
          previewToggleClose: "Önizlemeyi gizle",
          presetSectionTitle: "Hazır görünümler",
          presetSectionDescription: "Tek tıkla görünümü değiştir.",
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
          previewDescription: "Changes appear here instantly.",
          previewToggleOpen: "Show preview",
          previewToggleClose: "Hide preview",
          presetSectionTitle: "Ready-made looks",
          presetSectionDescription: "Change the look in one click.",
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
    if (next === "image") {
      form.setValue("backgroundType", "image", { shouldDirty: true, shouldValidate: true });
      return;
    }

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
        <div className="inline-flex flex-wrap gap-1.5 rounded-full border border-white/8 bg-white/[0.02] p-1.5">
          <SelectionPill active={customizeMode === "preset"} onClick={() => setCustomizeMode("preset")}>
            {copy.presetMode}
          </SelectionPill>
          <SelectionPill active={customizeMode === "custom"} onClick={() => setCustomizeMode("custom")}>
            {copy.customMode}
          </SelectionPill>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-start">
          <div className="space-y-5">
            {customizeMode === "preset" ? (
              <SectionCard title={copy.presetSectionTitle} description={copy.presetSectionDescription} icon={<Sparkles className="size-4" />}>
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
                        selectedLabel={copy.selected}
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
                      <SelectionPill active={currentBackgroundStyle === "image"} onClick={() => setBackgroundStyle("image")}>
                        {copy.backgroundImage}
                      </SelectionPill>
                    </div>
                    {currentBackgroundStyle === "image" ? (
                      <div className="mt-4">
                        <MediaUploadField
                          imageUrl={watchedValues.backgroundImageUrl || ""}
                          emptyLabel={copy.backgroundUploadEmpty}
                          uploadLabel={copy.backgroundUpload}
                          removeLabel={copy.backgroundRemove}
                          onUpload={handleBackgroundUpload}
                          onRemove={clearBackgroundImage}
                        />
                      </div>
                    ) : currentBackgroundStyle === "solid" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {solidSwatches.map((swatch) => (
                          <ColorDot
                            key={swatch}
                            color={swatch}
                            active={currentBackgroundColor.toLowerCase() === swatch.toLowerCase()}
                            onClick={() => form.setValue("backgroundColor", swatch, { shouldDirty: true, shouldValidate: true })}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {backgroundPalettePresets.map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() => applyBackgroundPalette(preset.key)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                              currentGradientStart.toLowerCase() === preset.start.toLowerCase() &&
                                currentGradientEnd.toLowerCase() === preset.end.toLowerCase()
                                ? "border-[color:color-mix(in_srgb,var(--accent)_48%,white)] bg-white/[0.08] text-white"
                                : "border-white/8 bg-white/[0.03] text-white hover:border-white/14 hover:bg-white/[0.05]",
                            )}
                          >
                            <span
                              className="size-4 rounded-full border border-white/10"
                              style={{ background: `linear-gradient(145deg, ${preset.start}, ${preset.end})` }}
                            />
                            {locale === "tr" ? preset.labelTr : preset.labelEn}
                          </button>
                        ))}
                      </div>
                    )}
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
                              Aklında ne var?
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
                "surface-border border-white/8 bg-white/[0.02] shadow-[0_16px_34px_rgba(0,0,0,0.16)]",
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
