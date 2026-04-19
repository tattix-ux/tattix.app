import type { ArtistPricingRules, ArtistPricingV2Profile, ColorImpactPreferenceValue, CoverUpImpactPreferenceValue, LeadPreferenceValue } from "@/lib/types";
import { PRICING_V2_ONBOARDING_CASES } from "./onboarding-cases";
import { midpoint } from "./helpers";

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

function buildFallbackCases(rules: ArtistPricingRules) {
  const tiny = midpoint(rules.sizeBaseRanges.tiny.min, rules.sizeBaseRanges.tiny.max);
  const small = midpoint(rules.sizeBaseRanges.small.min, rules.sizeBaseRanges.small.max);
  const medium = midpoint(rules.sizeBaseRanges.medium.min, rules.sizeBaseRanges.medium.max);
  const large = midpoint(rules.sizeBaseRanges.large.min, rules.sizeBaseRanges.large.max);
  const coverUpMidpoint = midpoint(rules.addonFees.coverUp.min, rules.addonFees.coverUp.max);
  const colorDelta = Math.max(0, (rules.calibrationExamples.colorMode["full-color"] ?? medium) - (rules.calibrationExamples.colorMode["black-only"] ?? medium));

  return PRICING_V2_ONBOARDING_CASES.map((item) => {
    const center =
      item.id === "text-4cm-wrist"
        ? Math.max(rules.minimumCharge, tiny)
        : item.id === "symbol-4cm-ankle"
          ? Math.max(rules.minimumCharge, tiny * 1.02)
          : item.id === "object-8cm-forearm"
            ? small
            : item.id === "figure-12cm-upper-arm"
              ? medium
              : item.id === "multi-15cm-calf"
                ? medium * 1.18
                : item.id === "ornamental-small-hard"
                  ? medium * 1.08
                  : item.id === "medium-color-piece"
                    ? medium + colorDelta
                    : Math.max(rules.minimumCharge + coverUpMidpoint, small * 1.08);

    const spread = item.requestType === "cover_up" ? center * 0.12 : center * 0.09;

    return {
      id: item.id,
      min: Math.max(rules.minimumCharge, Math.round(center - spread)),
      max: Math.max(Math.round(center + spread), Math.round(center - spread)),
    };
  });
}

export function buildPricingV2Profile(
  input: BuildPricingV2ProfileInput,
): ArtistPricingV2Profile {
  return {
    version: 2,
    leadPreference: input.leadPreference,
    minimumJobPrice: Math.round(input.minimumJobPrice),
    textStartingPrice: Math.round(input.textStartingPrice),
    colorImpactPreference: input.colorImpactPreference,
    coverUpImpactPreference: input.coverUpImpactPreference,
    onboardingCases: input.onboardingCases.map((item) => ({
      id: item.id,
      min: Math.round(Math.min(item.min, item.max)),
      max: Math.round(Math.max(item.min, item.max)),
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
