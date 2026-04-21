export const themePresetOptions = [
  "bronze-studio",
  "smoke-metal",
  "dark-alloy",
] as const;

export const backgroundTypeOptions = ["solid", "gradient", "image"] as const;
export const radiusStyleOptions = ["small", "medium", "large"] as const;
export const themeModeOptions = ["dark", "light"] as const;
export const fontPairingPresetOptions = [
  "inter-neutral",
  "manrope-refined",
  "outfit-modern",
] as const;

export const headingFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "outfit", label: "Outfit" },
] as const;

export const bodyFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "outfit", label: "Outfit" },
] as const;

export const themePresets = {
  "bronze-studio": {
    label: "Bronze Studio",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#17181C",
    gradientStart: "#26211C",
    gradientEnd: "#15161A",
    textColor: "#EEE7DD",
    primaryColor: "#D6B17A",
    secondaryColor: "#26211B",
    cardColor: "#211F1B",
    cardOpacity: 0.94,
    headingFont: "inter",
    bodyFont: "inter",
    fontPairingPreset: "inter-neutral",
    radiusStyle: "medium",
  },
  "smoke-metal": {
    label: "Smoke Alloy",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#15171A",
    gradientStart: "#26292D",
    gradientEnd: "#17191D",
    textColor: "#E5DED6",
    primaryColor: "#C1A07C",
    secondaryColor: "#25282D",
    cardColor: "#2B2F35",
    cardOpacity: 0.94,
    headingFont: "manrope",
    bodyFont: "manrope",
    fontPairingPreset: "manrope-refined",
    radiusStyle: "medium",
  },
  "dark-alloy": {
    label: "Ink Midnight",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#121315",
    gradientStart: "#182235",
    gradientEnd: "#0F1115",
    textColor: "#F0E7DC",
    primaryColor: "#E0B982",
    secondaryColor: "#1A2230",
    cardColor: "#171C25",
    cardOpacity: 0.94,
    headingFont: "outfit",
    bodyFont: "inter",
    fontPairingPreset: "outfit-modern",
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
