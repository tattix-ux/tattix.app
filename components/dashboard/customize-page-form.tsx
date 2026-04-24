"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Crown,
  ImageIcon,
  Layers3,
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
type CustomizeModule = "presets" | "colors" | "background" | "surfaces";

type CustomizePageArtist = {
  profile: ArtistProfile;
  funnelSettings: ArtistFunnelSettings;
};

const themeColorSuggestions = {
  primary: ["#C89B5D", "#D6C6A5", "#8B5CF6", "#B68A56", "#7BA7D9", "#E7E5E4"],
  secondary: ["#8E6B43", "#8A7F73", "#C084FC", "#6F7B5C", "#4E6FAE", "#A8A29E"],
  background: ["#121212", "#141518", "#100F16", "#111111", "#131512", "#10141B"],
  surface: ["#1A1A1C", "#1C1E22", "#181622", "#181818", "#1B1E1A", "#171D26"],
} as const;

const backgroundOverlayOptions = [
  { value: "light", labelTr: "Hafif", labelEn: "Light", overlay: "rgba(10, 10, 12, 0.34)" },
  { value: "balanced", labelTr: "Dengeli", labelEn: "Balanced", overlay: "rgba(10, 10, 12, 0.48)" },
  { value: "strong", labelTr: "Güçlü", labelEn: "Strong", overlay: "rgba(10, 10, 12, 0.58)" },
  { value: "extra-strong", labelTr: "Çok güçlü", labelEn: "Very strong", overlay: "rgba(10, 10, 12, 0.68)" },
] as const;

const backgroundSoftnessOptions = [
  { value: "sharp", labelTr: "Net", labelEn: "Sharp" },
  { value: "soft", labelTr: "Yumuşak", labelEn: "Soft" },
  { value: "softer", labelTr: "Daha yumuşak", labelEn: "Softer" },
] as const;

const backgroundFocusOptions = [
  { value: "center", labelTr: "Ortala", labelEn: "Center" },
  { value: "top", labelTr: "Üst odaklı", labelEn: "Top focus" },
  { value: "left", labelTr: "Sol odaklı", labelEn: "Left focus" },
  { value: "right", labelTr: "Sağ odaklı", labelEn: "Right focus" },
] as const;

const cornerStyleOptions = [
  { value: "small", labelTr: "Daha düz", labelEn: "Flatter" },
  { value: "medium", labelTr: "Dengeli", labelEn: "Balanced" },
  { value: "large", labelTr: "Daha yuvarlak", labelEn: "Rounder" },
] as const;

const cardFeelOptions = [
  { value: "subtle", labelTr: "Sade", labelEn: "Subtle" },
  { value: "balanced", labelTr: "Dengeli", labelEn: "Balanced" },
  { value: "defined", labelTr: "Belirgin", labelEn: "Defined" },
] as const;

const buttonStyleOptions = [
  { value: "filled", labelTr: "Dolu", labelEn: "Filled" },
  { value: "soft", labelTr: "Yumuşak", labelEn: "Soft" },
  { value: "outline", labelTr: "Çerçeveli", labelEn: "Outlined" },
] as const;

const badgeStyleOptions = [
  { value: "subtle", labelTr: "Sade", labelEn: "Subtle" },
  { value: "colored", labelTr: "Renkli", labelEn: "Colored" },
] as const;

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
        className="absolute inset-y-0 left-0 w-1"
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

