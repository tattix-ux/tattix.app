export const themePresetOptions = [
  "bronze-studio",
  "smoke-metal",
  "dark-alloy",
  "velvet-sable",
  "cathedral-ash",
  "astral-forge",
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
    label: "Ember Veil",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#17171A",
    gradientStart: "#2A211B",
    gradientEnd: "#15161A",
    textColor: "#F2EEE7",
    primaryColor: "#D6B17A",
    secondaryColor: "#2B231E",
    cardColor: "#211D1A",
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
    label: "Nocturne Ink",
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
  "velvet-sable": {
    label: "Velvet Sable",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#171417",
    gradientStart: "#2A2025",
    gradientEnd: "#141216",
    textColor: "#F1E7E1",
    primaryColor: "#C79A68",
    secondaryColor: "#31242A",
    cardColor: "#231B1F",
    cardOpacity: 0.94,
    headingFont: "manrope",
    bodyFont: "inter",
    fontPairingPreset: "manrope-refined",
    radiusStyle: "medium",
  },
  "cathedral-ash": {
    label: "Cathedral Ash",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#141316",
    gradientStart: "#232026",
    gradientEnd: "#121215",
    textColor: "#ECE4DB",
    primaryColor: "#C6B29A",
    secondaryColor: "#2B2730",
    cardColor: "#1D1A20",
    cardOpacity: 0.95,
    headingFont: "outfit",
    bodyFont: "manrope",
    fontPairingPreset: "outfit-modern",
    radiusStyle: "medium",
  },
  "astral-forge": {
    label: "Astral Forge",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#121417",
    gradientStart: "#1B2230",
    gradientEnd: "#101215",
    textColor: "#EEE8E0",
    primaryColor: "#B88352",
    secondaryColor: "#20283A",
    cardColor: "#171C26",
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
