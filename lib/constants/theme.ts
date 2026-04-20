export const themePresetOptions = [
  "studio-light",
  "warm-canvas",
  "midnight-ink",
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
  "studio-light": {
    label: "Studio Light",
    themeMode: "light",
    backgroundType: "solid",
    backgroundColor: "#F6F1E8",
    gradientStart: "#FBF7F0",
    gradientEnd: "#EEE4D6",
    textColor: "#1E1A17",
    primaryColor: "#A86E45",
    secondaryColor: "#F1E7DA",
    cardColor: "#FFFDF8",
    cardOpacity: 0.98,
    headingFont: "inter",
    bodyFont: "inter",
    fontPairingPreset: "inter-neutral",
    radiusStyle: "medium",
  },
  "warm-canvas": {
    label: "Warm Canvas",
    themeMode: "light",
    backgroundType: "gradient",
    backgroundColor: "#E8DCCF",
    gradientStart: "#F1E7DB",
    gradientEnd: "#DCC8B5",
    textColor: "#2A1F18",
    primaryColor: "#8E5F41",
    secondaryColor: "#E9D9CB",
    cardColor: "#F7EFE6",
    cardOpacity: 0.96,
    headingFont: "manrope",
    bodyFont: "manrope",
    fontPairingPreset: "manrope-refined",
    radiusStyle: "large",
  },
  "midnight-ink": {
    label: "Midnight Ink",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#0B0D11",
    gradientStart: "#151922",
    gradientEnd: "#07090C",
    textColor: "#F2EDE5",
    primaryColor: "#D6A574",
    secondaryColor: "#1B2028",
    cardColor: "#12161C",
    cardOpacity: 0.9,
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
