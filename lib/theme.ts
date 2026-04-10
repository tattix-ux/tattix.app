import type { CSSProperties } from "react";

import {
  themePresets,
  type BackgroundType,
  type BodyFontKey,
  type FontPairingPreset,
  type HeadingFontKey,
  type RadiusStyle,
  type ThemeMode,
  type ThemePresetKey,
} from "@/lib/constants/theme";
import type { ArtistPageTheme } from "@/lib/types";

const headingFontStacks: Record<HeadingFontKey, string> = {
  "display-serif": '"Iowan Old Style", "Palatino Linotype", serif',
  "modern-sans": '"Avenir Next", "Helvetica Neue", sans-serif',
  "gothic-sans": '"Arial Narrow", "Helvetica Neue", sans-serif',
  "editorial-serif": '"Baskerville", "Times New Roman", serif',
  "mono-display": '"SFMono-Regular", "Menlo", monospace',
};

const bodyFontStacks: Record<BodyFontKey, string> = {
  "clean-sans": '"Avenir Next", "Segoe UI", sans-serif',
  "neutral-sans": '"Trebuchet MS", "Segoe UI", sans-serif',
  "editorial-sans": '"Gill Sans", "Segoe UI", sans-serif',
  "mono-body": '"SFMono-Regular", "Consolas", monospace',
};

const fontPairings: Record<
  FontPairingPreset,
  { headingFont: HeadingFontKey; bodyFont: BodyFontKey }
> = {
  "bold-modern": { headingFont: "modern-sans", bodyFont: "clean-sans" },
  "elegant-editorial": { headingFont: "editorial-serif", bodyFont: "editorial-sans" },
  "minimal-sans": { headingFont: "modern-sans", bodyFont: "neutral-sans" },
  "edgy-clean": { headingFont: "gothic-sans", bodyFont: "clean-sans" },
  "premium-editorial": { headingFont: "display-serif", bodyFont: "clean-sans" },
};

const radiusMap: Record<RadiusStyle, string> = {
  small: "18px",
  medium: "24px",
  large: "32px",
};

function normalizeHex(color: string | null | undefined, fallback: string) {
  if (!color) {
    return fallback;
  }

  const trimmed = color.trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed) ? trimmed : fallback;
}

function hexToRgb(hex: string) {
  const raw = hex.replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((char) => char + char)
          .join("")
      : raw;

  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground: string, background: string) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function readableForeground(background: string, preferredDark: string, preferredLight: string) {
  return contrastRatio(preferredDark, background) >= contrastRatio(preferredLight, background)
    ? preferredDark
    : preferredLight;
}

function enforceReadableForeground(
  background: string,
  preferredDark: string,
  preferredLight: string,
  minimumRatio = 7,
) {
  const candidate = readableForeground(background, preferredDark, preferredLight);

  if (contrastRatio(candidate, background) >= minimumRatio) {
    return candidate;
  }

  return contrastRatio("#111111", background) >= contrastRatio("#ffffff", background)
    ? "#111111"
    : "#ffffff";
}

export function buildDefaultArtistTheme(): ArtistPageTheme {
  const presetKey: ThemePresetKey = "dark-minimal";
  const preset = themePresets[presetKey];

  return {
    artistId: "",
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
    customWelcomeTitle: null,
    customIntroText: null,
    customCtaLabel: null,
    featuredSectionLabel1: null,
    featuredSectionLabel2: null,
  };
}

