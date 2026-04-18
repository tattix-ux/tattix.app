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
    backgroundType: "gradient",
    backgroundColor: "#0e0f12",
    gradientStart: "#1b1c21",
    gradientEnd: "#0d0d10",
    primaryColor: "#f7b15d",
    secondaryColor: "#3a332c",
    cardColor: "#17181d",
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
    backgroundColor: "#040306",
    gradientStart: "#170911",
    gradientEnd: "#040306",
    primaryColor: "#d7dde7",
    secondaryColor: "#4b1f33",
    cardColor: "#0b0a0f",
    cardOpacity: 0.9,
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
    primaryColor: "#4d392d",
    secondaryColor: "#8f775f",
    cardColor: "#f8f0e4",
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
