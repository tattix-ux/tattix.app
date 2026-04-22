"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Crown,
  ImageIcon,
  ImagePlus,
  Laptop,
  Layers3,
  LoaderCircle,
  LockKeyhole,
  Palette,
  Save,
  Smartphone,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { BrandMonogram } from "@/components/shared/brand";
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
type PreviewViewport = "desktop" | "mobile";

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
  { value: "sharp", labelTr: "Net", labelEn: "Sharp", blur: "blur(0px)" },
  { value: "soft", labelTr: "Yumuşak", labelEn: "Soft", blur: "blur(6px)" },
  { value: "softer", labelTr: "Daha yumuşak", labelEn: "Softer", blur: "blur(12px)" },
] as const;

const backgroundFocusOptions = [
  { value: "center", labelTr: "Ortala", labelEn: "Center", position: "center center" },
  { value: "top", labelTr: "Üst odaklı", labelEn: "Top focus", position: "center top" },
  { value: "left", labelTr: "Sol odaklı", labelEn: "Left focus", position: "left center" },
  { value: "right", labelTr: "Sağ odaklı", labelEn: "Right focus", position: "right center" },
] as const;

const cornerStyleOptions = [
  { value: "small", labelTr: "Daha düz", labelEn: "Flatter", radius: "12px" },
  { value: "medium", labelTr: "Dengeli", labelEn: "Balanced", radius: "18px" },
  { value: "large", labelTr: "Daha yuvarlak", labelEn: "Rounder", radius: "26px" },
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

function ModuleNavItem({
  active,
  label,
  icon,
  locked = false,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  locked?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-[15px] border px-3 text-left text-[12.5px] font-medium transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_40%,white_8%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
          : locked
            ? "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.015))] text-[var(--text-secondary)] hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
            : "border-white/8 bg-white/[0.025] text-[var(--text-secondary)] hover:border-white/14 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      <span
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-[12px] border transition",
          active ? "border-white/10 bg-black/15 text-[var(--accent)]" : "border-white/8 bg-white/[0.03] text-[var(--text-muted)]",
        )}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {locked ? <LockKeyhole className="ml-auto size-3.5 text-[var(--text-muted)]" /> : null}
    </button>
  );
}

