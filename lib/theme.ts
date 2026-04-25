import type { CSSProperties } from "react";

import {
  type BadgeStyle,
  themePresets,
  type BackgroundType,
  type BackgroundImageFocus,
  type BackgroundImageSoftness,
  type BackgroundOverlayStrength,
  type ButtonStyle,
  type BodyFontKey,
  type CardFeel,
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
  "playfair-display": 'var(--font-playfair-display), "Playfair Display", serif',
  "space-grotesk": 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
  "source-sans-3": 'var(--font-source-sans-3), "Source Sans 3", sans-serif',
  "cormorant-garamond": 'var(--font-cormorant-garamond), "Cormorant Garamond", serif',
  "libre-baskerville": 'var(--font-libre-baskerville), "Libre Baskerville", serif',
  "plus-jakarta-sans": 'var(--font-plus-jakarta-sans), "Plus Jakarta Sans", sans-serif',
  poppins: 'var(--font-poppins), "Poppins", sans-serif',
};

const bodyFontStacks: Record<BodyFontKey, string> = {
  inter: 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
  manrope: 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
  "dm-sans": 'var(--font-dm-sans), "DM Sans", sans-serif',
  "source-sans-3": 'var(--font-source-sans-3), "Source Sans 3", sans-serif',
  "courier-prime": 'var(--font-courier-prime), "Courier Prime", monospace',
};

const fontPairings: Record<
  FontPairingPreset,
  { headingFont: HeadingFontKey; bodyFont: BodyFontKey }
> = {
  "obsidian-editorial": { headingFont: "playfair-display", bodyFont: "inter" },
  "soft-graphite-neutral": { headingFont: "manrope", bodyFont: "inter" },
  "midnight-neon-tech": { headingFont: "space-grotesk", bodyFont: "dm-sans" },
  "ivory-editorial": { headingFont: "playfair-display", bodyFont: "source-sans-3" },
  "muted-sand-warm": { headingFont: "cormorant-garamond", bodyFont: "inter" },
  "deep-forest-classic": { headingFont: "libre-baskerville", bodyFont: "source-sans-3" },
  "royal-indigo-modern": { headingFont: "plus-jakarta-sans", bodyFont: "inter" },
  "clean-slate-neutral": { headingFont: "inter", bodyFont: "inter" },
  "sunset-copper-vivid": { headingFont: "poppins", bodyFont: "dm-sans" },
  "cyber-mint-tech": { headingFont: "space-grotesk", bodyFont: "inter" },
};

const radiusMap: Record<RadiusStyle, string> = {
  small: "12px",
  medium: "18px",
  large: "26px",
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

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: lightness };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
  }

  return { h: hue * 60, s: saturation, l: lightness };
}

function hueDistance(a: string, b: string) {
  const firstRgb = hexToRgb(a);
  const secondRgb = hexToRgb(b);
  const first = rgbToHsl(firstRgb.r, firstRgb.g, firstRgb.b);
  const second = rgbToHsl(secondRgb.r, secondRgb.g, secondRgb.b);
  const diff = Math.abs(first.h - second.h);
  return Math.min(diff, 360 - diff);
}

function clampChannel(value: number, min = 8, max = 18) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function toRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const safeTextTones = ["#F5F1EA", "#F3F2EE", "#F5F3FF", "#FAFAF9", "#EFF4FA"] as const;
const darkButtonTextCandidates = ["#181411", "#111111", "#0F1720"] as const;
const lightButtonTextCandidates = ["#F8F5FF", "#F5F1EA", "#F7F7F5"] as const;

function pickReadableTextTone(background: string, surface: string) {
  const scored = safeTextTones
    .map((candidate) => {
      const backgroundContrast = contrastRatio(candidate, background);
      const surfaceContrast = contrastRatio(candidate, surface);
      const minimumContrast = Math.min(backgroundContrast, surfaceContrast);
      const hueAffinity = 360 - hueDistance(candidate, background);

      return {
        candidate,
        minimumContrast,
        score: minimumContrast * 100 + hueAffinity * 0.12,
      };
    })
    .sort((left, right) => right.score - left.score);

  return scored[0] && scored[0].minimumContrast >= 7 ? scored[0].candidate : "#F7F7F5";
}

