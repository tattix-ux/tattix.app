"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ImageIcon,
  ImagePlus,
  Laptop,
  Layers3,
  LoaderCircle,
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
type BackgroundStyleChoice = "solid" | "soft-gradient" | "deep-gradient" | "image";
type CustomizeModule = "presets" | "colors" | "background" | "surfaces";
type PreviewViewport = "desktop" | "mobile";

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

const themeColorSuggestions = {
  primary: ["#C89B5D", "#D6C6A5", "#8B5CF6", "#B68A56", "#7BA7D9", "#E7E5E4"],
  secondary: ["#8E6B43", "#8A7F73", "#C084FC", "#6F7B5C", "#4E6FAE", "#A8A29E"],
  background: ["#121212", "#141518", "#100F16", "#111111", "#131512", "#10141B"],
  surface: ["#1A1A1C", "#1C1E22", "#181622", "#181818", "#1B1E1A", "#171D26"],
} as const;

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

function ModuleNavItem({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 w-full items-center gap-3 rounded-[16px] border px-3.5 text-left text-[13px] font-medium transition",
        active
          ? "border-[color:color-mix(in_srgb,var(--accent)_40%,white_8%)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-white shadow-[0_12px_24px_rgba(0,0,0,0.16)]"
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
    <div className="rounded-[22px] border border-white/8 bg-white/[0.02] p-3.5 sm:p-4">
      <div className="mb-3 space-y-1">
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
          <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: cardBorder, background: shellBackground }}>
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
                          style={{ backgroundColor: toRgba(theme.primaryColor, 0.18), color: headingColor }}
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
                        className="inline-flex rounded-full px-4 py-2.5 text-sm font-medium shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                        style={{ backgroundColor: theme.primaryColor, color: accentForeground }}
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
          backgroundTitle: "Arka plan stili",
          backgroundDescription: "Profil sayfasının genel atmosferini ve derinliğini belirler.",
          backgroundSolid: "Düz",
          backgroundSoft: "Yumuşak degrade",
          backgroundDeep: "Derin degrade",
          backgroundImage: "Görsel",
          backgroundUploadEmpty: "Arka plan görseli ekleyebilirsin.",
          backgroundUpload: "Görsel yükle",
          backgroundRemove: "Kaldır",
          cardTitle: "Kart ve buton yüzeyi",
          cardDescription: "Kart yüzeyi ve genel yüzey kontrastını seç.",
          typeTitle: "Yazı stili",
          typeDescription: "Başlık ve gövde yazısının birlikte nasıl hissedileceğini seç.",
          fontTitle: "Yazı stili",
          fontDescription: "Başlık ve açıklama dili birlikte değişir.",
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
          backgroundTitle: "Background style",
          backgroundDescription: "Sets the overall atmosphere and depth of the profile page.",
          backgroundSolid: "Solid",
          backgroundSoft: "Soft gradient",
          backgroundDeep: "Deep gradient",
          backgroundImage: "Image",
          backgroundUploadEmpty: "You can add a background image.",
          backgroundUpload: "Upload image",
          backgroundRemove: "Remove",
          cardTitle: "Card and button surface",
          cardDescription: "Choose the overall surface contrast for cards and actions.",
          typeTitle: "Type style",
          typeDescription: "Choose how headings and body copy feel together.",
          fontTitle: "Type style",
          fontDescription: "Headings and supporting copy shift together.",
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
  const currentPrimaryColor = watchedValues.primaryColor ?? theme.primaryColor;
  const currentSecondaryColor = watchedValues.secondaryColor ?? theme.secondaryColor;
  const currentCardColor = watchedValues.cardColor ?? theme.cardColor;
  const currentCardOpacity =
    typeof watchedValues.cardOpacity === "number" ? watchedValues.cardOpacity : theme.cardOpacity;
  const currentThemeMode = watchedValues.themeMode ?? theme.themeMode;
  const currentFontStyle = inferFontStyle(watchedValues.headingFont ?? theme.headingFont);
  const currentBackgroundStyle = inferBackgroundStyle(currentBackgroundType, currentThemeMode);
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
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("mobile");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const moduleItems = useMemo(
    () => [
      { key: "presets" as const, label: copy.presetModule, icon: <Sparkles className="size-3.5" /> },
      { key: "colors" as const, label: copy.colorsModule, icon: <Palette className="size-3.5" /> },
      { key: "background" as const, label: copy.backgroundModule, icon: <ImageIcon className="size-3.5" /> },
      { key: "surfaces" as const, label: copy.surfacesModule, icon: <Layers3 className="size-3.5" /> },
    ],
    [copy.backgroundModule, copy.colorsModule, copy.presetModule, copy.surfacesModule],
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
    if (currentBackgroundType !== "image") {
      form.setValue("gradientStart", mixHex(nextColor, currentCardColor, 0.82), {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("gradientEnd", mixHex(nextColor, currentSecondaryColor, 0.68), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
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
        backgroundImageUrl: watchedValues.backgroundImageUrl || null,
        textColor: derivedColorTokens.text,
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
      currentSecondaryColor,
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
    const defaultTheme = resolveArtistTheme({ presetTheme: "bronze-studio", artistId: artist.profile.id });
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

  const modulePanel =
    activeModule === "presets" ? (
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
    ) : activeModule === "colors" ? (
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
    ) : activeModule === "background" ? (
      <SectionCard title={copy.backgroundModule} description={copy.backgroundDescription} icon={<ImageIcon className="size-4" />}>
        <div className="space-y-4">
          <CustomGroup title={copy.backgroundTitle} description={copy.backgroundDescription}>
            <div className="grid gap-3 md:grid-cols-2">
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
          </CustomGroup>

          <CustomGroup title={copy.backgroundImage}>
            <MediaUploadField
              imageUrl={watchedValues.backgroundImageUrl || ""}
              emptyLabel={copy.backgroundUploadEmpty}
              uploadLabel={copy.backgroundUpload}
              removeLabel={copy.backgroundRemove}
              onUpload={handleBackgroundUpload}
              onRemove={clearBackgroundImage}
            />
          </CustomGroup>
        </div>
      </SectionCard>
    ) : (
      <SectionCard title={copy.surfacesModule} description={copy.cardDescription} icon={<Layers3 className="size-4" />}>
        <div className="space-y-4">
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

          <CustomGroup title={copy.typeTitle} description={copy.typeDescription}>
            <div className="grid gap-3 md:grid-cols-3">
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
                        {locale === "tr" ? "Müşteri ekranına git" : "Open client page"}
                      </p>
                      <p className="text-sm leading-6 text-[var(--text-muted)]" style={{ fontFamily: bodyPreviewFonts[option.value] }}>
                        {locale === "tr" ? "Başlık, açıklama ve kart yazıları birlikte görünür." : "Headings, descriptions, and card copy shift together."}
                      </p>
                    </div>
                  </VisualOptionCard>
                );
              })}
            </div>
          </CustomGroup>
        </div>
      </SectionCard>
    );

  return (
    <div className="space-y-4">
      {flashMessage ? (
        <div className="fixed right-4 top-4 z-30 rounded-full border border-white/10 bg-[rgba(12,12,14,0.94)] px-4 py-2 text-sm text-white shadow-[0_18px_38px_rgba(0,0,0,0.28)]">
          {flashMessage}
        </div>
      ) : null}

      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault();
          if (event.key === "Escape") {
            event.preventDefault();
            resetThemeToCurrent();
          }
        }}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">{copy.eyebrow}</p>
              <div className="space-y-1.5">
                <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{copy.title}</h1>
                <p className="max-w-[640px] text-[14px] leading-6 text-[var(--foreground-muted)]">{copy.description}</p>
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
              <Button type="button" variant="ghost" className="h-10 px-4" onClick={resetThemeToDefault}>
                {copy.resetDefaults}
              </Button>
              <Button type="submit" className="h-10 px-4" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
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

          <div className="grid gap-4 xl:hidden">
            <div className="grid grid-cols-2 gap-2">
              {moduleItems.map((item) => (
                <ModuleNavItem key={item.key} active={activeModule === item.key} label={item.label} icon={item.icon} onClick={() => setActiveModule(item.key)} />
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

          <div className="hidden xl:grid xl:grid-cols-[220px_minmax(460px,1fr)_minmax(360px,420px)] xl:items-start xl:gap-5 2xl:grid-cols-[220px_minmax(460px,1fr)_520px]">
            <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_94%,black_6%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-[1rem] tracking-[-0.02em]">{copy.moduleMenuTitle}</CardTitle>
                <CardDescription>{copy.moduleMenuDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {moduleItems.map((item) => (
                  <ModuleNavItem key={item.key} active={activeModule === item.key} label={item.label} icon={item.icon} onClick={() => setActiveModule(item.key)} />
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {modulePanel}
              {form.formState.errors.root?.message ? (
                <div className="rounded-[22px] border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                  {form.formState.errors.root.message}
                </div>
              ) : null}
            </div>

            <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.18)] xl:sticky xl:top-5">
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
