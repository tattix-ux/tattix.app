export const themePresetOptions = [
  "soft-editorial",
  "warm-studio",
  "graphite-pro",
  "night-luxury",
] as const;

export const backgroundTypeOptions = ["solid", "gradient", "image"] as const;
export const radiusStyleOptions = ["small", "medium", "large"] as const;
export const themeModeOptions = ["dark", "light"] as const;
export const fontPairingPresetOptions = [
  "dm-sans-editorial",
  "general-sans-soft",
  "inter-compact",
  "manrope-display",
] as const;

export const headingFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "general-sans", label: "General Sans" },
] as const;

export const bodyFontOptions = [
  { value: "inter", label: "Inter" },
  { value: "manrope", label: "Manrope" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "general-sans", label: "General Sans" },
] as const;

export const themePresets = {
  "soft-editorial": {
    label: "Soft Editorial",
    themeMode: "light",
    backgroundType: "solid",
    backgroundColor: "#faf7f1",
    gradientStart: "#fdfaf5",
    gradientEnd: "#f1ece3",
    textColor: "#1d1a17",
    primaryColor: "#4f4338",
    secondaryColor: "#ece5da",
    cardColor: "#fffdf9",
    cardOpacity: 0.98,
    headingFont: "dm-sans",
    bodyFont: "inter",
    fontPairingPreset: "dm-sans-editorial",
    radiusStyle: "small",
  },
  "warm-studio": {
    label: "Warm Studio",
    themeMode: "light",
    backgroundType: "gradient",
    backgroundColor: "#e5d8c6",
    gradientStart: "#efe5d8",
    gradientEnd: "#d8c6b0",
    textColor: "#2d2621",
    primaryColor: "#7f634f",
    secondaryColor: "#cbb39a",
    cardColor: "#f5ecdf",
    cardOpacity: 0.95,
    headingFont: "general-sans",
    bodyFont: "inter",
    fontPairingPreset: "general-sans-soft",
    radiusStyle: "large",
  },
  "graphite-pro": {
    label: "Graphite Pro",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#0f1216",
    gradientStart: "#1a2129",
    gradientEnd: "#0b0e12",
    textColor: "#f4f5f6",
    primaryColor: "#d8a25f",
    secondaryColor: "#2e3640",
    cardColor: "#151b22",
    cardOpacity: 0.9,
    headingFont: "inter",
    bodyFont: "inter",
    fontPairingPreset: "inter-compact",
    radiusStyle: "medium",
  },
  "night-luxury": {
    label: "Night Luxury",
    themeMode: "dark",
    backgroundType: "gradient",
    backgroundColor: "#100f12",
    gradientStart: "#231b1c",
    gradientEnd: "#09080a",
    textColor: "#f5efe7",
    primaryColor: "#d5a574",
    secondaryColor: "#4f3b33",
    cardColor: "#171317",
    cardOpacity: 0.9,
    headingFont: "manrope",
    bodyFont: "inter",
    fontPairingPreset: "manrope-display",
    radiusStyle: "large",
  },
} as const;

export type ThemePresetKey = (typeof themePresetOptions)[number];
export type BackgroundType = (typeof backgroundTypeOptions)[number];
export type RadiusStyle = (typeof radiusStyleOptions)[number];
export type ThemeMode = (typeof themeModeOptions)[number];
export type FontPairingPreset = (typeof fontPairingPresetOptions)[number];
export type HeadingFontKey = (typeof headingFontOptions)[number]["value"];
export type BodyFontKey = (typeof bodyFontOptions)[number]["value"];