function buildMutedTone(text: string, background: string, surface: string) {
  const ratios = [0.7, 0.64, 0.6, 0.56, 0.52];

  for (const ratio of ratios) {
    const candidate = mixHex(text, background, ratio);
    if (contrastRatio(candidate, background) >= 4.5 && contrastRatio(candidate, surface) >= 4.2) {
      return candidate;
    }
  }

  return mixHex(text, background, 0.76);
}

function pickButtonText(primary: string) {
  const primaryLightness = relativeLuminance(primary);
  const candidates = primaryLightness > 0.34 ? darkButtonTextCandidates : lightButtonTextCandidates;

  return [...candidates]
    .map((candidate) => ({
      candidate,
      contrast: contrastRatio(candidate, primary),
    }))
    .sort((left, right) => right.contrast - left.contrast)[0]?.candidate ?? "#111111";
}

function buildBorderColor(surface: string, background: string, text: string) {
  const base = mixHex(surface, text, 0.82);
  if (contrastRatio(base, surface) >= 1.28 && contrastRatio(base, background) >= 1.18) {
    return base;
  }

  return mixHex(surface, text, 0.74);
}

function buildOverlay(background: string, surface: string) {
  const backgroundRgb = hexToRgb(background);
  const surfaceRgb = hexToRgb(surface);
  const luminance = Math.max(relativeLuminance(background), relativeLuminance(surface));
  const alpha = luminance > 0.1 ? 0.58 : luminance > 0.06 ? 0.54 : 0.5;

  return `rgba(${clampChannel((backgroundRgb.r + surfaceRgb.r) / 2)}, ${clampChannel((backgroundRgb.g + surfaceRgb.g) / 2)}, ${clampChannel((backgroundRgb.b + surfaceRgb.b) / 2)}, ${alpha})`;
}

function buildSoftAccent(primary: string, surface: string) {
  return mixHex(primary, surface, 0.42);
}

function buildChipColors(primary: string, secondary: string, surface: string) {
  const chipBackgroundHex = mixHex(primary, surface, 0.62);
  const candidates = [primary, secondary, "#FFFFFF", "#F5F1EA", "#111111"];
  const chipText =
    candidates
      .map((candidate) => ({
        candidate,
        contrast: contrastRatio(candidate, chipBackgroundHex),
      }))
      .sort((left, right) => right.contrast - left.contrast)[0]?.candidate ?? "#F5F1EA";

  return {
    chipBackground: toRgba(chipBackgroundHex, 0.92),
    chipText,
  };
}

function buildSubtleChipColors(text: string, mutedText: string, surface: string) {
  const chipSurfaceHex = mixHex(surface, text, 0.9);
  return {
    chipBackground: toRgba(chipSurfaceHex, 0.34),
    chipText: contrastRatio(mutedText, chipSurfaceHex) >= 4.2 ? mutedText : text,
  };
}

function buildButtonTokens(input: {
  primary: string;
  primaryForeground: string;
  text: string;
  card: string;
  border: string;
  softAccent: string;
  buttonStyle: ButtonStyle;
}) {
  if (input.buttonStyle === "soft") {
    return {
      primaryBackground: toRgba(input.primary, 0.2),
      primaryBorder: toRgba(input.primary, 0.28),
      primaryText: input.text,
      secondaryBackground: toRgba(input.card, 0.76),
      secondaryBorder: input.border,
      secondaryText: input.text,
    };
  }

  if (input.buttonStyle === "outline") {
    return {
      primaryBackground: toRgba(input.primary, 0.05),
      primaryBorder: toRgba(input.primary, 0.48),
      primaryText: input.text,
      secondaryBackground: "transparent",
      secondaryBorder: input.border,
      secondaryText: input.text,
    };
  }

  return {
    primaryBackground: input.primary,
    primaryBorder: toRgba(input.primary, 0.26),
    primaryText: input.primaryForeground,
    secondaryBackground: toRgba(input.card, 0.78),
    secondaryBorder: input.border,
    secondaryText: input.text,
  };
}

