export const intentOptions = [
  { value: "custom-tattoo", label: "Custom tattoo", category: null },
  { value: "design-in-mind", label: "I have a design in mind", category: null },
  { value: "flash-design", label: "Flash design", category: "flash-designs" },
  {
    value: "discounted-design",
    label: "Discounted design",
    category: "discounted-designs",
  },
  { value: "not-sure", label: "I'm not sure", category: null },
] as const;

export const requestTypeOptions = [
  { value: "text", label: "Text" },
  { value: "mini_simple", label: "Mini simple" },
  { value: "single_object", label: "Single object" },
  { value: "multi_element", label: "Multi element" },
  { value: "cover_up", label: "Cover up" },
  { value: "unsure", label: "Unsure" },
] as const;

export const sizeOptions = [
  { value: "tiny", label: "Tiny", detail: "Quick accent or finger-scale design" },
  { value: "small", label: "Small", detail: "Palm-size or simple linework" },
  { value: "medium", label: "Medium", detail: "Forearm, calf, or chest detail" },
  { value: "large", label: "Large", detail: "Statement piece or multi-session work" },
] as const;

export const styleOptions = [
  { value: "fine-line", label: "Fine line" },
  { value: "minimal", label: "Minimal" },
  { value: "traditional", label: "Traditional" },
  { value: "neo-traditional", label: "Neo traditional" },
  { value: "blackwork", label: "Blackwork" },
  { value: "realism", label: "Realistic" },
  { value: "micro-realism", label: "Micro realism" },
  { value: "ornamental", label: "Ornamental" },
  { value: "lettering", label: "Lettering" },
  { value: "not-sure-style", label: "I'm not sure" },
  { value: "custom", label: "Custom" },
] as const;

export const workStyleOptions = [
  { value: "clean_line", label: "Clean line" },
  { value: "shaded_detailed", label: "Shaded detailed" },
  { value: "precision_symmetric", label: "Precision symmetric" },
  { value: "unsure", label: "Unsure" },
] as const;

export const realismLevelOptions = [
  { value: "standard", label: "Standard" },
  { value: "advanced", label: "Advanced" },
] as const;

export const areaScopeOptions = [
  { value: "standard_piece", label: "Standard piece" },
  { value: "large_single_area", label: "Large single area" },
  { value: "wide_area", label: "Wide area" },
  { value: "unsure", label: "Unsure" },
] as const;

export const largeAreaCoverageOptions = [
  { value: "partial", label: "Partial" },
  { value: "mostly", label: "Mostly" },
  { value: "almost_full", label: "Almost full" },
] as const;

export const wideAreaTargetOptions = [
  { value: "half_arm", label: "Half arm" },
  { value: "full_arm", label: "Full arm" },
  { value: "wide_chest", label: "Wide chest" },
  { value: "wide_back", label: "Wide back" },
  { value: "half_leg", label: "Half leg" },
  { value: "mostly_leg", label: "Mostly leg" },
  { value: "unsure", label: "Unsure" },
] as const;

export const featuredDesignCategories = [
  { value: "discounted-designs", label: "Discounted designs" },
  { value: "flash-designs", label: "Flash designs" },
] as const;

export const currencyOptions = [
  { value: "TRY", label: "Turkish Lira (TRY)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "US Dollar (USD)" },
] as const;

export type IntentValue = (typeof intentOptions)[number]["value"];
export type RequestTypeValue = (typeof requestTypeOptions)[number]["value"];
export type SizeValue = (typeof sizeOptions)[number]["value"];
export type StyleValue = string;
export type WorkStyleValue = (typeof workStyleOptions)[number]["value"];
export type RealismLevelValue = (typeof realismLevelOptions)[number]["value"];
export type AreaScopeValue = (typeof areaScopeOptions)[number]["value"];
export type LargeAreaCoverageValue = (typeof largeAreaCoverageOptions)[number]["value"];
export type WideAreaTargetValue = (typeof wideAreaTargetOptions)[number]["value"];
export type FeaturedCategoryValue = string;