function CompactChoice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-[12px] border px-3 text-[12px] font-medium transition",
        active
          ? "border-[var(--border-strong)] bg-[rgba(214,177,122,0.12)] text-white"
          : "border-white/8 bg-white/[0.025] text-[var(--text-secondary)] hover:border-white/12 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      {label}
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
}: {
  label: string;
  description: string;
  value: string;
  suggestions: readonly string[];
  pickerId: string;
  onCommit: (value: string) => void;
  selectLabel: string;
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
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border px-2 text-[10px] font-medium transition",
                active
                  ? "border-[var(--border-strong)] bg-[rgba(214,177,122,0.12)] text-white"
                  : "border-white/8 bg-white/[0.025] text-[var(--foreground-muted)] hover:border-white/12 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <span className="inline-flex size-2.5 rounded-full border border-white/10" style={{ backgroundColor: suggestion }} />
              {suggestion}
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

  return (
    <div className="overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,#1B1D21_0%,#15171B_100%)] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.22)] xl:p-2.5">
      <div className="mx-auto max-w-[420px]">
        <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(16,17,20,0.72)] p-2.5 shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
          <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: tokens.borderColor, background: String(wrapperStyle.background ?? theme.backgroundColor) }}>
            <div className="relative h-[172px] overflow-hidden">
              {backgroundMedia.imageUrl || profile.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={backgroundMedia.imageUrl || profile.coverImageUrl || ""}
                  alt=""
                  className="absolute inset-0 h-full w-full scale-[1.04] object-cover"
                  style={{ objectPosition: backgroundMedia.position }}
                />
              ) : null}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    backgroundMedia.imageUrl || profile.coverImageUrl
                      ? backgroundMedia.overlayGradient
                      : `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
                }}
              />
              <div className="absolute inset-0" style={{ backgroundColor: backgroundMedia.overlayColor }} />
            </div>

            <div className="relative px-4 pb-4 pt-0">
              <div className="-mt-7 flex items-end gap-3">
                <div className="size-14 overflow-hidden rounded-[18px] border border-white/12 bg-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.22)]">
                  {profile.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="pb-1">
                  <span
                    className="inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-medium uppercase tracking-[0.08em]"
                    style={{ backgroundColor: badgeBackground, borderColor: tokens.borderColor, color: "var(--artist-chip-text)" }}
                  >
                    {eyebrow}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <h3
                  className="text-[22px] font-semibold tracking-[-0.03em]"
                  style={{
                    color: tokens.cardText,
                    fontFamily: "var(--artist-heading-font)",
                    fontWeight: 700,
                    letterSpacing: theme.headingFont.includes("playfair") || theme.headingFont.includes("garamond") || theme.headingFont.includes("baskerville") ? "0em" : "-0.01em",
                  }}
                >
                  {heading}
                </h3>
                <p className="max-w-[32ch] text-[12px] leading-[1.45]" style={{ color: tokens.cardMuted }}>
                  {description}
                </p>
              </div>

              <div
                className="mt-4 rounded-[20px] border p-3.5"
                style={{ borderColor: tokens.borderColor, backgroundColor: surfaceBackground }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: tokens.muted }}>
                      {locale === "tr" ? "Adım 1" : "Step 1"}
                    </p>
                    <h4 className="mt-1 text-[18px] font-semibold tracking-[-0.03em]" style={{ color: tokens.cardText, fontFamily: "var(--artist-heading-font)" }}>
                      {welcomeTitle}
                    </h4>
                  </div>
                  <span
                    className="inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-medium"
                    style={{ borderColor: tokens.borderColor, backgroundColor: toRgba(theme.primaryColor, 0.12), color: theme.primaryColor }}
                  >
                    1 / 7
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-[1.45]" style={{ color: tokens.cardMuted }}>
                  {welcomeDescription}
                </p>

                <div className="mt-3 grid gap-2">
                  {optionLabels.map((item, index) => (
                    <div
                      key={item.title}
                      className="rounded-[16px] border p-3"
                      style={{
                        borderColor: index === 0 ? toRgba(theme.primaryColor, 0.28) : tokens.borderColor,
                        background:
                          index === 0
                            ? `linear-gradient(180deg, ${toRgba(theme.primaryColor, 0.16)}, ${toRgba(theme.primaryColor, 0.08)})`
                            : toRgba(theme.cardColor, 0.72),
                      }}
                    >
                      <p className="text-[13px] font-semibold" style={{ color: tokens.cardText }}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] leading-[1.4]" style={{ color: tokens.cardMuted }}>
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: tokens.cardMuted }}>
                <span className="inline-flex h-6 items-center rounded-full border px-2.5" style={{ borderColor: tokens.borderColor, backgroundColor: toRgba(theme.cardColor, 0.76) }}>
                  {locale === "tr" ? "Profil hazır" : "Profile ready"}
                </span>
                <span>{locale === "tr" ? "Tema burada gerçek akış üstünde görünür." : "Theme updates show on the real flow here."}</span>
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
          colorsModule: "Renkler",
          backgroundModule: "Arka Plan",
          surfacesModule: "Butonlar ve Kartlar",
          colorsTitle: "Renkler",
          colorsDescription: "Sayfanın ana tonlarını seç. Yazı ve yardımcı tonlar otomatik olarak dengelenir.",
          primaryColorTitle: "Ana Renk",
          primaryColorDescription: "Butonlar, linkler ve ana vurgu alanlarında kullanılır.",
          secondaryColorTitle: "Yardımcı Renk",
          secondaryColorDescription: "İkincil vurgu ve destekleyici detaylarda kullanılır.",
          backgroundColorTitle: "Sayfa Zemini",
          backgroundColorDescription: "Sayfanın ana arka plan tonudur.",
          surfaceColorTitle: "Kart Zemini",
          surfaceColorDescription: "Kartlar ve içerik yüzeylerinde kullanılır.",
          selectColor: "Seç",
          tokenPreviewTitle: "Renk sistemi önizlemesi",
          tokenPreviewDescription: "Seçtiğin tonların buton, kart ve metin dengesini burada hızlıca gör.",
          primaryButtonSample: "Ana buton",
          secondaryButtonSample: "İkincil buton",
          cardSampleTitle: "Kart örneği",
          cardSampleBody: "Başlık, açıklama ve etiketler otomatik olarak dengelenir.",
          badgeSample: "Etiket",
          backgroundModuleTitle: "Arka Plan",
          backgroundModuleDescription: "Kendi görselini yükle veya sade bir zemin kullan. Sistem yazıların okunmasını otomatik korur.",
          backgroundKindTitle: "Arka plan türü",
          backgroundKindSolid: "Sade zemin",
          backgroundKindImage: "Görsel kullan",
          backgroundImageTitle: "Arka plan görseli",
          backgroundImageDescription: "Geniş kadraj, koyu veya dengeli görseller daha iyi sonuç verir.",
          backgroundUpload: "Görsel yükle",
          backgroundRemove: "Görseli kaldır",
          backgroundAutoNote: "Arka plan görseli otomatik olarak karartılır; böylece yazılar ve butonlar okunaklı kalır.",
          overlayTitle: "Karartma seviyesi",
          softnessTitle: "Görsel netliği",
          focusTitle: "Odak konumu",
          backgroundUploadEmpty: "Arka plan için bir görsel ekleyebilirsin.",
          surfacesTitle: "Butonlar ve Kartlar",
          surfacesDescription: "Sayfanın genel hissini birkaç net seçimle belirle.",
          cornerStyleTitle: "Köşe yapısı",
          cardFeelTitle: "Kart hissi",
          buttonStyleTitle: "Buton stili",
          badgeStyleTitle: "Küçük etiket stili",
          modulePreviewTitle: "Mini önizleme",
          modulePreviewDescription: "Kart, buton ve etiket davranışını tam preview’a bakmadan önce burada gör.",
          primaryActionLabel: "Ana buton",
          secondaryActionLabel: "İkincil buton",
          infoRowLabel: "Bilgi satırı",
          infoRowValue: "Kart ve aksiyon dengesi",
          badgePreviewLabel: "Müsait",
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
          colorsModule: "Colors",
          backgroundModule: "Background",
          surfacesModule: "Buttons & Cards",
          colorsTitle: "Colors",
          colorsDescription: "Choose the main tones of the page. Text and supporting tones are balanced automatically.",
          primaryColorTitle: "Primary Color",
          primaryColorDescription: "Used for buttons, links, and key highlights.",
          secondaryColorTitle: "Secondary Color",
          secondaryColorDescription: "Used for secondary emphasis and supporting details.",
          backgroundColorTitle: "Page Background",
          backgroundColorDescription: "The main background tone of the page.",
          surfaceColorTitle: "Card Surface",
          surfaceColorDescription: "Used across cards and content surfaces.",
          selectColor: "Pick",
          tokenPreviewTitle: "Color system preview",
          tokenPreviewDescription: "Check the balance between buttons, cards, and text before the full preview.",
          primaryButtonSample: "Primary button",
          secondaryButtonSample: "Secondary button",
          cardSampleTitle: "Card sample",
          cardSampleBody: "Heading, description, and badges remain automatically balanced.",
          badgeSample: "Badge",
          backgroundModuleTitle: "Background",
          backgroundModuleDescription: "Upload your own image or use a simple surface. The system keeps text readable automatically.",
          backgroundKindTitle: "Background type",
          backgroundKindSolid: "Solid surface",
          backgroundKindImage: "Use image",
          backgroundImageTitle: "Background image",
          backgroundImageDescription: "Wide, darker, or balanced images usually work best.",
          backgroundUpload: "Upload image",
          backgroundRemove: "Remove image",
          backgroundAutoNote: "The background image is automatically darkened so text and buttons stay readable.",
          overlayTitle: "Darkening level",
          softnessTitle: "Image softness",
          focusTitle: "Focus position",
          backgroundUploadEmpty: "Add an image for the background.",
          surfacesTitle: "Buttons & Cards",
          surfacesDescription: "Shape the overall feel of the page with a few clear choices.",
          cornerStyleTitle: "Corner style",
          cardFeelTitle: "Card feel",
          buttonStyleTitle: "Button style",
          badgeStyleTitle: "Small badge style",
          modulePreviewTitle: "Mini preview",
          modulePreviewDescription: "Check cards, buttons, and badges here before the full preview.",
          primaryActionLabel: "Primary button",
          secondaryActionLabel: "Secondary button",
          infoRowLabel: "Info row",
          infoRowValue: "Card and action balance",
          badgePreviewLabel: "Available",
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
  const currentBackgroundType = watchedValues.backgroundType ?? theme.backgroundType;
  const currentBackgroundColor = watchedValues.backgroundColor ?? theme.backgroundColor;
  const currentGradientStart = watchedValues.gradientStart ?? theme.gradientStart;
  const currentGradientEnd = watchedValues.gradientEnd ?? theme.gradientEnd;
  const currentBackgroundImageUrl = watchedValues.backgroundImageUrl ?? theme.backgroundImageUrl ?? "";
  const currentBackgroundOverlayStrength = watchedValues.backgroundOverlayStrength ?? theme.backgroundOverlayStrength;
  const currentBackgroundImageSoftness = watchedValues.backgroundImageSoftness ?? theme.backgroundImageSoftness;
  const currentBackgroundImageFocus = watchedValues.backgroundImageFocus ?? theme.backgroundImageFocus;
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentCardOpacity = typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
  const currentCardFeel = watchedValues.cardFeel ?? theme.cardFeel;
  const currentButtonStyle = watchedValues.buttonStyle ?? theme.buttonStyle;
  const currentBadgeStyle = watchedValues.badgeStyle ?? theme.badgeStyle;
  const currentThemeMode = watchedValues.themeMode ?? theme.themeMode;

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
      { key: "colors" as const, label: copy.colorsModule, locked: !hasPro },
      { key: "background" as const, label: copy.backgroundModule, locked: !hasPro },
      { key: "surfaces" as const, label: copy.surfacesModule, locked: !hasPro },
    ],
    [copy.backgroundModule, copy.colorsModule, copy.presetModule, copy.surfacesModule, hasPro],
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
    form.setValue("backgroundColor", nextColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientStart", mixHex(nextColor, currentCardColor, 0.82), { shouldDirty: true, shouldValidate: true });
    form.setValue("gradientEnd", mixHex(nextColor, currentSecondaryColor, 0.68), { shouldDirty: true, shouldValidate: true });
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
        backgroundOverlayStrength: currentBackgroundOverlayStrength,
        backgroundImageSoftness: currentBackgroundImageSoftness,
        backgroundImageFocus: currentBackgroundImageFocus,
        textColor: derivedColorTokens.text,
        primaryColor: currentPrimaryColor,
        secondaryColor: currentSecondaryColor,
        cardColor: currentCardColor,
        cardOpacity: currentCardOpacity,
        cardFeel: currentCardFeel,
        buttonStyle: currentButtonStyle,
        badgeStyle: currentBadgeStyle,
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
      currentBackgroundImageFocus,
      currentBackgroundImageSoftness,
      currentBackgroundImageUrl,
      currentBackgroundOverlayStrength,
      currentBackgroundType,
      currentCardColor,
      currentCardFeel,
      currentCardOpacity,
      currentSecondaryColor,
      currentButtonStyle,
      currentBadgeStyle,
      currentGradientEnd,
      currentGradientStart,
      currentPreset,
      currentPrimaryColor,
      currentThemeMode,
      derivedColorTokens.text,
      theme.bodyFont,
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
    form.setValue("backgroundOverlayStrength", "balanced", { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundImageSoftness", "soft", { shouldDirty: true, shouldValidate: true });
    form.setValue("backgroundImageFocus", "center", { shouldDirty: true, shouldValidate: true });
    form.setValue("textColor", preset.textColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("primaryColor", preset.primaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("secondaryColor", preset.secondaryColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardColor", preset.cardColor, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardOpacity", preset.cardOpacity, { shouldDirty: true, shouldValidate: true });
    form.setValue("cardFeel", "balanced", { shouldDirty: true, shouldValidate: true });
    form.setValue("buttonStyle", "filled", { shouldDirty: true, shouldValidate: true });
    form.setValue("badgeStyle", "colored", { shouldDirty: true, shouldValidate: true });
    form.setValue("headingFont", preset.headingFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("bodyFont", preset.bodyFont, { shouldDirty: true, shouldValidate: true });
    form.setValue("fontPairingPreset", preset.fontPairingPreset, { shouldDirty: true, shouldValidate: true });
    form.setValue("radiusStyle", preset.radiusStyle, { shouldDirty: true, shouldValidate: true });
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

  const tokenPreview = (
    <div className="rounded-[18px] border p-3" style={{ background: `linear-gradient(180deg, ${currentBackgroundColor} 0%, ${derivedColorTokens.overlay} 100%)`, borderColor: derivedColorTokens.border }}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center rounded-full px-3.5 text-[12px] font-medium shadow-[0_10px_20px_rgba(0,0,0,0.18)]" style={{ backgroundColor: currentPrimaryColor, color: derivedColorTokens.buttonText }}>
              {copy.primaryButtonSample}
            </div>
            <div className="inline-flex h-9 items-center rounded-full border px-3.5 text-[12px] font-medium" style={{ backgroundColor: toRgba(currentCardColor, 0.76), borderColor: derivedColorTokens.border, color: derivedColorTokens.text }}>
              {copy.secondaryButtonSample}
            </div>
            <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-medium" style={{ backgroundColor: derivedColorTokens.chipBackground, color: derivedColorTokens.chipText }}>
              {copy.badgeSample}
            </span>
          </div>
          <div className="rounded-[16px] border p-3" style={{ backgroundColor: toRgba(currentCardColor, 0.88), borderColor: derivedColorTokens.border }}>
            <p className="text-[14px] font-semibold tracking-[-0.03em]" style={{ color: derivedColorTokens.text }}>
              {copy.cardSampleTitle}
            </p>
            <p className="mt-1.5 text-[12px] leading-[1.45]" style={{ color: derivedColorTokens.mutedText }}>
              {copy.cardSampleBody}
            </p>
          </div>
        </div>
        <div className="rounded-[16px] border p-3" style={{ backgroundColor: toRgba(currentCardColor, 0.72), borderColor: derivedColorTokens.border }}>
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: derivedColorTokens.mutedText }}>{copy.infoRowLabel}</span>
            <span style={{ color: derivedColorTokens.text }}>{copy.infoRowValue}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const modulePanel = activeModuleLocked ? (
    <SectionCard title={moduleItems.find((item) => item.key === displayModule)?.label ?? copy.colorsModule} icon={<LockKeyhole className="size-4" />}>
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
  ) : displayModule === "colors" ? (
    <SectionCard title={copy.colorsTitle} description={copy.colorsDescription} icon={<Palette className="size-4" />}>
      <div className="space-y-3">
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
            label={copy.secondaryColorTitle}
            description={copy.secondaryColorDescription}
            value={currentSecondaryColor}
            suggestions={themeColorSuggestions.secondary}
            pickerId="theme-secondary-color"
            selectLabel={copy.selectColor}
            onCommit={(next) => form.setValue("secondaryColor", next, { shouldDirty: true, shouldValidate: true })}
          />
          <ColorField
            label={copy.backgroundColorTitle}
            description={copy.backgroundColorDescription}
            value={currentBackgroundColor}
            suggestions={themeColorSuggestions.background}
            pickerId="theme-background-color"
            selectLabel={copy.selectColor}
            onCommit={applyBackgroundTone}
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
        <div>
          <p className="mb-2 text-[13px] font-medium text-white">{copy.tokenPreviewTitle}</p>
          <p className="mb-3 text-[11px] leading-[1.4] text-[var(--foreground-muted)]">{copy.tokenPreviewDescription}</p>
          {tokenPreview}
        </div>
      </div>
    </SectionCard>
  ) : displayModule === "background" ? (
    <SectionCard title={copy.backgroundModuleTitle} description={copy.backgroundModuleDescription} icon={<ImageIcon className="size-4" />}>
      <div className="space-y-3">
        <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
          <p className="mb-2 text-[12px] font-medium text-white">{copy.backgroundKindTitle}</p>
          <div className="grid grid-cols-2 gap-2">
            <CompactChoice active={currentBackgroundType !== "image"} label={copy.backgroundKindSolid} onClick={() => form.setValue("backgroundType", "solid", { shouldDirty: true, shouldValidate: true })} />
            <CompactChoice active={currentBackgroundType === "image"} label={copy.backgroundKindImage} onClick={() => form.setValue("backgroundType", "image", { shouldDirty: true, shouldValidate: true })} />
          </div>
        </div>

        {currentBackgroundType === "image" ? (
          <>
            <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
              <p className="text-[12px] font-medium text-white">{copy.backgroundImageTitle}</p>
              <p className="mt-1 text-[11px] leading-[1.4] text-[var(--foreground-muted)]">{copy.backgroundImageDescription}</p>
              <div className="mt-3 overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.03]">
                <div className="relative flex h-[116px] items-center justify-center">
                  {currentBackgroundImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentBackgroundImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-6 text-center text-[12px] text-[var(--foreground-muted)]">
                      <ImageIcon className="size-4" />
                      <span>{copy.backgroundUploadEmpty}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
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

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
                <p className="mb-2 text-[12px] font-medium text-white">{copy.overlayTitle}</p>
                <div className="grid gap-2">
                  {backgroundOverlayOptions.map((option) => (
                    <CompactChoice
                      key={option.value}
                      active={currentBackgroundOverlayStrength === option.value}
                      label={locale === "tr" ? option.labelTr : option.labelEn}
                      onClick={() => form.setValue("backgroundOverlayStrength", option.value, { shouldDirty: true, shouldValidate: true })}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
                <p className="mb-2 text-[12px] font-medium text-white">{copy.softnessTitle}</p>
                <div className="grid gap-2">
                  {backgroundSoftnessOptions.map((option) => (
                    <CompactChoice
                      key={option.value}
                      active={currentBackgroundImageSoftness === option.value}
                      label={locale === "tr" ? option.labelTr : option.labelEn}
                      onClick={() => form.setValue("backgroundImageSoftness", option.value, { shouldDirty: true, shouldValidate: true })}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
                <p className="mb-2 text-[12px] font-medium text-white">{copy.focusTitle}</p>
                <div className="grid gap-2">
                  {backgroundFocusOptions.map((option) => (
                    <CompactChoice
                      key={option.value}
                      active={currentBackgroundImageFocus === option.value}
                      label={locale === "tr" ? option.labelTr : option.labelEn}
                      onClick={() => form.setValue("backgroundImageFocus", option.value, { shouldDirty: true, shouldValidate: true })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </SectionCard>
  ) : (
    <SectionCard title={copy.surfacesTitle} description={copy.surfacesDescription} icon={<Layers3 className="size-4" />}>
      <div className="space-y-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
            <p className="mb-2 text-[12px] font-medium text-white">{copy.cornerStyleTitle}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {cornerStyleOptions.map((option) => (
                <CompactChoice
                  key={option.value}
                  active={previewTheme.radiusStyle === option.value}
                  label={locale === "tr" ? option.labelTr : option.labelEn}
                  onClick={() => form.setValue("radiusStyle", option.value, { shouldDirty: true, shouldValidate: true })}
                />
              ))}
            </div>
          </div>
          <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
            <p className="mb-2 text-[12px] font-medium text-white">{copy.cardFeelTitle}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {cardFeelOptions.map((option) => (
                <CompactChoice
                  key={option.value}
                  active={currentCardFeel === option.value}
                  label={locale === "tr" ? option.labelTr : option.labelEn}
                  onClick={() => form.setValue("cardFeel", option.value, { shouldDirty: true, shouldValidate: true })}
                />
              ))}
            </div>
          </div>
          <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
            <p className="mb-2 text-[12px] font-medium text-white">{copy.buttonStyleTitle}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {buttonStyleOptions.map((option) => (
                <CompactChoice
                  key={option.value}
                  active={currentButtonStyle === option.value}
                  label={locale === "tr" ? option.labelTr : option.labelEn}
                  onClick={() => form.setValue("buttonStyle", option.value, { shouldDirty: true, shouldValidate: true })}
                />
              ))}
            </div>
          </div>
          <div className="rounded-[15px] border border-white/8 bg-white/[0.025] p-3">
            <p className="mb-2 text-[12px] font-medium text-white">{copy.badgeStyleTitle}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {badgeStyleOptions.map((option) => (
                <CompactChoice
                  key={option.value}
                  active={currentBadgeStyle === option.value}
                  label={locale === "tr" ? option.labelTr : option.labelEn}
                  onClick={() => form.setValue("badgeStyle", option.value, { shouldDirty: true, shouldValidate: true })}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-white">{copy.modulePreviewTitle}</p>
          <p className="mb-3 text-[11px] leading-[1.4] text-[var(--foreground-muted)]">{copy.modulePreviewDescription}</p>
          {tokenPreview}
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

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_410px] 2xl:grid-cols-[minmax(0,1fr)_440px]">
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