function buildCardFeelTokens(input: {
  cardFeel: CardFeel;
  backgroundColor: string;
  cardColor: string;
  text: string;
  border: string;
  primary: string;
}) {
  if (input.cardFeel === "subtle") {
    return {
      borderColor: mixHex(input.border, input.cardColor, 0.28),
      cardShadow: "0 12px 24px rgba(0,0,0,0.14)",
      selectedSurface: `linear-gradient(180deg, ${toRgba(input.primary, 0.18)}, ${toRgba(input.primary, 0.1)})`,
      selectedBorder: toRgba(input.primary, 0.38),
    };
  }

  if (input.cardFeel === "defined") {
    return {
      borderColor: mixHex(input.border, input.text, 0.74),
      cardShadow: "0 24px 54px rgba(0,0,0,0.28)",
      selectedSurface: `linear-gradient(180deg, ${toRgba(input.primary, 0.24)}, ${toRgba(input.primary, 0.14)})`,
      selectedBorder: toRgba(input.primary, 0.48),
    };
  }

  return {
    borderColor: input.border,
    cardShadow: "0 18px 38px rgba(0,0,0,0.2)",
    selectedSurface: `linear-gradient(180deg, ${toRgba(input.primary, 0.2)}, ${toRgba(input.primary, 0.12)})`,
    selectedBorder: toRgba(input.primary, 0.42),
  };
}

