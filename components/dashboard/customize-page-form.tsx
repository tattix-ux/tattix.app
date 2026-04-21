"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImagePlus, LoaderCircle, Save, Sparkles, SwatchBook, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { BrandMonogram } from "@/components/shared/brand";
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

const accentOptions = [
  {
    value: "#E3C08E",
    labelTr: "Yumuşak bronz",
    labelEn: "Soft bronze",
    descriptionTr: "Daha açık, rafine ve yumuşak vurgu.",
    descriptionEn: "A lighter, softer bronze accent.",
  },
  {
    value: "#D6B17A",
    labelTr: "Stüdyo bronzu",
    labelEn: "Studio bronze",
    descriptionTr: "Dengeli ve sıcak ana vurgu.",
    descriptionEn: "A balanced, warm primary accent.",
  },
  {
    value: "#C79A68",
    labelTr: "Sıcak metal",
    labelEn: "Warm metal",
    descriptionTr: "Biraz daha tok ve karakterli görünür.",
    descriptionEn: "Slightly deeper with more presence.",
  },
  {
    value: "#B88352",
    labelTr: "Derin bronz",
    labelEn: "Deep bronze",
    descriptionTr: "Daha koyu ve kontrollü bir vurgu verir.",
    descriptionEn: "A deeper, more controlled accent tone.",
  },
  {
    value: "#C6B29A",
    labelTr: "Nötr şampanya",
    labelEn: "Neutral champagne",
    descriptionTr: "Daha sakin ve nötr bir premium his verir.",
    descriptionEn: "A quieter, more neutral premium feel.",
  },
] as const;

const cardSurfaceOptions = [
  {
    key: "matte",
    color: "#211F1B",
    opacity: 0.9,
    labelTr: "Matte",
    labelEn: "Matte",
    descriptionTr: "Daha sıcak ve yekpare kart yüzeyi.",
    descriptionEn: "A warmer, more unified card surface.",
  },
  {
    key: "softer",
    color: "#2B2F35",
    opacity: 0.92,
    labelTr: "Softer",
    labelEn: "Softer",
    descriptionTr: "Daha yumuşak, nötr ve hafif metalik.",
    descriptionEn: "Softer, neutral, and lightly metallic.",
  },
  {
    key: "contrast",
    color: "#171C25",
    opacity: 0.95,
    labelTr: "Contrast",
    labelEn: "Contrast",
    descriptionTr: "Daha derin ve daha belirgin kontrast.",
    descriptionEn: "Deeper with a clearer contrast edge.",
  },
] as const;

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

function CustomGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-white/8 bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-4 space-y-1.5">
        <p className="text-sm font-medium text-white">{title}</p>
        {description ? <p className="text-sm leading-6 text-[var(--foreground-muted)]">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function VisualOptionCard({
  active,
  title,
  description,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[22px] border p-4 text-left transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-[0_16px_32px_rgba(0,0,0,0.16)]"
          : "border-white/8 bg-white/[0.025] hover:border-white/14 hover:bg-white/[0.04]",
      )}
    >
      {active ? (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
          <span className="relative size-4 overflow-hidden rounded-full bg-white/5">
            <BrandMonogram className="inset-[1px]" opacity={0.42} />
          </span>
          <Check className="size-3.5 text-[var(--accent)]" />
        </span>
      ) : null}
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[18px] border border-white/8 p-3.5">
          {children}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>
        </div>
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
  onSelect,
  selectedLabel,
}: {
  active: boolean;
  title: string;
  onSelect: () => void;
  selectedLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative min-h-[132px] rounded-[30px] border p-6 text-left transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_58%,white)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
          : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/[0.035]",
      )}
    >
      {active ? (
        <span className="absolute right-4 top-4 rounded-full border border-white/18 bg-black/24 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
          {selectedLabel}
        </span>
      ) : null}
      <div className="flex h-full items-end">
        <p className="text-[1.15rem] font-semibold tracking-[-0.03em] text-white">{title}</p>
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
          previewDescription: "Seçtiğin görünüm burada anlık görünür.",
          presetSectionTitle: "Hazır görünümler",
          presetSectionDescription: "Bir görünüm seç. Alt taraftaki canlı önizleme anında değişir.",
          customTitle: "Kendi görünümün",
          accentTitle: "Vurgu rengi",
          accentDescription: "Butonlar, etiketler ve seçili alanlar bu tonla görünür.",
          backgroundTitle: "Arka plan stili",
          backgroundDescription: "Profil sayfasının genel atmosferini ve derinliğini belirler.",
          backgroundSolid: "Düz",
          backgroundSoft: "Yumuşak degrade",
          backgroundDeep: "Derin degrade",
          backgroundImage: "Görsel",
          backgroundUploadEmpty: "Arka plan görseli ekleyebilirsin.",
          backgroundUpload: "Görsel yükle",
          backgroundRemove: "Kaldır",
          cardTitle: "Kart rengi",
          cardDescription: "Bilgi kartlarının ne kadar sıcak, nötr ya da kontrast görüneceğini seç.",
          fontTitle: "Yazı stili",
          fontDescription: "Başlık ve açıklama dili birlikte değişir.",
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
          previewDescription: "Your selected look updates here instantly.",
          presetSectionTitle: "Ready-made looks",
          presetSectionDescription: "Choose a look. The live preview below updates instantly.",
          customTitle: "Your look",
          accentTitle: "Accent color",
          accentDescription: "Buttons, labels, and selected states use this tone.",
          backgroundTitle: "Background style",
          backgroundDescription: "Sets the overall atmosphere and depth of the profile page.",
          backgroundSolid: "Solid",
          backgroundSoft: "Soft gradient",
          backgroundDeep: "Deep gradient",
          backgroundImage: "Image",
          backgroundUploadEmpty: "You can add a background image.",
          backgroundUpload: "Upload image",
          backgroundRemove: "Remove",
          cardTitle: "Card color",
          cardDescription: "Choose whether cards feel warmer, softer, or more contrasty.",
          fontTitle: "Type style",
          fontDescription: "Headings and supporting copy shift together.",
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

        <div className="space-y-6">
          <div className="space-y-5">
            {customizeMode === "preset" ? (
              <SectionCard title={copy.presetSectionTitle} description={copy.presetSectionDescription} icon={<Sparkles className="size-4" />}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {themePresetOptions.map((presetKey) => {
                    return (
                      <ThemePresetCard
                        key={presetKey}
                        active={currentPreset === presetKey}
                        title={themePresets[presetKey].label}
                        onSelect={() => applyPreset(presetKey)}
                        selectedLabel={copy.selected}
                      />
                    );
                  })}
                </div>
              </SectionCard>
            ) : (
              <SectionCard title={copy.customTitle} icon={<SwatchBook className="size-4" />}>
                <div className="space-y-5">
                  <CustomGroup title={copy.accentTitle} description={copy.accentDescription}>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {accentOptions.map((option) => (
                        <VisualOptionCard
                          key={option.value}
                          active={currentPrimaryColor.toLowerCase() === option.value.toLowerCase()}
                          title={locale === "tr" ? option.labelTr : option.labelEn}
                          description={locale === "tr" ? option.descriptionTr : option.descriptionEn}
                          onClick={() => form.setValue("primaryColor", option.value, { shouldDirty: true, shouldValidate: true })}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-dim)]">
                                {locale === "tr" ? "Vurgu" : "Accent"}
                              </span>
                              <span className="size-4 rounded-full border border-white/10" style={{ backgroundColor: option.value }} />
                            </div>
                            <div className="h-10 rounded-[14px]" style={{ backgroundColor: toRgba(option.value, 0.2) }} />
                            <div className="grid grid-cols-[1fr_auto] gap-2">
                              <div className="h-8 rounded-[12px] border border-white/8 bg-white/[0.04]" />
                              <div className="rounded-[12px] px-3 py-2 text-[11px] font-medium" style={{ backgroundColor: option.value, color: "#1A1714" }}>
                                {locale === "tr" ? "Buton" : "Button"}
                              </div>
                            </div>
                          </div>
                        </VisualOptionCard>
                      ))}
                    </div>
                  </CustomGroup>

                  <CustomGroup title={copy.backgroundTitle} description={copy.backgroundDescription}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <VisualOptionCard
                        title={locale === "tr" ? backgroundPalettePresets[0].labelTr : backgroundPalettePresets[0].labelEn}
                        description={locale === "tr" ? "Temiz ve sakin graphite zemin." : "A calm, clean graphite base."}
                        active={currentBackgroundStyle === "solid"}
                        onClick={() => setBackgroundStyle("solid")}
                      >
                        <div className="space-y-2">
                          <div className="h-14 rounded-[14px] bg-[#121315]" />
                          <div className="h-9 rounded-[14px] border border-white/8 bg-[#1B1D21]" />
                        </div>
                      </VisualOptionCard>
                      <VisualOptionCard
                        title={locale === "tr" ? backgroundPalettePresets[1].labelTr : backgroundPalettePresets[1].labelEn}
                        description={locale === "tr" ? "Daha yumuşak bir geçiş ve hafif sıcaklık." : "A softer transition with a touch of warmth."}
                        active={
                          currentBackgroundStyle === "soft-gradient" ||
                          (currentGradientStart.toLowerCase() === backgroundPalettePresets[1].start.toLowerCase() &&
                            currentGradientEnd.toLowerCase() === backgroundPalettePresets[1].end.toLowerCase())
                        }
                        onClick={() => setBackgroundStyle("soft-gradient")}
                      >
                        <div className="space-y-2">
                          <div className="h-14 rounded-[14px]" style={{ background: `linear-gradient(145deg, ${backgroundPalettePresets[1].start}, ${backgroundPalettePresets[1].end})` }} />
                          <div className="h-9 rounded-[14px] border border-white/8 bg-[#211F22]" />
                        </div>
                      </VisualOptionCard>
                      <VisualOptionCard
                        title={locale === "tr" ? backgroundPalettePresets[2].labelTr : backgroundPalettePresets[2].labelEn}
                        description={locale === "tr" ? "Daha derin koyuluk ve belirgin katman." : "Deeper darkness with a stronger layered feel."}
                        active={
                          currentBackgroundStyle === "deep-gradient" &&
                          currentGradientStart.toLowerCase() === backgroundPalettePresets[2].start.toLowerCase() &&
                          currentGradientEnd.toLowerCase() === backgroundPalettePresets[2].end.toLowerCase()
                        }
                        onClick={() => setBackgroundStyle("deep-gradient")}
                      >
                        <div className="space-y-2">
                          <div className="h-14 rounded-[14px]" style={{ background: `linear-gradient(160deg, ${backgroundPalettePresets[2].start}, ${backgroundPalettePresets[2].end})` }} />
                          <div className="h-9 rounded-[14px] border border-white/8 bg-[#17191E]" />
                        </div>
                      </VisualOptionCard>
                      <VisualOptionCard
                        title={locale === "tr" ? backgroundPalettePresets[3].labelTr : backgroundPalettePresets[3].labelEn}
                        description={locale === "tr" ? "Hafif ink-blue derinlik, hâlâ koyu ve premium." : "A slight ink-blue depth while staying dark and premium."}
                        active={
                          currentGradientStart.toLowerCase() === backgroundPalettePresets[3].start.toLowerCase() &&
                          currentGradientEnd.toLowerCase() === backgroundPalettePresets[3].end.toLowerCase()
                        }
                        onClick={() => applyBackgroundPalette("ink-blue")}
                      >
                        <div className="space-y-2">
                          <div
                            className="h-14 rounded-[14px]"
                            style={{
                              background: `radial-gradient(circle at 24% 22%, rgba(76,108,160,0.18), transparent 42%), linear-gradient(160deg, ${backgroundPalettePresets[3].start}, ${backgroundPalettePresets[3].end})`,
                            }}
                          />
                          <div className="h-9 rounded-[14px] border border-white/8 bg-[#1B2130]" />
                        </div>
                      </VisualOptionCard>
                    </div>
                    <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
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
                  </CustomGroup>

                  <CustomGroup title={copy.cardTitle} description={copy.cardDescription}>
                    <div className="grid gap-3 md:grid-cols-3">
                      {cardSurfaceOptions.map((option) => (
                        <VisualOptionCard
                          key={option.key}
                          active={currentCardColor.toLowerCase() === option.color.toLowerCase()}
                          title={locale === "tr" ? option.labelTr : option.labelEn}
                          description={locale === "tr" ? option.descriptionTr : option.descriptionEn}
                          onClick={() => {
                            form.setValue("cardColor", option.color, { shouldDirty: true, shouldValidate: true });
                            form.setValue("cardOpacity", option.opacity, { shouldDirty: true, shouldValidate: true });
                          }}
                        >
                          <div className="space-y-3 rounded-[16px] bg-[#111215] p-2.5">
                            <div className="h-12 rounded-[14px]" style={{ backgroundColor: toRgba(option.color, option.opacity) }} />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="h-8 rounded-[12px]" style={{ backgroundColor: toRgba(option.color, Math.max(option.opacity - 0.08, 0.72)) }} />
                              <div className="h-8 rounded-[12px] border border-white/8" style={{ backgroundColor: toRgba(option.color, Math.min(option.opacity + 0.04, 1)) }} />
                            </div>
                          </div>
                        </VisualOptionCard>
                      ))}
                    </div>
                  </CustomGroup>

                  <CustomGroup title={copy.fontTitle} description={copy.fontDescription}>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {fontOptions.map((option) => {
                        const active = currentFontStyle === option.value;
                        return (
                          <VisualOptionCard
                            key={option.value}
                            active={active}
                            title={option.label}
                            description={locale === "tr" ? option.helperTr : option.helperEn}
                            onClick={() => setFontStyle(option.value)}
                          >
                            <div className="space-y-2">
                              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-dim)]">
                                {locale === "tr" ? "Yazı önizlemesi" : "Type preview"}
                              </p>
                              <p className="text-[1.05rem] font-semibold tracking-[-0.03em] text-white" style={{ fontFamily: headingPreviewFonts[option.value] }}>
                                {locale === "tr" ? "Profiline göz at" : "View your profile"}
                              </p>
                              <p className="text-sm leading-6 text-[var(--text-muted)]" style={{ fontFamily: bodyPreviewFonts[option.value] }}>
                                {locale === "tr" ? "Başlık, açıklama ve fiyat alanı birlikte okunur." : "Headings, descriptions, and pricing stay easy to scan."}
                              </p>
                            </div>
                          </VisualOptionCard>
                        );
                      })}
                    </div>
                  </CustomGroup>

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
          <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[1.06rem] tracking-[-0.02em]">{copy.previewTitle}</CardTitle>
              <CardDescription>{copy.previewDescription}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AppearancePreview artist={artist} theme={previewTheme} locale={locale} />
            </CardContent>
          </Card>
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
