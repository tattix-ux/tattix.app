export const themePresetOptions = [
  "dark-minimal",
  "gothic-black",
  "soft-neutral",
  "luxury-serif",
  "neon-accent",
] as const;

export const backgroundTypeOptions = ["solid", "gradient", "image"] as const;
export const radiusStyleOptions = ["small", "medium", "large"] as const;
export const themeModeOptions = ["dark", "light"] as const;
export const fontPairingPresetOptions = [
  "bold-modern",
  "elegant-editorial",
  "minimal-sans",
  "edgy-clean",
  "premium-editorial",
] as const;

export const headingFontOptions = [
  { value: "display-serif", label: "Display Serif" },
  { value: "modern-sans", label: "Modern Sans" },
  { value: "gothic-sans", label: "Gothic Sans" },
  { value: "editorial-serif", label: "Editorial Serif" },
  { value: "mono-display", label: "Mono Display" },
] as const;

export const bodyFontOptions = [
  { value: "clean-sans", label: "Clean Sans" },
  { value: "neutral-sans", label: "Neutral Sans" },
  { value: "editorial-sans", label: "Editorial Sans" },
  { value: "mono-body", label: "Mono Body" },
] as const;

export const themePresets = {
  "dark-minimal": {
    label: "Dark Minimal",
    themeMode: "dark",
    backgroundType: "solid",
    backgroundColor: "#09090b",
    gradientStart: "#111114",
    gradientEnd: "#09090b",
    primaryColor: "#f7b15d",
    secondaryColor: "#2b2c31",
    cardColor: "#131316",
    cardOpacity: 0.78,
    headingFont: "display-serif",
    bodyFont: "clean-sans",
    fontPairingPreset: "premium-editorial",
    radiusStyle: "large",
  },
  "gothic-black": {
    label: "Gothic Black",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#050505",
    gradientStart: "#000000",
    gradientEnd: "#1b1b1d",
    primaryColor: "#d7d1c8",
    secondaryColor: "#232325",
    cardColor: "#0d0d10",
    cardOpacity: 0.84,
    headingFont: "gothic-sans",
    bodyFont: "neutral-sans",
    fontPairingPreset: "edgy-clean",
    radiusStyle: "medium",
  },
  "soft-neutral": {
    label: "Soft Neutral",
    themeMode: "light",
    backgroundType: "gradient",
    backgroundColor: "#efe6d8",
    gradientStart: "#f7efe2",
    gradientEnd: "#cabaa1",
    primaryColor: "#2f241d",
    secondaryColor: "#baa489",
    cardColor: "#f6ecdc",
    cardOpacity: 0.95,
    headingFont: "editorial-serif",
    bodyFont: "editorial-sans",
    fontPairingPreset: "elegant-editorial",
    radiusStyle: "large",
  },
  "luxury-serif": {
    label: "Luxury Serif",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#120d11",
    gradientStart: "#241521",
    gradientEnd: "#0b090c",
    primaryColor: "#d7b48a",
    secondaryColor: "#3d2a34",
    cardColor: "#1a1218",
    cardOpacity: 0.8,
    headingFont: "editorial-serif",
    bodyFont: "clean-sans",
    fontPairingPreset: "elegant-editorial",
    radiusStyle: "large",
  },
  "neon-accent": {
    label: "Neon Accent",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#071117",
    gradientStart: "#11263a",
    gradientEnd: "#071117",
    primaryColor: "#54f0dd",
    secondaryColor: "#17303c",
    cardColor: "#0d171d",
    cardOpacity: 0.82,
    headingFont: "modern-sans",
    bodyFont: "clean-sans",
    fontPairingPreset: "bold-modern",
    radiusStyle: "medium",
  },
} as const;

export type ThemePresetKey = (typeof themePresetOptions)[number];
export type BackgroundType = (typeof backgroundTypeOptions)[number];
export type RadiusStyle = (typeof radiusStyleOptions)[number];
export type ThemeMode = (typeof themeModeOptions)[number];
export type FontPairingPreset = (typeof fontPairingPresetOptions)[number];
export type HeadingFontKey = (typeof headingFontOptions)[number]["value"];
export type BodyFontKey = (typeof bodyFontOptions)[number]["value"];