export function deriveThemeColorTokens(input: {
  backgroundColor: string;
  cardColor: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  const text = pickReadableTextTone(input.backgroundColor, input.cardColor);
  const mutedText = buildMutedTone(text, input.backgroundColor, input.cardColor);
  const buttonText = pickButtonText(input.primaryColor);
  const border = buildBorderColor(input.cardColor, input.backgroundColor, text);
  const overlay = buildOverlay(input.backgroundColor, input.cardColor);
  const softAccent = buildSoftAccent(input.primaryColor, input.cardColor);
  const { chipBackground, chipText } = buildChipColors(input.primaryColor, input.secondaryColor, input.cardColor);

  return {
    text,
    mutedText,
    buttonText,
    border,
    overlay,
    softAccent,
    chipBackground,
    chipText,
  };
}

export function buildDefaultArtistTheme(): ArtistPageTheme {
  const presetKey: ThemePresetKey = "obsidian-bronze";
  const preset = themePresets[presetKey];

  return {
    artistId: "",
    presetTheme: presetKey,
    backgroundType: preset.backgroundType,
    backgroundColor: preset.backgroundColor,
    gradientStart: preset.gradientStart,
    gradientEnd: preset.gradientEnd,
    backgroundImageUrl: null,
    backgroundOverlayStrength: "balanced",
    backgroundImageSoftness: "soft",
    backgroundImageFocus: "center",
    textColor: preset.textColor,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    cardColor: preset.cardColor,
    cardOpacity: preset.cardOpacity,
    cardFeel: "balanced",
    buttonStyle: "filled",
    badgeStyle: "colored",
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
  "soft-minimal": "muted-sand",
  "dark-studio": "obsidian-bronze",
  "editorial-clean": "ivory-ink",
  "bold-contrast": "midnight-neon",
  "natural-stone": "muted-sand",
  "monochrome-luxury": "soft-graphite",
  "dark-minimal": "soft-graphite",
  "gothic-black": "obsidian-bronze",
  "soft-neutral": "clean-slate",
  "luxury-serif": "obsidian-bronze",
  "neon-accent": "midnight-neon",
  "soft-editorial": "ivory-ink",
  "warm-studio": "obsidian-bronze",
  "graphite-pro": "soft-graphite",
  "night-luxury": "royal-indigo",
  "studio-light": "ivory-ink",
  "warm-canvas": "muted-sand",
  "midnight-ink": "royal-indigo",
  "bronze-studio": "obsidian-bronze",
  "smoke-metal": "soft-graphite",
  "dark-alloy": "royal-indigo",
  "velvet-sable": "obsidian-bronze",
  "cathedral-ash": "deep-forest",
  "astral-forge": "cyber-mint",
};

const legacyHeadingFontMap: Record<string, HeadingFontKey> = {
  "display-serif": "manrope",
  "modern-sans": "inter",
  "gothic-sans": "manrope",
  "editorial-serif": "playfair-display",
  "mono-display": "inter",
  satoshi: "manrope",
  "dm-sans": "space-grotesk",
  "general-sans": "plus-jakarta-sans",
};

const legacyBodyFontMap: Record<string, BodyFontKey> = {
  "clean-sans": "inter",
  "neutral-sans": "manrope",
  "editorial-sans": "source-sans-3",
  "mono-body": "inter",
  satoshi: "inter",
  "dm-sans": "dm-sans",
  "general-sans": "inter",
};

const legacyFontPairingMap: Record<string, FontPairingPreset> = {
  "elegant-editorial": "obsidian-editorial",
  "bold-modern": "clean-slate-neutral",
  "minimal-sans": "clean-slate-neutral",
  "edgy-clean": "soft-graphite-neutral",
  "premium-editorial": "obsidian-editorial",
  "inter-balanced": "clean-slate-neutral",
  "manrope-refined": "soft-graphite-neutral",
  "manrope-impact": "soft-graphite-neutral",
  "general-clean": "royal-indigo-modern",
  "satoshi-neutral": "soft-graphite-neutral",
  "dm-sans-editorial": "sunset-copper-vivid",
  "general-sans-soft": "royal-indigo-modern",
  "inter-compact": "clean-slate-neutral",
  "manrope-display": "soft-graphite-neutral",
};

function buildThemeRecipe(preset: (typeof themePresets)[ThemePresetKey]) {
  const isDark = preset.themeMode === "dark";
  const surface = preset.cardColor;
  const background = preset.backgroundColor;
  const primary = preset.primaryColor;
  const secondary = preset.secondaryColor;
  const text = preset.textColor;

  return {
    shellGlow: `radial-gradient(circle_at_top_left, ${toRgba(primary, isDark ? 0.12 : 0.08)}, transparent 28%), radial-gradient(circle_at_82%_16%, ${toRgba(secondary, isDark ? 0.1 : 0.06)}, transparent 24%)`,
    shellVeil: isDark
      ? `linear-gradient(180deg, rgba(255,255,255,0.024), transparent 18%, transparent 84%, ${toRgba(primary, 0.04)})`
      : `linear-gradient(180deg, rgba(255,255,255,0.48), rgba(255,255,255,0.06) 18%, transparent 74%, ${toRgba(primary, 0.04)})`,
    pageTexture: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.72)",
    cardShadow: isDark ? "0 18px 40px rgba(0,0,0,0.24)" : "0 14px 28px rgba(15,23,42,0.08)",
    railSurface: toRgba(surface, isDark ? 0.88 : 0.9),
    flowSurface: toRgba(background, isDark ? 0.96 : 0.94),
    sectionSurface: toRgba(surface, isDark ? 0.92 : 0.94),
    sectionSurfaceStrong: toRgba(surface, isDark ? 0.96 : 0.98),
    selectedSurface: `linear-gradient(180deg, ${toRgba(primary, isDark ? 0.18 : 0.12)}, ${toRgba(secondary, isDark ? 0.11 : 0.08)})`,
    selectedBorder: toRgba(primary, isDark ? 0.3 : 0.24),
    inputSurface: toRgba(surface, isDark ? 0.98 : 0.94),
    inputBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    inputFocusSurface: toRgba(surface, isDark ? 1 : 0.98),
    chipSurface: toRgba(primary, isDark ? 0.14 : 0.1),
    chipText: isDark ? text : primary,
    divider: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)",
    secondaryButtonSurface: toRgba(surface, isDark ? 0.9 : 0.94),
    secondaryButtonBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    buttonShadow: isDark ? `0 8px 20px ${toRgba(primary, 0.16)}` : "0 8px 18px rgba(15,23,42,0.08)",
    buttonRadius: "999px",
    fieldRadius: "18px",
    cardRadius: "24px",
    densityGap: isDark ? "0.9" : "0.92",
    headingScale: "0.96",
  };
}