export function resolveArtistTheme(theme?: Partial<ArtistPageTheme> | null): ArtistPageTheme {
  const base = buildDefaultArtistTheme();
  const presetKey = (theme?.presetTheme as ThemePresetKey | undefined) ?? base.presetTheme;
  const preset = themePresets[presetKey] ?? themePresets["dark-minimal"];
  const pairing =
    fontPairings[(theme?.fontPairingPreset as FontPairingPreset | undefined) ?? preset.fontPairingPreset] ??
    fontPairings[preset.fontPairingPreset];

  return {
    ...base,
    ...theme,
    presetTheme: presetKey,
    backgroundType:
      (theme?.backgroundType as BackgroundType | undefined) ?? preset.backgroundType,
    backgroundColor: normalizeHex(theme?.backgroundColor, preset.backgroundColor),
    gradientStart: normalizeHex(theme?.gradientStart, preset.gradientStart),
    gradientEnd: normalizeHex(theme?.gradientEnd, preset.gradientEnd),
    primaryColor: normalizeHex(theme?.primaryColor, preset.primaryColor),
    secondaryColor: normalizeHex(theme?.secondaryColor, preset.secondaryColor),
    cardColor: normalizeHex(theme?.cardColor, preset.cardColor),
    cardOpacity:
      typeof theme?.cardOpacity === "number"
        ? Math.min(Math.max(theme.cardOpacity, 0.45), 0.98)
        : preset.cardOpacity,
    headingFont:
      (theme?.headingFont as HeadingFontKey | undefined) ??
      pairing.headingFont ??
      preset.headingFont,
    bodyFont:
      (theme?.bodyFont as BodyFontKey | undefined) ?? pairing.bodyFont ?? preset.bodyFont,
    fontPairingPreset:
      (theme?.fontPairingPreset as FontPairingPreset | undefined) ?? preset.fontPairingPreset,
    radiusStyle:
      (theme?.radiusStyle as RadiusStyle | undefined) ?? preset.radiusStyle,
    themeMode: (theme?.themeMode as ThemeMode | undefined) ?? preset.themeMode,
    customWelcomeTitle: theme?.customWelcomeTitle ?? null,
    customIntroText: theme?.customIntroText ?? null,
    customCtaLabel: theme?.customCtaLabel ?? null,
    featuredSectionLabel1: theme?.featuredSectionLabel1 ?? null,
    featuredSectionLabel2: theme?.featuredSectionLabel2 ?? null,
    backgroundImageUrl: theme?.backgroundImageUrl ?? null,
    artistId: theme?.artistId ?? "",
  };
}

export function buildThemeStyles(themeInput?: Partial<ArtistPageTheme> | null) {
  const theme = resolveArtistTheme(themeInput);
  const text = enforceReadableForeground(theme.backgroundColor, "#111111", "#f8f5ef");
  const muted = enforceReadableForeground(theme.backgroundColor, "#4f4a44", "#c8c0b5", 4.5);
  const primaryForeground = enforceReadableForeground(theme.primaryColor, "#111111", "#ffffff");
  const secondaryForeground = enforceReadableForeground(
    theme.secondaryColor,
    "#111111",
    "#ffffff",
  );
  const cardText = enforceReadableForeground(theme.cardColor, "#111111", "#ffffff", 7);
  const cardMuted = enforceReadableForeground(theme.cardColor, "#4f4a44", "#d4ccc2", 4.5);
  const borderColor =
    theme.themeMode === "light" ? "rgba(17,17,17,0.12)" : "rgba(255,255,255,0.10)";

  const backgroundImage =
    theme.backgroundType === "image" && theme.backgroundImageUrl
      ? `linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.62)), url(${theme.backgroundImageUrl})`
      : theme.backgroundType === "gradient"
        ? `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`
        : theme.backgroundColor;

  const wrapperStyle = {
    background: backgroundImage,
    color: text,
    fontFamily: bodyFontStacks[theme.bodyFont],
    "--artist-background": theme.backgroundColor,
    "--artist-foreground": text,
    "--artist-muted": muted,
    "--artist-card-text": cardText,
    "--artist-card-muted": cardMuted,
    "--artist-primary": theme.primaryColor,
    "--artist-primary-foreground": primaryForeground,
    "--artist-secondary": theme.secondaryColor,
    "--artist-secondary-foreground": secondaryForeground,
    "--artist-card": theme.cardColor,
    "--artist-card-alpha": String(theme.cardOpacity),
    "--artist-border": borderColor,
    "--artist-radius": radiusMap[theme.radiusStyle],
    "--artist-heading-font": headingFontStacks[theme.headingFont],
  } as CSSProperties;

  return {
    theme,
    wrapperStyle,
    tokens: {
      text,
      muted,
      primaryForeground,
      secondaryForeground,
      cardText,
      cardMuted,
      borderColor,
      radiusClass:
        theme.radiusStyle === "small"
          ? "rounded-[20px]"
          : theme.radiusStyle === "medium"
            ? "rounded-[26px]"
            : "rounded-[32px]",
    },
  };
}
