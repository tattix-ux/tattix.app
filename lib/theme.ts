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
  const presetKey: ThemePresetKey = "graphite-pro";
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
  "soft-minimal": "soft-editorial",
  "dark-studio": "graphite-pro",
  "editorial-clean": "soft-editorial",
  "bold-contrast": "graphite-pro",
  "natural-stone": "warm-studio",
  "monochrome-luxury": "night-luxury",
  "dark-minimal": "graphite-pro",
  "gothic-black": "graphite-pro",
  "soft-neutral": "warm-studio",
  "luxury-serif": "night-luxury",
  "neon-accent": "graphite-pro",
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
  "soft-editorial": {
    shellGlow:
      "radial-gradient(circle_at_top_left, rgba(255,255,255,0.7), transparent 28%), radial-gradient(circle_at_bottom_right, rgba(79,67,56,0.08), transparent 34%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.28) 22%, transparent 78%)",
    pageTexture: "rgba(17,17,17,0.055)",
    cardShadow: "0 10px 26px rgba(33,28,22,0.06)",
    railSurface: "rgba(255,253,249,0.84)",
    flowSurface: "rgba(255,255,253,0.95)",
    sectionSurface: "rgba(255,255,255,0.56)",
    sectionSurfaceStrong: "rgba(255,255,255,0.82)",
    selectedSurface: "rgba(79,67,56,0.08)",
    selectedBorder: "rgba(79,67,56,0.22)",
    inputSurface: "rgba(255,255,255,0.7)",
    inputBorder: "rgba(28,24,21,0.08)",
    inputFocusSurface: "rgba(255,255,255,0.92)",
    chipSurface: "rgba(79,67,56,0.08)",
    chipText: "#3f352e",
    divider: "rgba(28,24,21,0.08)",
    secondaryButtonSurface: "rgba(255,255,255,0.76)",
    secondaryButtonBorder: "rgba(28,24,21,0.1)",
    buttonShadow: "0 10px 20px rgba(33,28,22,0.08)",
    buttonRadius: "999px",
    fieldRadius: "18px",
    cardRadius: "22px",
    densityGap: "1.15",
    headingScale: "1.06",
  },
  "warm-studio": {
    shellGlow:
      "radial-gradient(circle_at_top, rgba(255,245,232,0.34), transparent 26%), radial-gradient(circle_at_bottom_right, rgba(127,99,79,0.12), transparent 36%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 22%, transparent 80%, rgba(125,94,72,0.08))",
    pageTexture: "rgba(47,38,33,0.045)",
    cardShadow: "0 18px 34px rgba(64,48,34,0.09)",
    railSurface: "rgba(245,236,223,0.78)",
    flowSurface: "rgba(245,236,223,0.92)",
    sectionSurface: "rgba(255,249,241,0.48)",
    sectionSurfaceStrong: "rgba(255,249,241,0.64)",
    selectedSurface: "rgba(127,99,79,0.12)",
    selectedBorder: "rgba(127,99,79,0.24)",
    inputSurface: "rgba(255,250,243,0.68)",
    inputBorder: "rgba(68,54,41,0.09)",
    inputFocusSurface: "rgba(255,251,246,0.88)",
    chipSurface: "rgba(127,99,79,0.1)",
    chipText: "#5a4739",
    divider: "rgba(68,54,41,0.085)",
    secondaryButtonSurface: "rgba(255,250,243,0.62)",
    secondaryButtonBorder: "rgba(68,54,41,0.1)",
    buttonShadow: "0 12px 22px rgba(66,48,31,0.1)",
    buttonRadius: "18px",
    fieldRadius: "20px",
    cardRadius: "28px",
    densityGap: "0.98",
    headingScale: "1.02",
  },
  "graphite-pro": {
    shellGlow:
      "radial-gradient(circle_at_top_left, rgba(216,162,95,0.14), transparent 24%), radial-gradient(circle_at_top, rgba(255,255,255,0.03), transparent 30%), radial-gradient(circle_at_bottom_right, rgba(46,54,64,0.28), transparent 34%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%, transparent 82%, rgba(0,0,0,0.14))",
    pageTexture: "rgba(255,255,255,0.03)",
    cardShadow: "0 22px 48px rgba(0,0,0,0.24)",
    railSurface: "rgba(21,27,34,0.82)",
    flowSurface: "rgba(18,24,31,0.94)",
    sectionSurface: "rgba(255,255,255,0.03)",
    sectionSurfaceStrong: "rgba(255,255,255,0.05)",
    selectedSurface: "linear-gradient(180deg, rgba(216,162,95,0.2), rgba(216,162,95,0.1))",
    selectedBorder: "rgba(216,162,95,0.38)",
    inputSurface: "rgba(12,16,21,0.88)",
    inputBorder: "rgba(255,255,255,0.08)",
    inputFocusSurface: "rgba(15,20,26,0.98)",
    chipSurface: "rgba(255,255,255,0.05)",
    chipText: "#e8e4de",
    divider: "rgba(255,255,255,0.08)",
    secondaryButtonSurface: "rgba(255,255,255,0.045)",
    secondaryButtonBorder: "rgba(255,255,255,0.1)",
    buttonShadow: "0 16px 30px rgba(0,0,0,0.28)",
    buttonRadius: "16px",
    fieldRadius: "16px",
    cardRadius: "24px",
    densityGap: "0.92",
    headingScale: "1",
  },
  "night-luxury": {
    shellGlow:
      "radial-gradient(circle_at_top, rgba(213,165,116,0.16), transparent 26%), radial-gradient(circle_at_top_right, rgba(255,255,255,0.03), transparent 22%), radial-gradient(circle_at_bottom_left, rgba(79,59,51,0.34), transparent 34%)",
    shellVeil: "linear-gradient(180deg, rgba(255,255,255,0.035), transparent 20%, transparent 76%, rgba(213,165,116,0.04))",
    pageTexture: "rgba(255,255,255,0.028)",
    cardShadow: "0 26px 56px rgba(0,0,0,0.34)",
    railSurface: "rgba(23,19,23,0.82)",
    flowSurface: "rgba(18,14,18,0.94)",
    sectionSurface: "rgba(255,255,255,0.025)",
    sectionSurfaceStrong: "rgba(255,255,255,0.04)",
    selectedSurface: "linear-gradient(180deg, rgba(213,165,116,0.18), rgba(213,165,116,0.08))",
    selectedBorder: "rgba(213,165,116,0.34)",
    inputSurface: "rgba(15,12,15,0.92)",
    inputBorder: "rgba(213,165,116,0.12)",
    inputFocusSurface: "rgba(22,18,21,0.98)",
    chipSurface: "rgba(213,165,116,0.11)",
    chipText: "#e5c5a1",
    divider: "rgba(255,255,255,0.07)",
    secondaryButtonSurface: "rgba(255,255,255,0.035)",
    secondaryButtonBorder: "rgba(213,165,116,0.13)",
    buttonShadow: "0 18px 38px rgba(0,0,0,0.34)",
    buttonRadius: "18px",
    fieldRadius: "18px",
    cardRadius: "28px",
    densityGap: "1.02",
    headingScale: "1.05",
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
  const preset = themePresets[presetKey] ?? themePresets["graphite-pro"];
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
  const recipe = themeRecipes[theme.presetTheme as ThemePresetKey] ?? themeRecipes["graphite-pro"];

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
