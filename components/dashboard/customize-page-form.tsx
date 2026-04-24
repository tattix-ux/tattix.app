"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Crown,
  LoaderCircle,
  LockKeyhole,
  Palette,
  Save,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { themePresetOptions, themePresets, type ThemePresetKey } from "@/lib/constants/theme";
import { pageThemeSchema } from "@/lib/forms/schemas";
import { loadDemoTheme, saveDemoTheme } from "@/lib/demo-theme-storage";
import { uploadArtistAsset } from "@/lib/supabase/storage";
import { buildThemeStyles, deriveThemeColorTokens, resolveArtistTheme } from "@/lib/theme";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFunnelSettings, ArtistPageTheme, ArtistProfile, ArtistSavedTheme } from "@/lib/types";
import { cn } from "@/lib/utils";

type ThemeFormInput = z.input<typeof pageThemeSchema>;
type ThemeValues = z.output<typeof pageThemeSchema>;
type CustomizeModule = "presets" | "customize";

type CustomizePageArtist = {
  profile: ArtistProfile;
  funnelSettings: ArtistFunnelSettings;
};

const themeColorSuggestions = {
  primary: ["#C6A27A", "#8B5CF6", "#22D3EE", "#4ADE80", "#F97316", "#0F172A"],
  background: ["#0E0E0F", "#18181B", "#0A0A23", "#F8F7F4", "#F5EFE6", "#0B1411"],
  surface: ["#171719", "#232326", "#16163A", "#FFFFFF", "#2A1812", "#141A19"],
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

function mixHex(colorA: string, colorB: string, weightA = 0.68) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const ratioA = Math.min(Math.max(weightA, 0), 1);
  const ratioB = 1 - ratioA;

  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  const r = Math.round(a.r * ratioA + b.r * ratioB);
  const g = Math.round(a.g * ratioA + b.g * ratioB);
  const blue = Math.round(a.b * ratioA + b.b * ratioB);

  return `#${toHex(r)}${toHex(g)}${toHex(blue)}`;
}

