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
  inter: 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
  manrope: 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
  "dm-sans": 'var(--font-dm-sans), "DM Sans", "Segoe UI", sans-serif',
  "general-sans": 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
  satoshi: 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
};

const bodyFontStacks: Record<BodyFontKey, string> = {
  inter: 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
  manrope: 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
  "dm-sans": 'var(--font-dm-sans), "DM Sans", "Segoe UI", sans-serif',
  "general-sans": 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
  satoshi: 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
};

const fontPairings: Record<
  FontPairingPreset,
  { headingFont: HeadingFontKey; bodyFont: BodyFontKey }
> = {
  "inter-balanced": { headingFont: "inter", bodyFont: "inter" },
  "manrope-refined": { headingFont: "manrope", bodyFont: "inter" },
  "dm-sans-editorial": { headingFont: "dm-sans", bodyFont: "inter" },
  "manrope-impact": { headingFont: "manrope", bodyFont: "dm-sans" },
  "general-clean": { headingFont: "general-sans", bodyFont: "inter" },
  "satoshi-neutral": { headingFont: "satoshi", bodyFont: "inter" },
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

function mixHex(colorA: string, colorB: string, weightA = 0.68) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const ratioA = Math.min(Math.max(weightA, 0), 1);
  const ratioB = 1 - ratioA;

  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  const r = Math.round(a.r * ratioA + b.r * ratioB);
  const g = Math.round(a.g * ratioA + b.g * ratioB);
  const bValue = Math.round(a.b * ratioA + b.b * ratioB);

  return `#${toHex(r)}${toHex(g)}${toHex(bValue)}`;
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
  const presetKey: ThemePresetKey = "dark-studio";
  const preset = themePresets[presetKey];

  return {
    artistId: "",
    presetTheme: presetKey,
    backgroundType: preset.backgroundType,
    backgroundColor: preset.backgroundColor,
    gradientStart: preset.gradientStart,
    gradientEnd: preset.gradientEnd,
    backgroundImageUrl: null,
    textColor: preset.textColor,
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

const legacyPresetMap: Record<string, ThemePresetKey> = {
  "dark-minimal": "dark-studio",
  "gothic-black": "dark-studio",
  "soft-neutral": "soft-minimal",
  "luxury-serif": "monochrome-luxury",
  "neon-accent": "bold-contrast",
};

const legacyHeadingFontMap: Record<string, HeadingFontKey> = {
  "display-serif": "manrope",
  "modern-sans": "inter",
  "gothic-sans": "manrope",
  "editorial-serif": "dm-sans",
  "mono-display": "inter",
};

const legacyBodyFontMap: Record<string, BodyFontKey> = {
  "clean-sans": "inter",
  "neutral-sans": "manrope",
  "editorial-sans": "dm-sans",
  "mono-body": "inter",
};

const legacyFontPairingMap: Record<string, FontPairingPreset> = {
  "bold-modern": "inter-balanced",
  "elegant-editorial": "dm-sans-editorial",
  "minimal-sans": "inter-balanced",
  "edgy-clean": "manrope-impact",
  "premium-editorial": "satoshi-neutral",
};

export function resolveArtistTheme(theme?: Partial<ArtistPageTheme> | null): ArtistPageTheme {
  const base = buildDefaultArtistTheme();
  const rawPreset = typeof theme?.presetTheme === "string" ? theme.presetTheme : undefined;
  let presetKey: ThemePresetKey = base.presetTheme;
  if (rawPreset) {
    presetKey = (themePresets as Record<string, unknown>)[rawPreset]
      ? (rawPreset as ThemePresetKey)
      : (legacyPresetMap[rawPreset] ?? base.presetTheme);
  }
  const preset = themePresets[presetKey] ?? themePresets["dark-studio"];
  const rawPairing = typeof theme?.fontPairingPreset === "string" ? theme.fontPairingPreset : undefined;
  let resolvedPairingKey: FontPairingPreset = preset.fontPairingPreset;
  if (rawPairing) {
    resolvedPairingKey = (fontPairings as Record<string, unknown>)[rawPairing]
      ? (rawPairing as FontPairingPreset)
      : (legacyFontPairingMap[rawPairing] ?? preset.fontPairingPreset);
  }
  const pairing =
    fontPairings[resolvedPairingKey] ??
    fontPairings[preset.fontPairingPreset];
  const rawHeading = typeof theme?.headingFont === "string" ? theme.headingFont : undefined;
  let resolvedHeading: HeadingFontKey = pairing.headingFont ?? preset.headingFont;
  if (rawHeading) {
    resolvedHeading = (headingFontStacks as Record<string, unknown>)[rawHeading]
      ? (rawHeading as HeadingFontKey)
      : (legacyHeadingFontMap[rawHeading] ?? resolvedHeading);
  }
  const rawBody = typeof theme?.bodyFont === "string" ? theme.bodyFont : undefined;
  let resolvedBody: BodyFontKey = pairing.bodyFont ?? preset.bodyFont;
  if (rawBody) {
    resolvedBody = (bodyFontStacks as Record<string, unknown>)[rawBody]
      ? (rawBody as BodyFontKey)
      : (legacyBodyFontMap[rawBody] ?? resolvedBody);
  }

  return {
    ...base,
    ...theme,
    presetTheme: presetKey,
    backgroundType:
      (theme?.backgroundType as BackgroundType | undefined) ?? preset.backgroundType,
    backgroundColor: normalizeHex(theme?.backgroundColor, preset.backgroundColor),
    gradientStart: normalizeHex(theme?.gradientStart, preset.gradientStart),
    gradientEnd: normalizeHex(theme?.gradientEnd, preset.gradientEnd),
    textColor: normalizeHex(theme?.textColor, preset.textColor),
    primaryColor: normalizeHex(theme?.primaryColor, preset.primaryColor),
    secondaryColor: normalizeHex(theme?.secondaryColor, preset.secondaryColor),
    cardColor: normalizeHex(theme?.cardColor, preset.cardColor),
    cardOpacity:
      typeof theme?.cardOpacity === "number"
        ? Math.min(Math.max(theme.cardOpacity, 0.45), 0.98)
        : preset.cardOpacity,
    headingFont: resolvedHeading,
    bodyFont: resolvedBody,
    fontPairingPreset: resolvedPairingKey,
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
  const text = enforceReadableForeground(
    theme.backgroundColor,
    normalizeHex(theme.textColor, theme.themeMode === "light" ? "#1f1814" : "#f8f5ef"),
    theme.themeMode === "light" ? "#111111" : "#f8f5ef",
  );
  const muted = enforceReadableForeground(
    theme.backgroundColor,
    mixHex(text, theme.backgroundColor, 0.58),
    theme.themeMode === "light" ? "#5b5147" : "#c8c0b5",
    4.5,
  );
  const primaryForeground = enforceReadableForeground(theme.primaryColor, "#111111", "#ffffff");
  const secondaryForeground = enforceReadableForeground(
    theme.secondaryColor,
    "#111111",
    "#ffffff",
  );
  const cardText = enforceReadableForeground(
    theme.cardColor,
    text,
    theme.themeMode === "light" ? "#111111" : "#ffffff",
    7,
  );
  const cardMuted = enforceReadableForeground(
    theme.cardColor,
    mixHex(cardText, theme.cardColor, 0.58),
    theme.themeMode === "light" ? "#5b5147" : "#d4ccc2",
    4.5,
  );
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
    "--accent": theme.primaryColor,
    "--accent-soft": theme.themeMode === "light" ? theme.primaryColor : theme.primaryColor,
    "--accent-foreground": primaryForeground,
    "--foreground-muted": muted,
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
    "--artist-body-font": bodyFontStacks[theme.bodyFont],
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
