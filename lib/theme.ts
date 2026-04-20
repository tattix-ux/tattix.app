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
  outfit: 'var(--font-outfit), "Outfit", "Segoe UI", sans-serif',
};

const bodyFontStacks: Record<BodyFontKey, string> = {
  inter: 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
  manrope: 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
  outfit: 'var(--font-outfit), "Outfit", "Segoe UI", sans-serif',
};

const fontPairings: Record<
  FontPairingPreset,
  { headingFont: HeadingFontKey; bodyFont: BodyFontKey }
> = {
  "inter-neutral": { headingFont: "inter", bodyFont: "inter" },
  "manrope-refined": { headingFont: "manrope", bodyFont: "inter" },
  "outfit-modern": { headingFont: "outfit", bodyFont: "inter" },
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
  const presetKey: ThemePresetKey = "midnight-ink";
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
  "soft-minimal": "studio-light",
  "dark-studio": "midnight-ink",
  "editorial-clean": "studio-light",
  "bold-contrast": "midnight-ink",
  "natural-stone": "warm-canvas",
  "monochrome-luxury": "midnight-ink",
  "dark-minimal": "midnight-ink",
  "gothic-black": "midnight-ink",
  "soft-neutral": "warm-canvas",
  "luxury-serif": "midnight-ink",
  "neon-accent": "midnight-ink",
  "soft-editorial": "studio-light",
  "warm-studio": "warm-canvas",
  "graphite-pro": "midnight-ink",
  "night-luxury": "midnight-ink",
};

const legacyHeadingFontMap: Record<string, HeadingFontKey> = {
  "display-serif": "manrope",
  "modern-sans": "inter",
  "gothic-sans": "manrope",
  "editorial-serif": "outfit",
  "mono-display": "inter",
  satoshi: "manrope",
  "dm-sans": "outfit",
  "general-sans": "outfit",
};

const legacyBodyFontMap: Record<string, BodyFontKey> = {
  "clean-sans": "inter",
  "neutral-sans": "manrope",
  "editorial-sans": "outfit",
  "mono-body": "inter",
  satoshi: "inter",
  "dm-sans": "inter",
  "general-sans": "inter",
};

const legacyFontPairingMap: Record<string, FontPairingPreset> = {
  "elegant-editorial": "outfit-modern",
  "bold-modern": "inter-neutral",
  "minimal-sans": "inter-neutral",
  "edgy-clean": "manrope-refined",
  "premium-editorial": "manrope-refined",
  "inter-balanced": "inter-neutral",
  "manrope-refined": "manrope-refined",
  "manrope-impact": "manrope-refined",
  "general-clean": "outfit-modern",
  "satoshi-neutral": "outfit-modern",
  "dm-sans-editorial": "outfit-modern",
  "general-sans-soft": "outfit-modern",
  "inter-compact": "inter-neutral",
  "manrope-display": "manrope-refined",
};

const themeRecipes: Record<
  ThemePresetKey,
  {
    shellGlow: string;
    shellVeil: string;
    pageTexture: string;
    cardShadow: string;
    railSurface: string;
    flowSurface: string;
    sectionSurface: string;
    sectionSurfaceStrong: string;
    selectedSurface: string;
    selectedBorder: string;
    inputSurface: string;
    inputBorder: string;
    inputFocusSurface: string;
    chipSurface: string;
    chipText: string;
    divider: string;
    secondaryButtonSurface: string;
    secondaryButtonBorder: string;
    buttonShadow: string;
    buttonRadius: string;
    fieldRadius: string;
    cardRadius: string;
    densityGap: string;
    headingScale: string;
  }
