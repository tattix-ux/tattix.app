import type { ArtistPricingRules, ArtistPricingV2Profile, ColorImpactPreferenceValue, CoverUpImpactPreferenceValue, LeadPreferenceValue } from "@/lib/types";
import { PRICING_V2_ONBOARDING_CASES } from "./onboarding-cases";
import { midpoint, roundToFriendlyPrice } from "./helpers";

type BuildPricingV2ProfileInput = {
  minimumJobPrice: number;
  textStartingPrice: number;
  colorImpactPreference: ColorImpactPreferenceValue;
  coverUpImpactPreference: CoverUpImpactPreferenceValue;
  leadPreference: LeadPreferenceValue;
  onboardingCases: Array<{ id: string; min: number; max: number }>;
  reviewCases?: Array<{ id: string; verdict: "looks-right" | "slightly-low" | "slightly-high" }>;
};

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function deriveColorImpactPreference(rules: ArtistPricingRules): ColorImpactPreferenceValue {
  const black = rules.calibrationExamples.colorMode["black-only"] ?? rules.minimumCharge;
  const color = rules.calibrationExamples.colorMode["full-color"] ?? black;
  const ratio = color > 0 ? color / black : 1;

  if (ratio >= 1.22) {
    return "high";
  }

  if (ratio >= 1.1) {
    return "medium";
  }

  return "low";
}

function deriveCoverUpImpactPreference(rules: ArtistPricingRules): CoverUpImpactPreferenceValue {
  const coverUpMidpoint = midpoint(rules.addonFees.coverUp.min, rules.addonFees.coverUp.max);
  return coverUpMidpoint >= 900 ? "high" : "medium";
}

function buildRoundedBand(center: number, spreadRatio: number, floor: number) {
  const minimum = Math.max(
    roundToFriendlyPrice(center * (1 - spreadRatio), "down"),
    roundToFriendlyPrice(floor, "up"),
  );
  const maximum = Math.max(
    minimum,
    roundToFriendlyPrice(center * (1 + spreadRatio), "up"),
  );

  return {
    min: minimum,
    max: maximum,
  };
}

type SuggestedCaseInput = {
  minimumJobPrice: number;
  textStartingPrice: number;
  colorImpactPreference: ColorImpactPreferenceValue;
  coverUpImpactPreference: CoverUpImpactPreferenceValue;
};

export function buildSuggestedOnboardingCases(input: SuggestedCaseInput) {
  const minimum = Math.max(input.minimumJobPrice, 500);
  const textBase = Math.max(input.textStartingPrice, minimum * 0.94);
  const colorMultiplier =
    input.colorImpactPreference === "low"
      ? 1.1
      : input.colorImpactPreference === "medium"
        ? 1.16
        : 1.22;
  const coverUpMultiplier = input.coverUpImpactPreference === "high" ? 1.34 : 1.2;

  const centers: Record<string, number> = {
    "text-4cm-wrist": Math.max(textBase, minimum * 0.96),
    "symbol-4cm-ankle": Math.max(minimum, textBase * 1.04),
    "object-8cm-forearm": Math.max(minimum * 1.18, textBase * 1.18),
    "figure-12cm-upper-arm": Math.max(minimum * 1.45, textBase * 1.34),
    "multi-15cm-calf": Math.max(minimum * 1.82, textBase * 1.68),
    "ornamental-small-hard": Math.max(minimum * 1.54, textBase * 1.42),
    "medium-color-piece": Math.max(minimum * 1.62, textBase * 1.4) * colorMultiplier,
    "small-cover-up": Math.max(minimum * 1.36, textBase * 1.12) * coverUpMultiplier,
  };

  const spreads: Record<string, number> = {
    "text-4cm-wrist": 0.08,
    "symbol-4cm-ankle": 0.09,
    "object-8cm-forearm": 0.1,
    "figure-12cm-upper-arm": 0.11,
    "multi-15cm-calf": 0.14,
    "ornamental-small-hard": 0.12,
    "medium-color-piece": 0.13,
    "small-cover-up": 0.15,
  };

  return PRICING_V2_ONBOARDING_CASES.map((item) => ({
    id: item.id,
    ...buildRoundedBand(
      centers[item.id] ?? minimum,
      spreads[item.id] ?? 0.1,
      minimum,
    ),
  }));
}

function buildFallbackCases(rules: ArtistPricingRules) {
  const minimumJobPrice = rules.minimumCharge || rules.minimumSessionPrice || 1500;
  const tiny = midpoint(rules.sizeBaseRanges.tiny.min, rules.sizeBaseRanges.tiny.max);
  const textStartingPrice = Math.max(
    Math.min(tiny, minimumJobPrice),
    roundToFriendlyPrice(minimumJobPrice * 0.9, "down"),
  );

  return buildSuggestedOnboardingCases({
    minimumJobPrice,
    textStartingPrice,
    colorImpactPreference: deriveColorImpactPreference(rules),
    coverUpImpactPreference: deriveCoverUpImpactPreference(rules),
  });
}

export function buildPricingV2Profile(
  input: BuildPricingV2ProfileInput,
): ArtistPricingV2Profile {
  return {
    version: 2,
    leadPreference: input.leadPreference,
    minimumJobPrice: roundToFriendlyPrice(input.minimumJobPrice, "up"),
    textStartingPrice: roundToFriendlyPrice(input.textStartingPrice, "up"),
    colorImpactPreference: input.colorImpactPreference,
    coverUpImpactPreference: input.coverUpImpactPreference,
    onboardingCases: input.onboardingCases.map((item) => ({
      id: item.id,
      min: roundToFriendlyPrice(Math.min(item.min, item.max), "down"),
      max: roundToFriendlyPrice(Math.max(item.min, item.max), "up"),
    })),
    reviewCases: (input.reviewCases ?? []).map((item) => ({
      id: item.id,
      verdict: item.verdict,
    })),
    onboardingCompleted: true,
  };
}

export function getArtistPricingV2Profile(rules: ArtistPricingRules): ArtistPricingV2Profile {
  if (rules.calibrationExamples.pricingV2Profile?.version === 2) {
    return rules.calibrationExamples.pricingV2Profile;
  }

  const fallbackCases = buildFallbackCases(rules);
  const minimumJobPrice = rules.minimumCharge || rules.minimumSessionPrice || 1500;
  const textStartingPrice = Math.min(
    fallbackCases.find((item) => item.id === "text-4cm-wrist")?.min ?? minimumJobPrice,
    minimumJobPrice,
  );
  const leadPreference: LeadPreferenceValue = "balanced";

  return buildPricingV2Profile({
    minimumJobPrice,
    textStartingPrice,
    colorImpactPreference: deriveColorImpactPreference(rules),
    coverUpImpactPreference: deriveCoverUpImpactPreference(rules),
    leadPreference,
    onboardingCases: fallbackCases,
    reviewCases: [],
  });
}

export function getOnboardingCaseMidpoint(profile: ArtistPricingV2Profile, caseId: string, fallback: number) {
  const found = profile.onboardingCases.find((item) => item.id === caseId);
  if (!found) {
    return fallback;
  }

  return midpoint(found.min, found.max);
}

export function getLeadPreferenceAdjustment(preference: LeadPreferenceValue) {
  if (preference === "lead_friendly") {
    return { center: 0.95, spread: 1.08 };
  }

  if (preference === "filtered") {
    return { center: 1.06, spread: 0.92 };
  }

  return { center: 1, spread: 1 };
}