function UpgradeFeatureCard({
  locale,
  compact = false,
}: {
  locale: PublicLocale;
  compact?: boolean;
}) {
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
    <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_94%,black_6%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
      <CardContent className={cn("space-y-3.5", compact ? "p-3.5" : "p-4")}>
        <div className="flex items-start gap-3">
          <div className="rounded-[16px] border border-[color:color-mix(in_srgb,var(--accent)_30%,white_8%)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] p-2.5 text-[var(--accent)]">
            <Crown className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="inline-flex rounded-full border border-[color:color-mix(in_srgb,var(--accent)_30%,white_8%)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              {copy.badge}
            </div>
            <div>
              <h3 className="text-[1.02rem] font-semibold tracking-[-0.03em] text-white">{copy.title}</h3>
              <p className="mt-1 text-[12.5px] leading-5 text-[var(--foreground-muted)]">{copy.description}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {copy.features.map((item) => (
            <div
              key={item}
              className="rounded-[16px] border border-white/8 bg-white/[0.025] px-3 py-2.5 text-[12.5px] leading-5 text-[var(--text-secondary)]"
            >
              {item}
            </div>
          ))}
        </div>

        <Button asChild className="h-9 px-4">
          <Link href="/dashboard/upgrade">{copy.cta}</Link>
        </Button>
      </CardContent>
    </Card>
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
    <div className="rounded-[20px] border border-white/8 bg-white/[0.02] p-3 sm:p-3.5">
      <div className="mb-2.5 space-y-1">
        <p className="text-[13px] font-medium text-white">{title}</p>
        {description ? <p className="text-[13px] leading-5 text-[var(--foreground-muted)]">{description}</p> : null}
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
    <div className="space-y-2.5">
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
      <div className="flex flex-wrap gap-1.5">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12.5px] text-white transition hover:bg-white/[0.08]">
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
  onSelect,
  theme,
}: {
  active: boolean;
  title: string;
  description: string;
  onSelect: () => void;
  theme: (typeof themePresets)[ThemePresetKey];
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        backgroundColor: theme.surface,
        borderColor: active ? theme.primary : theme.border,
        boxShadow: active ? `0 0 0 1px ${toRgba(theme.primary, 0.12)}, 0 18px 36px rgba(0,0,0,0.18)` : undefined,
      }}
      className={cn(
        "relative min-h-[148px] overflow-hidden rounded-[24px] border p-4 text-left transition",
        active ? "" : "hover:-translate-y-0.5 hover:brightness-[1.04]",
      )}
    >
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at top left, ${toRgba(theme.primary, active ? 0.18 : 0.11)}, transparent 44%)`,
        }}
      />
      {active ? (
        <div
          className="absolute right-4 top-4 inline-flex size-6 items-center justify-center rounded-full border"
          style={{ borderColor: toRgba(theme.primary, 0.5), backgroundColor: toRgba(theme.primary, 0.16), color: theme.primary }}
        >
          <Check className="size-3.5" />
        </div>
      ) : null}
      <div className="relative flex h-full flex-col justify-between">
        <div
          className="rounded-[18px] border p-3"
          style={{
            background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.overlay} 100%)`,
            borderColor: toRgba(theme.textColor, 0.08),
          }}
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-12 rounded-full" style={{ backgroundColor: theme.primary }} />
              <div className="h-2.5 w-8 rounded-full" style={{ backgroundColor: toRgba(theme.secondary, 0.9) }} />
            </div>
            <div className="rounded-[14px] border p-2.5" style={{ backgroundColor: toRgba(theme.surface, 0.92), borderColor: toRgba(theme.textColor, 0.08) }}>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: toRgba(theme.textColor, 0.88) }} />
                  <div className="h-2 w-10 rounded-full" style={{ backgroundColor: toRgba(theme.mutedText, 0.9) }} />
                </div>
                <div className="h-6 w-14 rounded-full" style={{ backgroundColor: theme.primary }} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-[14px] border px-2.5 py-2" style={{ backgroundColor: toRgba(theme.surface, 0.76), borderColor: toRgba(theme.textColor, 0.08) }}>
              <div className="h-2 w-14 rounded-full" style={{ backgroundColor: toRgba(theme.mutedText, 0.78) }} />
              <div className="h-2 w-8 rounded-full" style={{ backgroundColor: toRgba(theme.primary, 0.72) }} />
            </div>
          </div>
        </div>
        <div className="pt-3">
          <p className="text-[1rem] font-semibold tracking-[-0.03em]" style={{ color: theme.textColor }}>
            {title}
          </p>
          <p className="mt-1 line-clamp-1 text-[13px] leading-5" style={{ color: theme.mutedText }}>
            {description}
          </p>
        </div>
      </div>
    </button>
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
    <div className="rounded-[20px] border border-white/8 bg-white/[0.025] p-3.5">
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-white">{label}</p>
        <p className="text-[12px] leading-5 text-[var(--foreground-muted)]">{description}</p>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <span
          className="inline-flex size-9 shrink-0 rounded-[14px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
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
          className="h-10 rounded-[14px] border-white/10 bg-white/[0.03] font-mono text-[13px] uppercase tracking-[0.08em]"
          inputMode="text"
        />
        <label
          htmlFor={pickerId}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] px-3 text-[12px] font-medium text-white transition hover:bg-white/[0.08]"
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

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const active = suggestion.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={suggestion}
              type="button"
              onClick={() => onCommit(suggestion)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition",
                active
                  ? "border-[color:color-mix(in_srgb,var(--accent)_45%,white_8%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-white"
                  : "border-white/8 bg-white/[0.025] text-[var(--foreground-muted)] hover:border-white/14 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              <span
                className="inline-flex size-3 rounded-full border border-white/10"
                style={{ backgroundColor: suggestion }}
              />
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
  viewport,
}: {
  artist: CustomizePageArtist;
  theme: ArtistPageTheme;
  locale: PublicLocale;
  viewport: PreviewViewport;
}) {
  const { wrapperStyle, tokens, backgroundMedia } = buildThemeStyles(theme);
  const headingColor = tokens.text;
  const mutedColor = tokens.muted;
  const cardText = tokens.cardText;
  const cardMuted = tokens.cardMuted;
  const shellBackground = String(wrapperStyle.background ?? theme.backgroundColor);
  const cardBackground = toRgba(theme.cardColor, theme.cardOpacity);
  const cardBorder = tokens.borderColor;
  const title = artist.profile.welcomeHeadline?.trim() || (locale === "tr" ? "Aklında ne var?" : "What do you have in mind?");
  const intro =
    artist.profile.shortBio?.trim() ||
    (locale === "tr"
      ? "Müşteri sana yazmadan önce temel detayları burada paylaşır."
      : "Clients share the key details here before they message you.");
  const upperLabel =
    artist.funnelSettings.introEyebrow?.trim() ||
    (artist.profile.instagramHandle ? `@${artist.profile.instagramHandle}` : locale === "tr" ? "Stüdyo etiketi" : "Studio label");
  const profileImageUrl = artist.profile.profileImageUrl;
  const coverImageUrl = artist.profile.coverImageUrl;
  const desktopShell = viewport === "desktop";

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,#1B1D21_0%,#15171B_100%)] p-4 shadow-[0_22px_56px_rgba(0,0,0,0.24)] sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,177,122,0.06),transparent_34%)]" />
      <div className={cn("relative mx-auto", desktopShell ? "max-w-none" : "max-w-[420px]")}>
        <div
          className={cn(
            "rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[rgba(16,17,20,0.72)] p-3 shadow-[0_20px_46px_rgba(0,0,0,0.26)]",
            desktopShell ? "max-w-none" : "",
          )}
        >
          <div className="relative overflow-hidden rounded-[28px] border" style={{ borderColor: cardBorder, background: shellBackground }}>
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
            <div className={cn(desktopShell ? "p-4" : "p-4")}>
              <div
                className={cn("relative overflow-hidden rounded-[26px] border", desktopShell ? "h-[220px]" : "h-[250px]")}
                style={{ borderColor: cardBorder, background: shellBackground }}
              >
                {coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : null}
                <div
                  className="absolute inset-0"
                  style={{
                    background: coverImageUrl
                      ? "linear-gradient(180deg, rgba(10,10,11,0.08), rgba(10,10,11,0.42) 65%, rgba(10,10,11,0.78))"
                      : `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`,
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div
                    className={cn(
                      "grid gap-3 rounded-[22px] border p-3.5 backdrop-blur-sm",
                      desktopShell ? "grid-cols-[1fr_auto]" : "grid-cols-1",
                    )}
                    style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.58) }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 overflow-hidden rounded-[18px] border border-white/12 bg-white/10">
                        {profileImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]"
                          style={{ backgroundColor: "var(--artist-chip-surface)", color: "var(--artist-chip-text)" }}
                        >
                          {upperLabel}
                        </div>
                        <p
                          className="mt-2 truncate text-[1.05rem] font-semibold tracking-[-0.03em]"
                          style={{ color: cardText, fontFamily: headingPreviewFonts[theme.headingFont] }}
                        >
                          {artist.profile.artistName}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: cardMuted }}>
                          {artist.profile.instagramHandle ? `@${artist.profile.instagramHandle}` : "tattix"}
                        </p>
                      </div>
                    </div>
                    <div className={cn("flex items-end", desktopShell ? "justify-end" : "justify-start")}>
                      <div
                        className="inline-flex rounded-[var(--artist-button-radius)] border px-4 py-2.5 text-sm font-medium"
                        style={{
                          backgroundColor: "var(--artist-primary-button-surface)",
                          borderColor: "var(--artist-primary-button-border)",
                          color: "var(--artist-primary-button-text)",
                          boxShadow: "var(--artist-button-shadow)",
                        }}
                      >
                        {locale === "tr" ? "Fiyat tahmini al" : "Start estimate"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn("mt-4 grid gap-3", desktopShell ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]" : "grid-cols-1")}>
                <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: cardBackground }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>
                    {locale === "tr" ? "Açıklama" : "About"}
                  </p>
                  <p
                    className="mt-3 text-[1.2rem] font-semibold tracking-[-0.03em]"
                    style={{ color: cardText, fontFamily: headingPreviewFonts[theme.headingFont] }}
                  >
                    {title}
                  </p>
                  <p className="mt-2 text-[13px] leading-6" style={{ color: cardMuted, fontFamily: bodyPreviewFonts[theme.bodyFont] }}>
                    {intro}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.5) }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>
                      {locale === "tr" ? "Kısa bilgi" : "Quick info"}
                    </p>
                    <div className="mt-3 grid gap-2.5">
                      <div className="flex items-center justify-between rounded-[18px] border px-3 py-2.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.42) }}>
                        <span className="text-[12px]" style={{ color: cardMuted }}>
                          {locale === "tr" ? "Şehirler" : "Cities"}
                        </span>
                        <span className="text-[12px] font-medium" style={{ color: cardText }}>
                          {artist.funnelSettings.bookingCities.length || 2}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-[18px] border px-3 py-2.5" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.42) }}>
                        <span className="text-[12px]" style={{ color: cardMuted }}>
                          {locale === "tr" ? "Talep akışı" : "Request flow"}
                        </span>
                        <span className="text-[12px] font-medium" style={{ color: cardText }}>
                          {locale === "tr" ? "Aktif" : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border p-4" style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.5) }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>
                      {locale === "tr" ? "Örnek işler" : "Featured work"}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      {[0, 1].map((index) => (
                        <div
                          key={index}
                          className="rounded-[18px] border p-3"
                          style={{ borderColor: cardBorder, backgroundColor: toRgba(theme.cardColor, 0.42) }}
                        >
                          <div className="h-16 rounded-[14px] border border-white/8 bg-white/[0.05]" />
                          <p className="mt-2 text-[12px] font-medium" style={{ color: cardText }}>
                            {locale === "tr" ? "Hazır tasarım" : "Ready design"}
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
          eyebrow: "PRO",
          title: "Sayfayı Özelleştir",
          description: "Müşterinin gördüğü sayfayı kendi tarzına göre düzenle.",
          desktopLabel: "Masaüstü",
          mobileLabel: "Mobil",
          previewTitle: "Önizleme",
          previewDescription: "Seçtiğin görünüm burada anlık görünür.",
          livePreviewTitle: "Canlı Önizleme",
          livePreviewDescription: "Yaptığın değişiklikler burada anında görünür.",
          moduleMenuTitle: "Modüller",
          moduleMenuDescription: "Bir modül seç ve sadece o ayarı düzenle.",
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
          tokenPreviewDescription: "Seçtiğin ana tonların arayüzde nasıl dengelendiğini burada görebilirsin.",
          primaryButtonSample: "Ana buton",
          secondaryButtonSample: "İkincil buton",
          cardSampleTitle: "Kart örneği",
          cardSampleBody: "Başlık, açıklama ve etiketler otomatik dengelenmiş tonlarla görünür.",
          badgeSample: "Küçük rozet",
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
          backgroundUploadEmpty: "Arka plan görseli ekleyebilirsin.",
          surfacesTitle: "Butonlar ve Kartlar",
          surfacesDescription: "Sayfanın genel hissini birkaç net seçimle belirle.",
          cornerStyleTitle: "Köşe yapısı",
          cardFeelTitle: "Kart hissi",
          buttonStyleTitle: "Buton stili",
          badgeStyleTitle: "Küçük etiket stili",
          modulePreviewTitle: "Örnek görünüm",
          modulePreviewDescription: "Seçimlerin kartları, butonları ve küçük etiketleri nasıl etkilediğini burada görebilirsin.",
          primaryActionLabel: "Ana buton",
          secondaryActionLabel: "İkincil buton",
          infoRowLabel: "Bilgi satırı",
          infoRowValue: "Kart ve buton dengesi",
          badgePreviewLabel: "Müsait",
          resetDefaults: "Varsayılana dön",
          save: "Kaydet",
          resetCurrent: "Değişiklikleri geri al",
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
          eyebrow: "PRO",
          title: "Customize Page",
          description: "Shape the page your clients see to match your style.",
          desktopLabel: "Desktop",
          mobileLabel: "Mobile",
          previewTitle: "Preview",
          previewDescription: "Your selected look updates here instantly.",
          livePreviewTitle: "Live Preview",
          livePreviewDescription: "Your changes appear here instantly.",
          moduleMenuTitle: "Modules",
          moduleMenuDescription: "Choose one module and adjust only that section.",
          presetSectionTitle: "Ready-made themes",
          presetSectionDescription: "Choose a base look first, then refine it with your own colors if you want.",
          presetHelp: "Ready-made themes are a strong starting point. You can refine colors and background in the next steps.",
          presetModule: "Ready-made themes",
          colorsModule: "Colors",
          backgroundModule: "Background",
          surfacesModule: "Buttons & Cards",
          colorsTitle: "Colors",
          colorsDescription: "Choose the main tones of the page. Text and supporting tones are balanced automatically.",
          primaryColorTitle: "Primary Color",
          primaryColorDescription: "Used for buttons, links, and the main accent moments.",
          secondaryColorTitle: "Secondary Color",
          secondaryColorDescription: "Used for secondary emphasis and supporting details.",
          backgroundColorTitle: "Page Background",
          backgroundColorDescription: "The main background tone of the page.",
          surfaceColorTitle: "Card Surface",
          surfaceColorDescription: "Used across cards and content surfaces.",
          selectColor: "Pick",
          tokenPreviewTitle: "Color system preview",
          tokenPreviewDescription: "See how your core tones balance the interface before checking the full preview.",
          primaryButtonSample: "Primary button",
          secondaryButtonSample: "Secondary button",
          cardSampleTitle: "Card sample",
          cardSampleBody: "Heading, description, and small labels stay automatically balanced.",
          badgeSample: "Badge",
          backgroundModuleTitle: "Background",
          backgroundModuleDescription: "Upload your own image or stay with a quiet surface. The system keeps text readable automatically.",
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
          backgroundUploadEmpty: "You can add a background image.",
          surfacesTitle: "Buttons & Cards",
          surfacesDescription: "Set the overall feel of the page with a few clear choices.",
          cornerStyleTitle: "Corner style",
          cardFeelTitle: "Card feel",
          buttonStyleTitle: "Button style",
          badgeStyleTitle: "Small badge style",
          modulePreviewTitle: "Sample preview",
          modulePreviewDescription: "See how cards, buttons, and badges react before checking the full page preview.",
          primaryActionLabel: "Primary button",
          secondaryActionLabel: "Secondary button",
          infoRowLabel: "Info row",
          infoRowValue: "Card and action balance",
          badgePreviewLabel: "Available",
          resetDefaults: "Reset to default",
          save: "Save",
          resetCurrent: "Revert changes",
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
  const currentBackgroundImageUrl = watchedValues.backgroundImageUrl ?? theme.backgroundImageUrl ?? "";
  const currentBackgroundOverlayStrength =
    watchedValues.backgroundOverlayStrength ?? theme.backgroundOverlayStrength;
  const currentBackgroundImageSoftness =
    watchedValues.backgroundImageSoftness ?? theme.backgroundImageSoftness;
  const currentBackgroundImageFocus =
    watchedValues.backgroundImageFocus ?? theme.backgroundImageFocus;
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentCardOpacity =
    typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
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
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("mobile");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const moduleItems = useMemo(
    () => [
      { key: "presets" as const, label: copy.presetModule, icon: <Sparkles className="size-3.5" />, locked: false },
      { key: "colors" as const, label: copy.colorsModule, icon: <Palette className="size-3.5" />, locked: !hasPro },
      { key: "background" as const, label: copy.backgroundModule, icon: <ImageIcon className="size-3.5" />, locked: !hasPro },
      { key: "surfaces" as const, label: copy.surfacesModule, icon: <Layers3 className="size-3.5" />, locked: !hasPro },
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
    form.setValue("gradientStart", mixHex(nextColor, currentCardColor, 0.82), {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("gradientEnd", mixHex(nextColor, currentSecondaryColor, 0.68), {
      shouldDirty: true,
      shouldValidate: true,
    });
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
      derivedColorTokens.text,
      currentGradientEnd,
      currentGradientStart,
      currentPreset,
      currentPrimaryColor,
      currentThemeMode,
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
  const surfacePreviewPresentation = useMemo(() => buildThemeStyles(previewTheme), [previewTheme]);

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

  function resetThemeToCurrent() {
    form.reset(buildFormValues(theme));
    form.clearErrors("root");
  }

  function resetThemeToDefault() {
    const defaultTheme = resolveArtistTheme({ presetTheme: "bronze-studio", artistId: artist.profile.id });
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
  const activeModuleItem = moduleItems.find((item) => item.key === displayModule);
  const activeModuleLocked = !hasPro && lockedModulePreview !== null;

  const modulePanel = activeModuleLocked ? (
    <SectionCard title={activeModuleItem?.label ?? copy.surfacesModule} icon={<LockKeyhole className="size-4" />}>
      <UpgradeFeatureCard locale={locale} compact />
    </SectionCard>
  ) : displayModule === "presets" ? (
      <SectionCard title={copy.presetSectionTitle} description={copy.presetSectionDescription} icon={<Sparkles className="size-4" />}>
        <div className="grid gap-4 md:grid-cols-2">
          {themePresetOptions.map((presetKey) => {
            const preset = themePresets[presetKey];

            return (
              <ThemePresetCard
                key={presetKey}
                active={currentPreset === presetKey}
                title={preset.label}
                description={preset.description}
                onSelect={() => applyPreset(presetKey)}
                theme={preset}
              />
            );
          })}
        </div>
        <p className="mt-4 text-[13px] leading-6 text-[var(--foreground-muted)]">{copy.presetHelp}</p>
      </SectionCard>
    ) : displayModule === "colors" ? (
      <SectionCard title={copy.colorsTitle} description={copy.colorsDescription} icon={<Palette className="size-4" />}>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
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
              onCommit={(next) => {
                form.setValue("secondaryColor", next, { shouldDirty: true, shouldValidate: true });
                if (currentBackgroundType !== "image") {
                  form.setValue("gradientEnd", mixHex(currentBackgroundColor, next, 0.68), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
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

          <CustomGroup title={copy.tokenPreviewTitle} description={copy.tokenPreviewDescription}>
            <div
              className="rounded-[20px] border p-4"
              style={{
                background: `linear-gradient(180deg, ${currentBackgroundColor} 0%, ${derivedColorTokens.overlay} 100%)`,
                borderColor: derivedColorTokens.border,
              }}
            >
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex rounded-full px-3 py-1.5 text-[11px] font-medium"
                      style={{ backgroundColor: derivedColorTokens.chipBackground, color: derivedColorTokens.chipText }}
                    >
                      {copy.badgeSample}
                    </span>
                    <div
                      className="inline-flex h-10 items-center rounded-full px-4 text-[13px] font-medium shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
                      style={{ backgroundColor: currentPrimaryColor, color: derivedColorTokens.buttonText }}
                    >
                      {copy.primaryButtonSample}
                    </div>
                    <div
                      className="inline-flex h-10 items-center rounded-full border px-4 text-[13px] font-medium"
                      style={{
                        backgroundColor: toRgba(currentCardColor, 0.72),
                        borderColor: derivedColorTokens.border,
                        color: derivedColorTokens.text,
                      }}
                    >
                      {copy.secondaryButtonSample}
                    </div>
                  </div>

                  <div
                    className="rounded-[18px] border p-4"
                    style={{ backgroundColor: toRgba(currentCardColor, 0.88), borderColor: derivedColorTokens.border }}
                  >
                    <p className="text-[1rem] font-semibold tracking-[-0.03em]" style={{ color: derivedColorTokens.text }}>
                      {copy.cardSampleTitle}
                    </p>
                    <p className="mt-2 text-[13px] leading-6" style={{ color: derivedColorTokens.mutedText }}>
                      {copy.cardSampleBody}
                    </p>
                  </div>
                </div>

                <div
                  className="rounded-[18px] border p-4"
                  style={{ backgroundColor: toRgba(currentCardColor, 0.72), borderColor: derivedColorTokens.border }}
                >
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: derivedColorTokens.mutedText }}>
                      Tokens
                    </p>
                    <div className="space-y-2 text-[12px]">
                      {[
                        ["Text", derivedColorTokens.text],
                        ["Muted", derivedColorTokens.mutedText],
                        ["Border", derivedColorTokens.border],
                        ["Soft Accent", derivedColorTokens.softAccent],
                      ].map(([tokenLabel, tokenValue]) => (
                        <div key={tokenLabel} className="flex items-center justify-between gap-3">
                          <span style={{ color: derivedColorTokens.mutedText }}>{tokenLabel}</span>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="inline-flex size-3 rounded-full border border-white/10"
                              style={{ backgroundColor: String(tokenValue).startsWith("#") ? String(tokenValue) : currentPrimaryColor }}
                            />
                            <span className="font-mono text-[11px] uppercase" style={{ color: derivedColorTokens.text }}>
                              {String(tokenValue)}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CustomGroup>
        </div>
      </SectionCard>
    ) : displayModule === "background" ? (
      <SectionCard title={copy.backgroundModuleTitle} description={copy.backgroundModuleDescription} icon={<ImageIcon className="size-4" />}>
        <div className="space-y-4">
          <CustomGroup title={copy.backgroundKindTitle}>
            <div className="inline-grid grid-cols-2 gap-2 rounded-[16px] border border-white/8 bg-white/[0.03] p-1">
              <SelectionPill
                active={currentBackgroundType !== "image"}
                onClick={() => form.setValue("backgroundType", "solid", { shouldDirty: true, shouldValidate: true })}
                className="rounded-[12px] border-0 px-3.5 py-2"
              >
                {copy.backgroundKindSolid}
              </SelectionPill>
              <SelectionPill
                active={currentBackgroundType === "image"}
                onClick={() => form.setValue("backgroundType", "image", { shouldDirty: true, shouldValidate: true })}
                className="rounded-[12px] border-0 px-3.5 py-2"
              >
                {copy.backgroundKindImage}
              </SelectionPill>
            </div>
          </CustomGroup>

          {currentBackgroundType === "image" ? (
            <>
              <CustomGroup title={copy.backgroundImageTitle} description={copy.backgroundImageDescription}>
                <MediaUploadField
                  imageUrl={currentBackgroundImageUrl}
                  emptyLabel={copy.backgroundUploadEmpty}
                  uploadLabel={copy.backgroundUpload}
                  removeLabel={copy.backgroundRemove}
                  onUpload={handleBackgroundUpload}
                  onRemove={clearBackgroundImage}
                />
                <p className="mt-3 text-[12px] leading-5 text-[var(--foreground-muted)]">{copy.backgroundAutoNote}</p>
              </CustomGroup>

              <CustomGroup title={copy.overlayTitle}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {backgroundOverlayOptions.map((option) => (
                    <SelectionPill
                      key={option.value}
                      active={currentBackgroundOverlayStrength === option.value}
                      onClick={() =>
                        form.setValue("backgroundOverlayStrength", option.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="justify-start rounded-[16px] px-4 py-3"
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-7 rounded-full border border-white/10" style={{ backgroundColor: option.overlay }} />
                        {locale === "tr" ? option.labelTr : option.labelEn}
                      </span>
                    </SelectionPill>
                  ))}
                </div>
              </CustomGroup>

              <CustomGroup title={copy.softnessTitle}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {backgroundSoftnessOptions.map((option) => (
                    <SelectionPill
                      key={option.value}
                      active={currentBackgroundImageSoftness === option.value}
                      onClick={() =>
                        form.setValue("backgroundImageSoftness", option.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="justify-center rounded-[16px] px-4 py-3"
                    >
                      {locale === "tr" ? option.labelTr : option.labelEn}
                    </SelectionPill>
                  ))}
                </div>
              </CustomGroup>

              <CustomGroup title={copy.focusTitle}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {backgroundFocusOptions.map((option) => (
                    <SelectionPill
                      key={option.value}
                      active={currentBackgroundImageFocus === option.value}
                      onClick={() =>
                        form.setValue("backgroundImageFocus", option.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className="justify-center rounded-[16px] px-4 py-3"
                    >
                      {locale === "tr" ? option.labelTr : option.labelEn}
                    </SelectionPill>
                  ))}
                </div>
              </CustomGroup>
            </>
          ) : null}
        </div>
      </SectionCard>
    ) : (
      <SectionCard title={copy.surfacesTitle} description={copy.surfacesDescription} icon={<Layers3 className="size-4" />}>
        <div className="space-y-4">
          <CustomGroup title={copy.cornerStyleTitle}>
            <div className="grid gap-3 md:grid-cols-3">
              {cornerStyleOptions.map((option) => (
                <VisualOptionCard
                  key={option.value}
                  active={previewTheme.radiusStyle === option.value}
                  title={locale === "tr" ? option.labelTr : option.labelEn}
                  description={`${option.radius}`}
                  onClick={() => form.setValue("radiusStyle", option.value, { shouldDirty: true, shouldValidate: true })}
                >
                  <div className="space-y-2 rounded-[16px] bg-[#111215] p-3">
                    <div className="h-11 border border-white/10" style={{ borderRadius: option.radius, backgroundColor: toRgba(currentCardColor, 0.82) }} />
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 border border-white/10" style={{ borderRadius: option.radius, backgroundColor: toRgba(currentPrimaryColor, 0.22) }} />
                      <div className="h-8 w-16 border border-white/10" style={{ borderRadius: option.radius, backgroundColor: toRgba(currentCardColor, 0.72) }} />
                    </div>
                  </div>
                </VisualOptionCard>
              ))}
            </div>
          </CustomGroup>

          <CustomGroup title={copy.cardFeelTitle}>
            <div className="grid gap-3 md:grid-cols-3">
              {cardFeelOptions.map((option) => {
                const active = currentCardFeel === option.value;
                const sampleBorder =
                  option.value === "subtle"
                    ? toRgba(currentCardColor, 0.22)
                    : option.value === "defined"
                      ? toRgba(derivedColorTokens.text, 0.16)
                      : toRgba(derivedColorTokens.border, 0.68);
                const sampleShadow =
                  option.value === "subtle"
                    ? "0 10px 18px rgba(0,0,0,0.12)"
                    : option.value === "defined"
                      ? "0 22px 34px rgba(0,0,0,0.22)"
                      : "0 14px 24px rgba(0,0,0,0.16)";

                return (
                  <VisualOptionCard
                    key={option.value}
                    active={active}
                    title={locale === "tr" ? option.labelTr : option.labelEn}
                    description={locale === "tr" ? "Kart sınırı ve gölgesi" : "Card edge and shadow"}
                    onClick={() => form.setValue("cardFeel", option.value, { shouldDirty: true, shouldValidate: true })}
                  >
                    <div className="space-y-2 rounded-[16px] bg-[#111215] p-3">
                      <div
                        className="rounded-[18px] border p-3"
                        style={{
                          borderColor: sampleBorder,
                          backgroundColor: toRgba(currentCardColor, 0.86),
                          boxShadow: sampleShadow,
                        }}
                      >
                        <div className="h-2.5 w-20 rounded-full" style={{ backgroundColor: toRgba(derivedColorTokens.text, 0.82) }} />
                        <div className="mt-2 h-2 w-full rounded-full" style={{ backgroundColor: toRgba(derivedColorTokens.mutedText, 0.56) }} />
                        <div className="mt-1.5 h-2 w-3/4 rounded-full" style={{ backgroundColor: toRgba(derivedColorTokens.mutedText, 0.42) }} />
                      </div>
                    </div>
                  </VisualOptionCard>
                );
              })}
            </div>
          </CustomGroup>

          <CustomGroup title={copy.buttonStyleTitle}>
            <div className="grid gap-3 md:grid-cols-3">
              {buttonStyleOptions.map((option) => {
                const active = currentButtonStyle === option.value;
                const sampleStyle =
                  option.value === "soft"
                    ? {
                        backgroundColor: toRgba(currentPrimaryColor, 0.2),
                        borderColor: toRgba(currentPrimaryColor, 0.26),
                        color: derivedColorTokens.text,
                      }
                    : option.value === "outline"
                      ? {
                          backgroundColor: toRgba(currentPrimaryColor, 0.05),
                          borderColor: toRgba(currentPrimaryColor, 0.46),
                          color: derivedColorTokens.text,
                        }
                      : {
                          backgroundColor: currentPrimaryColor,
                          borderColor: toRgba(currentPrimaryColor, 0.26),
                          color: derivedColorTokens.buttonText,
                        };

                return (
                  <VisualOptionCard
                    key={option.value}
                    active={active}
                    title={locale === "tr" ? option.labelTr : option.labelEn}
                    description={locale === "tr" ? "Ana çağrı butonu" : "Main action button"}
                    onClick={() => form.setValue("buttonStyle", option.value, { shouldDirty: true, shouldValidate: true })}
                  >
                    <div className="space-y-2 rounded-[16px] bg-[#111215] p-3">
                      <div className="inline-flex h-10 items-center justify-center rounded-[18px] border px-4 text-sm font-medium" style={sampleStyle}>
                        {copy.primaryActionLabel}
                      </div>
                      <div
                        className="inline-flex h-10 items-center justify-center rounded-[18px] border px-4 text-sm font-medium"
                        style={{
                          backgroundColor: toRgba(currentCardColor, 0.72),
                          borderColor: derivedColorTokens.border,
                          color: derivedColorTokens.text,
                        }}
                      >
                        {copy.secondaryActionLabel}
                      </div>
                    </div>
                  </VisualOptionCard>
                );
              })}
            </div>
          </CustomGroup>

          <CustomGroup title={copy.badgeStyleTitle}>
            <div className="grid gap-3 md:grid-cols-2">
              {badgeStyleOptions.map((option) => {
                const active = currentBadgeStyle === option.value;
                const badgeStyle =
                  option.value === "colored"
                    ? {
                        backgroundColor: derivedColorTokens.chipBackground,
                        borderColor: toRgba(currentPrimaryColor, 0.18),
                        color: derivedColorTokens.chipText,
                      }
                    : {
                        backgroundColor: toRgba(currentCardColor, 0.7),
                        borderColor: toRgba(currentCardColor, 0.22),
                        color: derivedColorTokens.text,
                      };

                return (
                  <VisualOptionCard
                    key={option.value}
                    active={active}
                    title={locale === "tr" ? option.labelTr : option.labelEn}
                    description={locale === "tr" ? "Şehir ve uygunluk etiketleri" : "City and availability badges"}
                    onClick={() => form.setValue("badgeStyle", option.value, { shouldDirty: true, shouldValidate: true })}
                  >
                    <div className="space-y-2 rounded-[16px] bg-[#111215] p-3">
                      <div className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium" style={badgeStyle}>
                        {copy.badgePreviewLabel}
                      </div>
                    </div>
                  </VisualOptionCard>
                );
              })}
            </div>
          </CustomGroup>

          <CustomGroup title={copy.modulePreviewTitle} description={copy.modulePreviewDescription}>
            <div
              className="rounded-[22px] border p-4"
              style={{
                ...surfacePreviewPresentation.wrapperStyle,
                borderColor: surfacePreviewPresentation.tokens.borderColor,
                background: "var(--artist-background-base)",
              }}
            >
              <div
                className="rounded-[var(--artist-card-radius)] border p-4"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor: "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
                  boxShadow: "var(--artist-card-shadow)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--artist-card-text)", fontFamily: "var(--artist-heading-font)" }}>
                  {copy.cardSampleTitle}
                </p>
                <p className="mt-1 text-[13px] leading-6" style={{ color: "var(--artist-card-muted)" }}>
                  {copy.cardSampleBody}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <div
                    className="inline-flex h-10 items-center rounded-[var(--artist-button-radius)] border px-4 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--artist-primary-button-surface)",
                      borderColor: "var(--artist-primary-button-border)",
                      color: "var(--artist-primary-button-text)",
                      boxShadow: "var(--artist-button-shadow)",
                    }}
                  >
                    {copy.primaryActionLabel}
                  </div>
                  <div
                    className="inline-flex h-10 items-center rounded-[var(--artist-button-radius)] border px-4 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--artist-secondary-button-surface)",
                      borderColor: "var(--artist-secondary-button-border)",
                      color: "var(--artist-secondary-button-text)",
                    }}
                  >
                    {copy.secondaryActionLabel}
                  </div>
                  <div
                    className="inline-flex rounded-full border px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--artist-chip-surface)",
                      borderColor: "var(--artist-border)",
                      color: "var(--artist-chip-text)",
                    }}
                  >
                    {copy.badgePreviewLabel}
                  </div>
                </div>
                <div
                  className="mt-4 flex items-center justify-between rounded-[calc(var(--artist-card-radius)-4px)] border px-3.5 py-2.5 text-[13px]"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "color-mix(in srgb, var(--artist-card) 82%, transparent)",
                  }}
                >
                  <span style={{ color: "var(--artist-card-muted)" }}>{copy.infoRowLabel}</span>
                  <span style={{ color: "var(--artist-card-text)" }}>{copy.infoRowValue}</span>
                </div>
              </div>
            </div>
          </CustomGroup>
        </div>
      </SectionCard>
    );

  return (
    <div className="space-y-3">
      {flashMessage ? (
        <div className="fixed right-4 top-4 z-30 rounded-full border border-white/10 bg-[rgba(12,12,14,0.94)] px-4 py-2 text-sm text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
          {flashMessage}
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
          if (event.key === "Escape") {
            event.preventDefault();
            resetThemeToCurrent();
          }
        }}
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">{copy.eyebrow}</p>
              <div className="space-y-1">
                <h1 className="text-[1.82rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{copy.title}</h1>
                <p className="max-w-[640px] text-[12.5px] leading-5 text-[var(--foreground-muted)]">{copy.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="inline-grid grid-cols-2 gap-1 rounded-[16px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <SelectionPill
                  active={previewViewport === "desktop"}
                  onClick={() => setPreviewViewport("desktop")}
                  className="rounded-[12px] border-0 px-3.5 py-2"
                >
                  <span className="flex items-center gap-2">
                    <Laptop className="size-3.5" />
                    {copy.desktopLabel}
                  </span>
                </SelectionPill>
                <SelectionPill
                  active={previewViewport === "mobile"}
                  onClick={() => setPreviewViewport("mobile")}
                  className="rounded-[12px] border-0 px-3.5 py-2"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="size-3.5" />
                    {copy.mobileLabel}
                  </span>
                </SelectionPill>
              </div>
              <Button type="button" variant="ghost" className="h-9 px-4" onClick={resetThemeToDefault}>
                {copy.resetDefaults}
              </Button>
              <Button type="submit" className="h-9 px-4" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
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
              {demoMode ? (
                <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-[var(--foreground-muted)]">
                  {copy.demo}
                </span>
              ) : null}
            </div>
          </div>

          {!hasPro ? <UpgradeFeatureCard locale={locale} /> : null}

          <div className="grid gap-4 xl:hidden">
            <div className="grid grid-cols-2 gap-2">
              {moduleItems.map((item) => (
                <ModuleNavItem
                  key={item.key}
                  active={activeModule === item.key && (!item.locked || hasPro)}
                  locked={item.locked}
                  label={item.label}
                  icon={item.icon}
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
            {modulePanel}
            {form.formState.errors.root?.message ? (
              <div className="rounded-[22px] border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {form.formState.errors.root.message}
              </div>
            ) : null}
            <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[1.02rem] tracking-[-0.02em]">{copy.livePreviewTitle}</CardTitle>
                <CardDescription>{copy.livePreviewDescription}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <AppearancePreview artist={artist} theme={previewTheme} locale={locale} viewport={previewViewport} />
              </CardContent>
            </Card>
          </div>

          <div className="hidden xl:grid xl:grid-cols-[208px_minmax(420px,1fr)_420px] xl:items-start xl:gap-4 2xl:grid-cols-[208px_minmax(440px,1fr)_468px]">
            <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_94%,black_6%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[1rem] tracking-[-0.02em]">{copy.moduleMenuTitle}</CardTitle>
                <CardDescription>{copy.moduleMenuDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {moduleItems.map((item) => (
                  <ModuleNavItem
                    key={item.key}
                    active={activeModule === item.key && (!item.locked || hasPro)}
                    locked={item.locked}
                    label={item.label}
                    icon={item.icon}
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
              </CardContent>
            </Card>

            <div className="space-y-3">
              {modulePanel}
              {form.formState.errors.root?.message ? (
                <div className="rounded-[22px] border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                  {form.formState.errors.root.message}
                </div>
              ) : null}
            </div>

            <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)] xl:sticky xl:top-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-[1.02rem] tracking-[-0.02em]">{copy.livePreviewTitle}</CardTitle>
                <CardDescription>{copy.livePreviewDescription}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <AppearancePreview artist={artist} theme={previewTheme} locale={locale} viewport={previewViewport} />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