> = {
  "studio-light": {
    shellGlow:
      "radial-gradient(circle_at_top_left, rgba(255,255,255,0.82), transparent 26%), radial-gradient(circle_at_bottom_right, rgba(168,110,69,0.08), transparent 34%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.24) 24%, transparent 78%)",
    pageTexture: "rgba(30,26,23,0.05)",
    cardShadow: "0 14px 32px rgba(36,28,21,0.07)",
    railSurface: "rgba(255,253,248,0.88)",
    flowSurface: "rgba(255,253,249,0.96)",
    sectionSurface: "rgba(255,255,255,0.62)",
    sectionSurfaceStrong: "rgba(255,255,255,0.86)",
    selectedSurface: "rgba(168,110,69,0.1)",
    selectedBorder: "rgba(168,110,69,0.26)",
    inputSurface: "rgba(255,255,255,0.76)",
    inputBorder: "rgba(30,26,23,0.08)",
    inputFocusSurface: "rgba(255,255,255,0.94)",
    chipSurface: "rgba(168,110,69,0.1)",
    chipText: "#6a4b37",
    divider: "rgba(30,26,23,0.08)",
    secondaryButtonSurface: "rgba(255,255,255,0.8)",
    secondaryButtonBorder: "rgba(30,26,23,0.1)",
    buttonShadow: "0 12px 24px rgba(36,28,21,0.08)",
    buttonRadius: "999px",
    fieldRadius: "18px",
    cardRadius: "24px",
    densityGap: "1.12",
    headingScale: "1.05",
  },
  "warm-canvas": {
    shellGlow:
      "radial-gradient(circle_at_top, rgba(255,248,240,0.34), transparent 24%), radial-gradient(circle_at_bottom_right, rgba(142,95,65,0.12), transparent 34%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.2), transparent 22%, transparent 82%, rgba(142,95,65,0.06))",
    pageTexture: "rgba(42,31,24,0.05)",
    cardShadow: "0 18px 38px rgba(66,49,35,0.1)",
    railSurface: "rgba(247,239,230,0.8)",
    flowSurface: "rgba(247,239,230,0.94)",
    sectionSurface: "rgba(255,250,244,0.5)",
    sectionSurfaceStrong: "rgba(255,250,244,0.68)",
    selectedSurface: "rgba(142,95,65,0.12)",
    selectedBorder: "rgba(142,95,65,0.24)",
    inputSurface: "rgba(255,250,244,0.7)",
    inputBorder: "rgba(42,31,24,0.09)",
    inputFocusSurface: "rgba(255,252,247,0.9)",
    chipSurface: "rgba(142,95,65,0.11)",
    chipText: "#6c4d3b",
    divider: "rgba(42,31,24,0.08)",
    secondaryButtonSurface: "rgba(255,251,245,0.68)",
    secondaryButtonBorder: "rgba(42,31,24,0.1)",
    buttonShadow: "0 14px 26px rgba(66,49,35,0.1)",
    buttonRadius: "18px",
    fieldRadius: "20px",
    cardRadius: "28px",
    densityGap: "1",
    headingScale: "1.02",
  },
  "midnight-ink": {
    shellGlow:
      "radial-gradient(circle_at_top_left, rgba(214,165,116,0.14), transparent 24%), radial-gradient(circle_at_top, rgba(255,255,255,0.03), transparent 28%), radial-gradient(circle_at_bottom_right, rgba(42,47,56,0.28), transparent 34%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.035), transparent 18%, transparent 82%, rgba(0,0,0,0.16))",
    pageTexture: "rgba(255,255,255,0.03)",
    cardShadow: "0 24px 52px rgba(0,0,0,0.3)",
    railSurface: "rgba(18,22,28,0.84)",
    flowSurface: "rgba(13,16,22,0.95)",
    sectionSurface: "rgba(255,255,255,0.03)",
    sectionSurfaceStrong: "rgba(255,255,255,0.05)",
    selectedSurface: "linear-gradient(180deg, rgba(214,165,116,0.2), rgba(214,165,116,0.1))",
    selectedBorder: "rgba(214,165,116,0.38)",
    inputSurface: "rgba(10,12,17,0.9)",
    inputBorder: "rgba(255,255,255,0.08)",
    inputFocusSurface: "rgba(14,18,24,0.98)",
    chipSurface: "rgba(255,255,255,0.05)",
    chipText: "#ece7df",
    divider: "rgba(255,255,255,0.08)",
    secondaryButtonSurface: "rgba(255,255,255,0.045)",
    secondaryButtonBorder: "rgba(255,255,255,0.1)",
    buttonShadow: "0 16px 32px rgba(0,0,0,0.3)",
    buttonRadius: "18px",
    fieldRadius: "18px",
    cardRadius: "26px",
    densityGap: "0.94",
    headingScale: "1.03",
  },
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
  const preset = themePresets[presetKey] ?? themePresets["midnight-ink"];
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
  const recipe = themeRecipes[theme.presetTheme as ThemePresetKey] ?? themeRecipes["midnight-ink"];

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
    "--artist-shell-glow": recipe.shellGlow,
    "--artist-shell-veil": recipe.shellVeil,
    "--artist-page-texture": recipe.pageTexture,
    "--artist-card-shadow": recipe.cardShadow,
    "--artist-rail-surface": recipe.railSurface,
    "--artist-flow-surface": recipe.flowSurface,
    "--artist-section-surface": recipe.sectionSurface,
    "--artist-section-surface-strong": recipe.sectionSurfaceStrong,
    "--artist-selected-surface": recipe.selectedSurface,
    "--artist-selected-border": recipe.selectedBorder,
    "--artist-input-surface": recipe.inputSurface,
    "--artist-input-border": recipe.inputBorder,
    "--artist-input-focus-surface": recipe.inputFocusSurface,
    "--artist-chip-surface": recipe.chipSurface,
    "--artist-chip-text": recipe.chipText,
    "--artist-divider": recipe.divider,
    "--artist-secondary-button-surface": recipe.secondaryButtonSurface,
    "--artist-secondary-button-border": recipe.secondaryButtonBorder,
    "--artist-button-shadow": recipe.buttonShadow,
    "--artist-button-radius": recipe.buttonRadius,
    "--artist-field-radius": recipe.fieldRadius,
    "--artist-card-radius": recipe.cardRadius,
    "--artist-density-gap": recipe.densityGap,
    "--artist-heading-scale": recipe.headingScale,
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
      presetKey: theme.presetTheme as ThemePresetKey,
    },
  };
}