export function resolveArtistTheme(theme?: Partial<ArtistPageTheme> | null): ArtistPageTheme {
  const base = buildDefaultArtistTheme();
  const rawPreset = typeof theme?.presetTheme === "string" ? theme.presetTheme : undefined;
  let presetKey: ThemePresetKey = base.presetTheme;
  if (rawPreset) {
    presetKey = (themePresets as Record<string, unknown>)[rawPreset]
      ? (rawPreset as ThemePresetKey)
      : (legacyPresetMap[rawPreset] ?? base.presetTheme);
  }
  const preset = themePresets[presetKey] ?? themePresets["obsidian-bronze"];
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
    backgroundOverlayStrength:
      (theme?.backgroundOverlayStrength as BackgroundOverlayStrength | undefined) ?? base.backgroundOverlayStrength,
    backgroundImageSoftness:
      (theme?.backgroundImageSoftness as BackgroundImageSoftness | undefined) ?? base.backgroundImageSoftness,
    backgroundImageFocus:
      (theme?.backgroundImageFocus as BackgroundImageFocus | undefined) ?? base.backgroundImageFocus,
    cardOpacity:
      typeof theme?.cardOpacity === "number"
        ? Math.min(Math.max(theme.cardOpacity, 0.45), 0.98)
        : preset.cardOpacity,
    cardFeel: (theme?.cardFeel as CardFeel | undefined) ?? base.cardFeel,
    buttonStyle: (theme?.buttonStyle as ButtonStyle | undefined) ?? base.buttonStyle,
    badgeStyle: (theme?.badgeStyle as BadgeStyle | undefined) ?? base.badgeStyle,
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
  const preset = themePresets[theme.presetTheme as ThemePresetKey] ?? themePresets["obsidian-bronze"];
  const usesPresetPrimary = theme.primaryColor.toLowerCase() === preset.primaryColor.toLowerCase();
  const usesPresetBackground = theme.backgroundColor.toLowerCase() === preset.backgroundColor.toLowerCase();
  const usesPresetCard = theme.cardColor.toLowerCase() === preset.cardColor.toLowerCase();
  const derived = deriveThemeColorTokens({
    backgroundColor: theme.backgroundColor,
    cardColor: theme.cardColor,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
  });
  const text = usesPresetBackground ? preset.textColor : derived.text;
  const muted = usesPresetBackground ? preset.mutedText : derived.mutedText;
  const primaryForeground = usesPresetPrimary ? preset.buttonText : derived.buttonText;
  const secondaryForeground = enforceReadableForeground(
    theme.secondaryColor,
    "#111111",
    "#ffffff",
  );
  const cardText = enforceReadableForeground(
    theme.cardColor,
    text,
    "#F0E7DC",
    7,
  );
  const cardMuted = usesPresetCard ? preset.mutedText : derived.mutedText;
  const baseBorderColor = usesPresetCard ? preset.border : derived.border;

  const overlayAlphaMap: Record<BackgroundOverlayStrength, number> = {
    light: 0.34,
    balanced: 0.48,
    strong: 0.58,
    "extra-strong": 0.68,
  };
  const blurMap: Record<BackgroundImageSoftness, number> = {
    sharp: 0,
    soft: 6,
    softer: 12,
  };
  const positionMap: Record<BackgroundImageFocus, string> = {
    center: "center center",
    top: "center top",
    left: "left center",
    right: "right center",
  };
  const selectedOverlayAlpha = overlayAlphaMap[theme.backgroundOverlayStrength];
  const overlayColor = `rgba(10, 10, 12, ${selectedOverlayAlpha})`;
  const overlayEndAlpha = Math.min(selectedOverlayAlpha + 0.16, 0.82);
  const backgroundBase =
    theme.backgroundType === "gradient"
      ? `linear-gradient(145deg, ${theme.gradientStart}, ${theme.gradientEnd})`
      : theme.backgroundColor;
  const backgroundImage = backgroundBase;
  const recipe = buildThemeRecipe(preset);
  const cardFeelTokens = buildCardFeelTokens({
    cardFeel: theme.cardFeel,
    backgroundColor: theme.backgroundColor,
    cardColor: theme.cardColor,
    text: cardText,
    border: baseBorderColor,
    primary: theme.primaryColor,
  });
  const buttonTokens = buildButtonTokens({
    primary: theme.primaryColor,
    primaryForeground,
    text: cardText,
    card: theme.cardColor,
    border: cardFeelTokens.borderColor,
    softAccent: derived.softAccent,
    buttonStyle: theme.buttonStyle,
  });
  const chipTokens =
    theme.badgeStyle === "subtle"
      ? buildSubtleChipColors(cardText, cardMuted, theme.cardColor)
      : {
          chipBackground: usesPresetPrimary ? recipe.chipSurface : derived.chipBackground,
          chipText: usesPresetPrimary ? recipe.chipText : derived.chipText,
        };

  const wrapperStyle = {
    background: backgroundImage,
    color: text,
    fontFamily: bodyFontStacks[theme.bodyFont],
    "--accent": theme.primaryColor,
    "--accent-soft": derived.softAccent,
    "--accent-foreground": primaryForeground,
    "--foreground-muted": muted,
    "--artist-background": theme.backgroundColor,
    "--artist-background-base": backgroundBase,
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
    "--artist-border": cardFeelTokens.borderColor,
    "--artist-radius": radiusMap[theme.radiusStyle],
    "--artist-heading-font": headingFontStacks[theme.headingFont],
    "--artist-body-font": bodyFontStacks[theme.bodyFont],
    "--artist-shell-glow": recipe.shellGlow,
    "--artist-shell-veil": recipe.shellVeil,
    "--artist-page-texture": recipe.pageTexture,
    "--artist-card-shadow": cardFeelTokens.cardShadow,
    "--artist-rail-surface": recipe.railSurface,
    "--artist-flow-surface": recipe.flowSurface,
    "--artist-section-surface": recipe.sectionSurface,
    "--artist-section-surface-strong": recipe.sectionSurfaceStrong,
    "--artist-selected-surface": cardFeelTokens.selectedSurface,
    "--artist-selected-border": cardFeelTokens.selectedBorder,
    "--artist-input-surface": recipe.inputSurface,
    "--artist-input-border": recipe.inputBorder,
    "--artist-input-focus-surface": recipe.inputFocusSurface,
    "--artist-chip-surface": chipTokens.chipBackground,
    "--artist-chip-text": chipTokens.chipText,
    "--artist-divider": recipe.divider,
    "--artist-button-shadow": cardFeelTokens.cardShadow,
    "--artist-button-radius": radiusMap[theme.radiusStyle],
    "--artist-field-radius": radiusMap[theme.radiusStyle],
    "--artist-card-radius": radiusMap[theme.radiusStyle],
    "--artist-primary-button-surface": buttonTokens.primaryBackground,
    "--artist-primary-button-border": buttonTokens.primaryBorder,
    "--artist-primary-button-text": buttonTokens.primaryText,
    "--artist-secondary-button-surface": buttonTokens.secondaryBackground,
    "--artist-secondary-button-border": buttonTokens.secondaryBorder,
    "--artist-secondary-button-text": buttonTokens.secondaryText,
    "--artist-density-gap": recipe.densityGap,
    "--artist-heading-scale": recipe.headingScale,
  } as CSSProperties;

  return {
    theme,
    wrapperStyle,
    backgroundMedia: {
      imageUrl: theme.backgroundType === "image" ? theme.backgroundImageUrl : null,
      overlayColor,
      overlayGradient: `linear-gradient(180deg, rgba(10, 10, 12, 0.08) 0%, rgba(10, 10, 12, ${overlayEndAlpha}) 72%, rgba(10, 10, 12, ${Math.min(overlayEndAlpha + 0.08, 0.9)}) 100%)`,
      blurPx: blurMap[theme.backgroundImageSoftness],
      position: positionMap[theme.backgroundImageFocus],
      baseBackground: backgroundBase,
    },
    tokens: {
      text,
      muted,
      primaryForeground,
      secondaryForeground,
      cardText,
      cardMuted,
      borderColor: cardFeelTokens.borderColor,
      radiusClass:
        theme.radiusStyle === "small"
          ? "rounded-[20px]"
          : theme.radiusStyle === "medium"
            ? "rounded-[26px]"
            : "rounded-[32px]",
      presetKey: theme.presetTheme as ThemePresetKey,
    },
  };
}