function normalizeHexInput(value: string) {
  const trimmed = value.trim().replace(/[^#0-9a-f]/gi, "");
  const withPrefix = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return withPrefix.slice(0, 7).toUpperCase();
}

function isValidHexInput(value: string) {
  return /^#([0-9A-F]{6}|[0-9A-F]{3})$/.test(value);
}

function buildFormValues(source: ArtistPageTheme): ThemeValues {
  return {
    presetTheme: source.presetTheme,
    backgroundType: source.backgroundType,
    backgroundColor: source.backgroundColor,
    gradientStart: source.gradientStart,
    gradientEnd: source.gradientEnd,
    backgroundImageUrl: source.backgroundImageUrl ?? "",
    backgroundOverlayStrength: source.backgroundOverlayStrength,
    backgroundImageSoftness: source.backgroundImageSoftness,
    backgroundImageFocus: source.backgroundImageFocus,
    textColor: source.textColor,
    primaryColor: source.primaryColor,
    secondaryColor: source.secondaryColor,
    cardColor: source.cardColor,
    cardOpacity: source.cardOpacity,
    cardFeel: source.cardFeel,
    buttonStyle: source.buttonStyle,
    badgeStyle: source.badgeStyle,
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
    <Card className="border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] shadow-[0_14px_28px_rgba(0,0,0,0.18)]">
      <CardHeader className="space-y-1 pb-3 xl:pb-2.5">
        <div className="flex items-start gap-2.5">
          {icon ? (
            <div className="inline-flex size-8 items-center justify-center rounded-[12px] border border-[var(--border-soft)] bg-white/[0.03] text-[var(--accent)]">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-[0.98rem] tracking-[-0.02em]">{title}</CardTitle>
            {description ? <CardDescription className="mt-1 text-[12px]">{description}</CardDescription> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function ModuleTab({
  active,
  locked,
  label,
  onClick,
}: {
  active: boolean;
  locked?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-[12px] border px-3 text-[12px] font-medium transition",
        active
          ? "border-[var(--border-strong)] bg-[rgba(214,177,122,0.12)] text-white"
          : "border-white/8 bg-white/[0.03] text-[var(--text-secondary)] hover:border-white/12 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      <span>{label}</span>
      {locked ? <LockKeyhole className="size-3.5" /> : null}
    </button>
  );
}

function ThemeNameCard({
  active,
  title,
  theme,
  onClick,
}: {
  active: boolean;
  title: string;
  theme: (typeof themePresets)[ThemePresetKey];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex h-[72px] items-center overflow-hidden rounded-[16px] border px-4 text-left transition",
        active ? "" : "hover:-translate-y-0.5 hover:brightness-[1.03]",
      )}
      style={{
        backgroundColor: theme.surface,
        borderColor: active ? theme.primary : theme.border,
        boxShadow: active ? `0 0 0 1px ${toRgba(theme.primary, 0.16)}, 0 12px 24px rgba(0,0,0,0.14)` : undefined,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: `linear-gradient(180deg, ${theme.primary}, ${theme.secondary})` }}
      />
      <div
        className="absolute inset-0 opacity-90"
        style={{ background: `radial-gradient(circle_at_top_left, ${toRgba(theme.primary, 0.18)}, transparent 42%)` }}
      />
      <div className="relative flex w-full items-center justify-between gap-3">
        <span className="text-[13px] font-semibold tracking-[-0.02em]" style={{ color: theme.textColor }}>
          {title}
        </span>
        {active ? (
          <span
            className="inline-flex size-5 items-center justify-center rounded-full border"
            style={{ borderColor: toRgba(theme.primary, 0.46), backgroundColor: toRgba(theme.primary, 0.14), color: theme.primary }}
          >
            <Check className="size-3.5" />
          </span>
        ) : null}
      </div>
    </button>
  );
}

function UpgradeFeatureCard({ locale }: { locale: PublicLocale }) {
  const copy =
    locale === "tr"
      ? {
          badge: "PRO",
          title: "Kendi görünümünü oluştur",
          description:
            "Hazır temaların ötesine geç. Kendi renklerini kullan, arka plan görselini yükle ve sayfanı markana göre düzenle.",
          features: [
            "Kendi renk paletini oluştur",
            "Arka plan görseli yükle",
            "Buton ve kart stilini değiştir",
            "Canlı önizleme ile anında gör",
          ],
          cta: "PRO'ya geç",
        }
      : {
          badge: "PRO",
          title: "Create your own look",
          description:
            "Go beyond ready-made themes. Use your own colors, upload a background image, and shape the page around your brand.",
          features: [
            "Build your own color palette",
            "Upload a background image",
            "Change button and card style",
            "See changes instantly in live preview",
          ],
          cta: "Upgrade to Pro",
        };

  return (
    <Card className="border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_96%,black_4%)_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
      <CardContent className="space-y-3 p-4 xl:p-3.5">
        <div className="flex items-start gap-3">
          <div className="inline-flex size-9 items-center justify-center rounded-[14px] border border-[var(--border-strong)] bg-[rgba(214,177,122,0.14)] text-[var(--accent)]">
            <Crown className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex rounded-full border border-[var(--border-strong)] bg-[rgba(214,177,122,0.14)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.badge}
            </div>
            <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-white">{copy.title}</h3>
            <p className="mt-1 text-[12px] leading-[1.45] text-[var(--foreground-muted)]">{copy.description}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {copy.features.map((item) => (
            <div key={item} className="rounded-[14px] border border-white/8 bg-white/[0.025] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
              {item}
            </div>
          ))}
        </div>
        <Button asChild className="h-[36px] px-4">
          <Link href="/dashboard/upgrade">{copy.cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ColorField({
  label,
  description,
  value,
  suggestions,
  pickerId,
  onCommit,
  selectLabel,
  hideSuggestionsLabel = true,
}: {
  label: string;
  description: string;
  value: string;
  suggestions: readonly string[];
  pickerId: string;
  onCommit: (value: string) => void;
  selectLabel: string;
  hideSuggestionsLabel?: boolean;
}) {
  const [draft, setDraft] = useState(value.toUpperCase());

  useEffect(() => {
    setDraft(value.toUpperCase());
  }, [value]);

  function commit(next: string) {
    const normalized = normalizeHexInput(next);
    if (isValidHexInput(normalized)) {
      onCommit(normalized);
      setDraft(normalized);
      return;
    }

    setDraft(value.toUpperCase());
  }

  return (
    <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
      <div className="space-y-1">
        <p className="text-[12px] font-medium text-white">{label}</p>
        <p className="text-[11px] leading-[1.35] text-[var(--foreground-muted)]">{description}</p>
      </div>

      <div className="mt-2.5 grid grid-cols-[30px_minmax(0,1fr)_70px] items-center gap-2">
        <span
          className="inline-flex size-[30px] rounded-[10px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{ backgroundColor: value }}
        />
        <Input
          value={draft}
          onChange={(event) => {
            const normalized = normalizeHexInput(event.target.value);
            if (normalized.length <= 7) setDraft(normalized);
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            }
          }}
          className="h-9 rounded-[12px] border-white/10 bg-white/[0.03] font-mono text-[12px] uppercase tracking-[0.08em]"
        />
        <label
          htmlFor={pickerId}
          className="inline-flex h-9 cursor-pointer items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.05] text-[12px] font-medium text-white transition hover:bg-white/[0.08]"
        >
          {selectLabel}
        </label>
        <input
          id={pickerId}
          type="color"
          value={value}
          className="sr-only"
          onChange={(event) => {
            const next = event.target.value.toUpperCase();
            setDraft(next);
            onCommit(next);
          }}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => {
          const active = suggestion.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={suggestion}
              type="button"
              onClick={() => onCommit(suggestion)}
              aria-label={suggestion}
              title={hideSuggestionsLabel ? undefined : suggestion}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full border transition",
                active
                  ? "border-[var(--border-strong)] bg-[rgba(214,177,122,0.12)] text-white"
                  : "border-white/8 bg-white/[0.025] text-[var(--foreground-muted)] hover:border-white/12 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <span className="inline-flex size-3.5 rounded-full border border-white/10" style={{ backgroundColor: suggestion }} />
            </button>
          );
        })}
      </div>
    </div>
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
  const { wrapperStyle, tokens, backgroundMedia } = buildThemeStyles(theme);
  const profile = artist.profile;
  const eyebrow = artist.funnelSettings.introEyebrow?.trim() || `@${profile.instagramHandle || profile.slug}`;
  const heading = profile.artistName || "Artist";
  const description =
    profile.shortBio?.trim() ||
    (locale === "tr"
      ? "Minimal ve siyah ağırlıklı dövmeler yapıyorum."
      : "I create minimal, mostly blackwork tattoos.");
  const welcomeTitle =
    theme.customWelcomeTitle?.trim() ||
    (locale === "tr" ? "Nasıl ilerlemek istersin?" : "How would you like to continue?");
  const welcomeDescription =
    theme.customIntroText?.trim() ||
    (locale === "tr"
      ? "İstersen fikrini anlat, istersen hazır tasarımlardan seç."
      : "Describe your idea or choose from featured designs.");

  const optionLabels =
    locale === "tr"
      ? [
          {
            title: "Talebimi anlatacağım",
            body: "Fikrini birkaç adımda anlatabilirsin.",
          },
          {
            title: "Hazır tasarım seçeceğim",
            body: "Hazır tasarımlar arasından seçebilirsin.",
          },
        ]
      : [
          {
            title: "I will describe my request",
            body: "Share your idea in a few quick steps.",
          },
          {
            title: "I will choose a design",
            body: "Pick from the ready-made designs.",
          },
        ];

  const surfaceBackground = toRgba(theme.cardColor, theme.cardOpacity);
  const badgeBackground =
    theme.badgeStyle === "colored" ? "var(--artist-chip-surface)" : toRgba(theme.cardColor, 0.76);
  const heroImage = profile.coverImageUrl;

  return (
    <div className="overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,#1B1D21_0%,#15171B_100%)] p-2.5 shadow-[0_18px_42px_rgba(0,0,0,0.22)] xl:p-2">
      <div className="mx-auto max-w-[332px]">
        <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(16,17,20,0.72)] p-2 shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
          <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: tokens.borderColor, background: String(wrapperStyle.background ?? theme.backgroundColor) }}>
            <div className="relative overflow-hidden">
              {backgroundMedia.imageUrl ? (
                <>
                  <div
                    className="absolute inset-0 scale-[1.04]"
                    style={{
                      backgroundImage: `url(${backgroundMedia.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: backgroundMedia.position,
                      filter: `blur(${backgroundMedia.blurPx}px)`,
                    }}
                  />
                  <div className="absolute inset-0" style={{ background: backgroundMedia.overlayGradient }} />
                  <div className="absolute inset-0" style={{ backgroundColor: backgroundMedia.overlayColor }} />
                </>
              ) : null}

              <div className="relative h-[132px] overflow-hidden">
                {heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroImage}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-[1.04] object-cover"
                  />
                ) : null}
                <div
                  className="absolute inset-0"
                  style={{
                    background: heroImage
                      ? "linear-gradient(180deg, rgba(10, 10, 12, 0.06) 0%, rgba(10, 10, 12, 0.54) 100%)"
                      : `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
                  }}
                />
              </div>
            </div>

            <div className="relative px-3 pb-3 pt-0">
              <div className="-mt-5 flex items-end gap-2.5">
                <div className="size-11 overflow-hidden rounded-[14px] border border-white/12 bg-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.22)]">
                  {profile.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="pb-1">
                  <span
                    className="inline-flex h-5.5 items-center rounded-full border px-2.5 text-[9px] font-medium uppercase tracking-[0.08em]"
                    style={{ backgroundColor: badgeBackground, borderColor: tokens.borderColor, color: "var(--artist-chip-text)" }}
                  >
                    {eyebrow}
                  </span>
                </div>
              </div>

              <div className="mt-2 space-y-1">
                <h3
                  className="text-[18px] font-semibold tracking-[-0.03em]"
                  style={{
                    color: tokens.cardText,
                    fontFamily: "var(--artist-heading-font)",
                    fontWeight: 700,
                    letterSpacing: theme.headingFont.includes("playfair") || theme.headingFont.includes("garamond") || theme.headingFont.includes("baskerville") ? "0em" : "-0.01em",
                  }}
                >
                  {heading}
                </h3>
                <p className="max-w-[32ch] text-[11px] leading-[1.4]" style={{ color: tokens.cardMuted }}>
                  {description}
                </p>
              </div>

              <div
                className="mt-2.5 rounded-[16px] border p-2.5"
                style={{ borderColor: tokens.borderColor, backgroundColor: surfaceBackground }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: tokens.muted }}>
                      {locale === "tr" ? "Adım 1" : "Step 1"}
                    </p>
                    <h4 className="mt-1 text-[15px] font-semibold tracking-[-0.03em]" style={{ color: tokens.cardText, fontFamily: "var(--artist-heading-font)" }}>
                      {welcomeTitle}
                    </h4>
                  </div>
                  <span
                    className="inline-flex h-5.5 items-center rounded-full border px-2.5 text-[9px] font-medium"
                    style={{ borderColor: tokens.borderColor, backgroundColor: toRgba(theme.primaryColor, 0.12), color: theme.primaryColor }}
                  >
                    1 / 7
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-[1.4]" style={{ color: tokens.cardMuted }}>
                  {welcomeDescription}
                </p>

                <div className="mt-2 grid gap-2">
                  {optionLabels.map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-[13px] border p-2.5"
                      style={{
                        borderColor: index === 0 ? toRgba(theme.primaryColor, 0.28) : tokens.borderColor,
                        background:
                          index === 0
                            ? `linear-gradient(180deg, ${toRgba(theme.primaryColor, 0.16)}, ${toRgba(theme.primaryColor, 0.08)})`
                            : toRgba(theme.cardColor, 0.72),
                      }}
                    >
                      <p className="text-[12px] font-semibold" style={{ color: tokens.cardText }}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-[10px] leading-[1.35]" style={{ color: tokens.cardMuted }}>
                        {item.body}
                      </p>
                    </div>
                  ))}
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
  hasPro,
}: {
  artist: CustomizePageArtist;
  theme: ArtistPageTheme;
  savedThemes: ArtistSavedTheme[];
  demoMode: boolean;
  locale?: PublicLocale;
  hasPro: boolean;
}) {
  const router = useRouter();
  const copy =
    locale === "tr"
      ? {
          title: "Sayfanı Özelleştir",
          description: "Sayfanın görünümünü kontrol et, tarzını yansıt.",
          livePreviewTitle: "Canlı Önizleme",
          livePreviewDescription: "Müşterinin gördüğü ilk adım burada anında güncellenir.",
          presetSectionTitle: "Hazır Temalar",
          presetSectionDescription: "Bir temel görünüm seç, sonra istersen kendi renklerinle düzenle.",
          presetHelp: "Hazır temalar iyi bir başlangıç noktasıdır. İstersen sonraki adımlarda renkleri ve arka planı değiştirebilirsin.",
          presetModule: "Hazır Temalar",
          customizeModule: "Özelleştir",
          customizeTitle: "Özelleştir",
          customizeDescription: "Ana renkleri ve arka planı buradan düzenleyebilirsin.",
          colorsTitle: "Renkler",
          colorsDescription: "Sayfanın ana tonlarını seç. Yazı ve yardımcı tonlar otomatik olarak dengelenir.",
          primaryColorTitle: "Ana Renk",
          primaryColorDescription: "Butonlar, linkler ve ana vurgu alanlarında kullanılır.",
          backgroundColorTitle: "Sayfa Zemini",
          backgroundColorDescription: "Sayfanın ana arka plan tonudur. İstersen görsel de yükleyebilirsin.",
          surfaceColorTitle: "Kart Zemini",
          surfaceColorDescription: "Kartlar ve içerik yüzeylerinde kullanılır.",
          selectColor: "Seç",
          backgroundImageTitle: "Arka plan görseli",
          backgroundImageDescription: "Geniş kadraj, koyu veya dengeli görseller daha iyi sonuç verir.",
          backgroundUpload: "Görsel yükle",
          backgroundRemove: "Görseli kaldır",
          backgroundAutoNote: "Arka plan görseli otomatik olarak karartılır; böylece yazılar ve butonlar okunaklı kalır.",
          resetDefaults: "Varsayılana dön",
          save: "Kaydet",
          saving: "Kaydediliyor",
          demo: "Demo modunda yalnızca önizleme",
          savedToast: "Görünüm güncellendi",
          uploadUnavailable: "Arka plan yükleme demo modunda kullanılamıyor.",
          uploadType: "Sadece görsel dosyaları yüklenebilir.",
          uploadSize: "Görseller en fazla 6 MB olabilir.",
          uploadQueued: "Arka plan görseli yüklendi.",
          uploadFailed: "Arka plan görseli yüklenemedi.",
        }
      : {
          title: "Customize Your Page",
          description: "Control the look of your page and reflect your style.",
          livePreviewTitle: "Live Preview",
          livePreviewDescription: "The customer's first step updates here instantly.",
          presetSectionTitle: "Ready Themes",
          presetSectionDescription: "Choose a base appearance, then refine it with your own colors if you want.",
          presetHelp: "Ready-made themes are a great starting point. You can change colors and background in the next steps.",
          presetModule: "Ready Themes",
          customizeModule: "Customize",
          customizeTitle: "Customize",
          customizeDescription: "Adjust the main colors and background here.",
          colorsTitle: "Colors",
          colorsDescription: "Choose the main tones of the page. Text and supporting tones are balanced automatically.",
          primaryColorTitle: "Primary Color",
          primaryColorDescription: "Used for buttons, links, and key highlights.",
          backgroundColorTitle: "Page Background",
          backgroundColorDescription: "The main background tone of the page. You can also upload an image.",
          surfaceColorTitle: "Card Surface",
          surfaceColorDescription: "Used across cards and content surfaces.",
          selectColor: "Pick",
          backgroundImageTitle: "Background image",
          backgroundImageDescription: "Wide, darker, or balanced images usually work best.",
          backgroundUpload: "Upload image",
          backgroundRemove: "Remove image",
          backgroundAutoNote: "The background image is automatically darkened so text and buttons stay readable.",
          resetDefaults: "Reset to default",
          save: "Save",
          saving: "Saving",
          demo: "Preview only in demo mode",
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
  const currentBackgroundColor = watchedValues.backgroundColor ?? theme.backgroundColor;
  const currentGradientStart = watchedValues.gradientStart ?? theme.gradientStart;
  const currentGradientEnd = watchedValues.gradientEnd ?? theme.gradientEnd;
  const currentBackgroundImageUrl = watchedValues.backgroundImageUrl ?? theme.backgroundImageUrl ?? "";
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentCardOpacity = typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
  const currentThemeMode = watchedValues.themeMode ?? theme.themeMode;
  const currentBackgroundType = currentBackgroundImageUrl ? "image" : "solid";

  const derivedColorTokens = useMemo(
    () =>
      deriveThemeColorTokens({
        backgroundColor: currentBackgroundColor,
        cardColor: currentCardColor,
        primaryColor: currentPrimaryColor,
        secondaryColor: currentSecondaryColor,
      }),
    [currentBackgroundColor, currentCardColor, currentPrimaryColor, currentSecondaryColor],
  );

  const [activeModule, setActiveModule] = useState<CustomizeModule>("presets");
  const [lockedModulePreview, setLockedModulePreview] = useState<Exclude<CustomizeModule, "presets"> | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const moduleItems = useMemo(
    () => [
      { key: "presets" as const, label: copy.presetModule, locked: false },
      { key: "customize" as const, label: copy.customizeModule, locked: !hasPro },
    ],
    [copy.customizeModule, copy.presetModule, hasPro],
  );

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

  function applyBackgroundTone(nextColor: string) {
    const nextDerived = deriveThemeColorTokens({
      backgroundColor: nextColor,
      cardColor: currentCardColor,
      primaryColor: currentPrimaryColor,
      secondaryColor: currentSecondaryColor,
    });
    form.setValue("backgroundColor", nextColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", mixHex(nextColor, currentCardColor, 0.82), { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", mixHex(nextColor, currentSecondaryColor, 0.68), { shouldDirty: true, shouldValidate: true });
    form.setValue("textColor", nextDerived.text, { shouldDirty: true, shouldValidate: true });
  }

  const previewTheme = useMemo(
    () =>
      resolveArtistTheme({
        artistId: artist.profile.id,
        presetTheme: currentPreset,
        backgroundType: currentBackgroundType,
        backgroundColor: currentBackgroundColor,
        gradientStart: currentGradientStart,
        gradientEnd: currentGradientEnd,
        backgroundImageUrl: currentBackgroundImageUrl || null,
        backgroundOverlayStrength: theme.backgroundOverlayStrength,
        backgroundImageSoftness: theme.backgroundImageSoftness,
        backgroundImageFocus: theme.backgroundImageFocus,
        textColor: derivedColorTokens.text,
        primaryColor: currentPrimaryColor,
        secondaryColor: currentSecondaryColor,
        cardColor: currentCardColor,
        cardOpacity: currentCardOpacity,
        cardFeel: theme.cardFeel,
        buttonStyle: theme.buttonStyle,
        badgeStyle: theme.badgeStyle,
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
      currentBackgroundImageUrl,
      currentBackgroundType,
      currentCardColor,
      currentCardOpacity,
      currentSecondaryColor,
      currentGradientEnd,
      currentGradientStart,
      currentPreset,
      currentPrimaryColor,
      currentThemeMode,
      derivedColorTokens.text,
      theme.backgroundImageFocus,
      theme.backgroundImageSoftness,
      theme.backgroundOverlayStrength,
      theme.bodyFont,
      theme.buttonStyle,
      theme.cardFeel,
      theme.fontPairingPreset,
      theme.headingFont,
      theme.badgeStyle,
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

  function normalizeThemeValues(values: ThemeValues): ThemeValues {
    const derived = deriveThemeColorTokens({
      backgroundColor: values.backgroundColor,
      cardColor: values.cardColor,
      primaryColor: values.primaryColor,
      secondaryColor: values.secondaryColor,
    });
    const resolved = resolveArtistTheme({
      artistId: artist.profile.id,
      ...values,
      backgroundType: values.backgroundImageUrl ? "image" : "solid",
      textColor: derived.text,
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
    form.setValue("backgroundImageUrl", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("textColor", preset.textColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("primaryColor", preset.primaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("secondaryColor", preset.secondaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardColor", preset.cardColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardOpacity", preset.cardOpacity, { shouldDirty: true, shouldValidate: true });
    form.setValue("headingFont", preset.headingFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("bodyFont", preset.bodyFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("fontPairingPreset", preset.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
    form.setValue("themeMode", preset.themeMode, { shouldDirty: true, shouldValidate: true });
  }

  function resetThemeToDefault() {
    const defaultTheme = resolveArtistTheme({ presetTheme: "obsidian-bronze", artistId: artist.profile.id });
    form.reset(buildFormValues(defaultTheme));
    form.clearErrors("root");
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
      setFlashMessage(copy.uploadQueued);
    } catch {
      form.setError("root", { message: copy.uploadFailed });
    }
  }

  function clearBackgroundImage() {
    form.setValue("backgroundImageUrl", "", { shouldDirty: true, shouldValidate: true });
  }

  async function saveTheme(values: ThemeValues) {
    const normalizedValues = hasPro
      ? normalizeThemeValues(values)
      : buildFormValues(
          resolveArtistTheme({
            artistId: artist.profile.id,
            presetTheme: values.presetTheme,
          }),
        );

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

  const displayModule = !hasPro && lockedModulePreview ? lockedModulePreview : activeModule;
  const activeModuleLocked = !hasPro && lockedModulePreview !== null;

  const modulePanel = activeModuleLocked ? (
    <SectionCard title={moduleItems.find((item) => item.key === displayModule)?.label ?? copy.customizeModule} icon={<LockKeyhole className="size-4" />}>
      <UpgradeFeatureCard locale={locale} />
    </SectionCard>
  ) : displayModule === "presets" ? (
    <SectionCard title={copy.presetSectionTitle} description={copy.presetSectionDescription} icon={<Sparkles className="size-4" />}>
      <div className="grid gap-3 sm:grid-cols-2">
        {themePresetOptions.map((presetKey) => (
          <ThemeNameCard
            key={presetKey}
            active={currentPreset === presetKey}
            title={themePresets[presetKey].label}
            theme={themePresets[presetKey]}
            onClick={() => applyPreset(presetKey)}
          />
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-[1.45] text-[var(--foreground-muted)]">{copy.presetHelp}</p>
    </SectionCard>
  ) : (
    <SectionCard title={copy.customizeTitle} description={copy.customizeDescription} icon={<Palette className="size-4" />}>
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <ColorField
            label={copy.primaryColorTitle}
            description={copy.primaryColorDescription}
            value={currentPrimaryColor}
            suggestions={themeColorSuggestions.primary}
            pickerId="theme-primary-color"
            selectLabel={copy.selectColor}
            onCommit={(next) => form.setValue("primaryColor", next, { shouldDirty: true, shouldValidate: true })}
          />
          <ColorField
            label={copy.surfaceColorTitle}
            description={copy.surfaceColorDescription}
            value={currentCardColor}
            suggestions={themeColorSuggestions.surface}
            pickerId="theme-surface-color"
            selectLabel={copy.selectColor}
            onCommit={(next) => form.setValue("cardColor", next, { shouldDirty: true, shouldValidate: true })}
          />
        </div>
        <div className="rounded-[16px] border border-white/8 bg-white/[0.025] p-3.5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <ColorField
              label={copy.backgroundColorTitle}
              description={copy.backgroundColorDescription}
              value={currentBackgroundColor}
              suggestions={themeColorSuggestions.background}
              pickerId="theme-background-color"
              selectLabel={copy.selectColor}
              onCommit={applyBackgroundTone}
            />
            <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
              <p className="text-[12px] font-medium text-white">{copy.backgroundImageTitle}</p>
              <p className="mt-1 text-[11px] leading-[1.4] text-[var(--foreground-muted)]">{copy.backgroundImageDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[12px] border border-white/10 bg-white/[0.05] px-3 text-[12px] font-medium text-white transition hover:bg-white/[0.08]">
                  <Upload className="size-4" />
                  {copy.backgroundUpload}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleBackgroundUpload(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {currentBackgroundImageUrl ? (
                  <Button type="button" variant="ghost" className="h-9 px-3" onClick={clearBackgroundImage}>
                    <X className="size-4" />
                    {copy.backgroundRemove}
                  </Button>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] leading-[1.4] text-[var(--foreground-muted)]">{copy.backgroundAutoNote}</p>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );

  return (
    <div className="space-y-3 xl:space-y-2.5">
      {flashMessage ? (
        <div className="fixed right-4 top-4 z-30 rounded-full border border-white/10 bg-[rgba(12,12,14,0.94)] px-4 py-2 text-sm text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
          {flashMessage}
        </div>
      ) : null}

      <form
        className="space-y-3 xl:space-y-2.5"
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
        }}
      >
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)] xl:text-[1.45rem]">
              {copy.title}
            </h1>
            <p className="max-w-[620px] text-[12px] leading-[1.4] text-[var(--foreground-muted)]">{copy.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <Button type="button" variant="ghost" className="h-[36px] px-3.5" onClick={resetThemeToDefault}>
              {copy.resetDefaults}
            </Button>
            <Button type="submit" className="h-[36px] px-3.5" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
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
            {demoMode ? <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] text-[var(--foreground-muted)]">{copy.demo}</span> : null}
          </div>
        </div>

        {!hasPro ? <UpgradeFeatureCard locale={locale} /> : null}

        <div className="flex flex-wrap gap-2">
          {moduleItems.map((item) => (
            <ModuleTab
              key={item.key}
              active={activeModule === item.key && (!item.locked || hasPro)}
              locked={item.locked}
              label={item.label}
              onClick={() => {
                if (item.locked && !hasPro) {
                  setLockedModulePreview(item.key as Exclude<CustomizeModule, "presets">);
                  return;
                }

                setLockedModulePreview(null);
                setActiveModule(item.key);
              }}
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_368px] 2xl:grid-cols-[minmax(0,1fr)_392px]">
          <div className="space-y-3">
            {modulePanel}
            {form.formState.errors.root?.message ? (
              <div className="rounded-[18px] border border-red-300/20 bg-red-400/10 px-4 py-3 text-[12px] text-red-100">
                {form.formState.errors.root.message}
              </div>
            ) : null}
          </div>

          <Card className="border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)] xl:sticky xl:top-3">
            <CardHeader className="pb-2.5">
              <CardTitle className="text-[1rem] tracking-[-0.02em]">{copy.livePreviewTitle}</CardTitle>
              <CardDescription className="text-[11px]">{copy.livePreviewDescription}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AppearancePreview artist={artist} theme={previewTheme} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
