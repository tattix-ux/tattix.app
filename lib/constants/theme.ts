export const themePresetOptions = [
  "soft-minimal",
  "dark-studio",
  "editorial-clean",
  "bold-contrast",
  "natural-stone",
  "monochrome-luxury",
] as const;

export const backgroundTypeOptions = ["solid", "gradient", "image"] as const;
export const radiusStyleOptions = ["small", "medium", "large"] as const;
export const themeModeOptions = ["dark", "light"] as const;
export const fontPairingPresetOptions = [
  "inter-balanced",
  "manrope-refined",
  "dm-sans-editorial",
  "manrope-impact",
  "general-clean",
  "satoshi-neutral",
] as const;

export const headingFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "general-sans", label: "General Sans" },
  { value: "satoshi", label: "Satoshi" },
] as const;

export const bodyFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "general-sans", label: "General Sans" },
  { value: "satoshi", label: "Satoshi" },
] as const;

export const themePresets = {
  "soft-minimal": {
    label: "Soft Minimal",
    themeMode: "light",
    backgroundType: "solid",
    backgroundColor: "#f6f1e8",
    gradientStart: "#faf6ef",
    gradientEnd: "#ede4d7",
    textColor: "#302820",
    primaryColor: "#8a6f58",
    secondaryColor: "#e8ddd1",
    cardColor: "#fffaf4",
    cardOpacity: 0.96,
    headingFont: "manrope",
    bodyFont: "inter",
    fontPairingPreset: "manrope-refined",
    radiusStyle: "large",
  },
  "dark-studio": {
    label: "Dark Studio",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#121315",
    gradientStart: "#212327",
    gradientEnd: "#0d0e11",
    textColor: "#f5f3ee",
    primaryColor: "#d0a46f",
    secondaryColor: "#34373c",
    cardColor: "#1a1c20",
    cardOpacity: 0.88,
    headingFont: "manrope",
    bodyFont: "inter",
    fontPairingPreset: "manrope-refined",
    radiusStyle: "medium",
  },
  "editorial-clean": {
    label: "Editorial Clean",
    themeMode: "light",
    backgroundType: "solid",
    backgroundColor: "#fbfaf7",
    gradientStart: "#ffffff",
    gradientEnd: "#f2f0ea",
    textColor: "#171717",
    primaryColor: "#111111",
    secondaryColor: "#ece7dd",
    cardColor: "#fffefb",
    cardOpacity: 0.98,
    headingFont: "dm-sans",
    bodyFont: "inter",
    fontPairingPreset: "dm-sans-editorial",
    radiusStyle: "small",
  },
  "bold-contrast": {
    label: "Bold Contrast",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#0f1115",
    gradientStart: "#191e26",
    gradientEnd: "#090b0e",
    textColor: "#f7f7f5",
    primaryColor: "#ffb24d",
    secondaryColor: "#2f3642",
    cardColor: "#171a20",
    cardOpacity: 0.9,
    headingFont: "manrope",
    bodyFont: "dm-sans",
    fontPairingPreset: "manrope-impact",
    radiusStyle: "medium",
  },
  "natural-stone": {
    label: "Natural Stone",
    themeMode: "light",
    backgroundType: "gradient",
    backgroundColor: "#d9cfbf",
    gradientStart: "#e8dfd2",
    gradientEnd: "#c9baa6",
    textColor: "#2f2822",
    primaryColor: "#6c5545",
    secondaryColor: "#b79f8b",
    cardColor: "#f1e7da",
    cardOpacity: 0.94,
    headingFont: "general-sans",
    bodyFont: "inter",
    fontPairingPreset: "general-clean",
    radiusStyle: "large",
  },
  "monochrome-luxury": {
    label: "Monochrome Luxury",
    themeMode: "dark",
    backgroundType: "solid",
    backgroundColor: "#0a0a0a",
    gradientStart: "#141414",
    gradientEnd: "#050505",
    textColor: "#f3f1ee",
    primaryColor: "#c8beb0",
    secondaryColor: "#242424",
    cardColor: "#111111",
    cardOpacity: 0.92,
    headingFont: "satoshi",
    bodyFont: "inter",
    fontPairingPreset: "satoshi-neutral",
    radiusStyle: "small",
  },
} as const;

export type ThemePresetKey = (typeof themePresetOptions)[number];
export type BackgroundType = (typeof backgroundTypeOptions)[number];
export type RadiusStyle = (typeof radiusStyleOptions)[number];
export type ThemeMode = (typeof themeModeOptions)[number];
export type FontPairingPreset = (typeof fontPairingPresetOptions)[number];
export type HeadingFontKey = (typeof headingFontOptions)[number]["value"];
export type BodyFontKey = (typeof bodyFontOptions)[number]["value"];
