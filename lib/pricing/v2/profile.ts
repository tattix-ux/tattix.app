import type {
  ArtistPricingRules,
  ArtistPricingV2Profile,
  LeadPreferenceValue,
  PricingV2WorkStyleSensitivity,
} from "@/lib/types";
import { PRICING_V2_ONBOARDING_CASES, PRICING_V2_SIZE_SERIES_CASE_IDS } from "./onboarding-cases";
import { midpoint, roundToFriendlyPrice } from "./helpers";
import {
  buildCategoryAnchors,
  deriveReviewAdjustments,
  deriveSizeProfileFromOnboarding,
  deriveSizeSeriesFromOnboarding,
} from "./size";

type BuildPricingV2ProfileInput = {
  minimumJobPrice: number;
  textStartingPrice: number;
  onboardingCases: Array<{ id: string; min: number; max: number }>;
  reviewCases?: Array<{ id: string; verdict: "looks-right" | "slightly-low" | "slightly-high" }>;
};

function getDefaultWorkStyleSensitivity(): PricingV2WorkStyleSensitivity {
  return {
    cleanLine: "medium",
    shadedDetailed: "medium",
    precisionSymmetric: "medium",
  };
}

function getDefaultLeadPreference(): LeadPreferenceValue {
  return "balanced";
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
};

export function buildSuggestedOnboardingCases(input: SuggestedCaseInput) {
  const minimum = Math.max(input.minimumJobPrice, 500);
  const textBase = Math.max(input.textStartingPrice, minimum * 0.94);
  const singleAnchor10 = Math.max(minimum * 1.34, textBase * 1.2);
  const single6 = singleAnchor10 * Math.pow(6 / 10, 0.58);
  const single16 = singleAnchor10 * Math.pow(16 / 10, 0.62);

  const centers: Record<string, number> = {
    "object-6cm-forearm": Math.max(minimum * 1.14, single6),
    "object-10cm-forearm": singleAnchor10,
    "object-16cm-forearm": Math.max(singleAnchor10 * 1.42, single16),
  };

  const spreads: Record<string, number> = {
    "object-6cm-forearm": 0.09,
    "object-10cm-forearm": 0.1,
    "object-16cm-forearm": 0.12,
  };

  const sizeSeriesCaseIds = new Set<string>(PRICING_V2_SIZE_SERIES_CASE_IDS);

  return PRICING_V2_ONBOARDING_CASES.filter((item) => sizeSeriesCaseIds.has(item.id)).map((item) => ({
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
  });
}

export function buildPricingV2Profile(
  input: BuildPricingV2ProfileInput,
): ArtistPricingV2Profile {
  const minimumJobPrice = roundToFriendlyPrice(input.minimumJobPrice, "up");
  const reviewAdjustments = deriveReviewAdjustments(input.reviewCases ?? []);
  const onboardingCases = input.onboardingCases.map((item) => ({
    id: item.id,
    min: roundToFriendlyPrice(Math.min(item.min, item.max), "down"),
    max: roundToFriendlyPrice(Math.max(item.min, item.max), "up"),
  }));
  const sizeSeries = deriveSizeSeriesFromOnboarding(onboardingCases, minimumJobPrice, reviewAdjustments);
  const inferredSizeProfile = deriveSizeProfileFromOnboarding(onboardingCases, minimumJobPrice, reviewAdjustments);
  const categoryAnchors = buildCategoryAnchors(
    onboardingCases,
    minimumJobPrice,
    roundToFriendlyPrice(input.textStartingPrice, "up"),
    reviewAdjustments,
  );

  return {
    version: 2,
    leadPreference: getDefaultLeadPreference(),
    minimumJobPrice,
    textStartingPrice: roundToFriendlyPrice(input.textStartingPrice, "up"),
    colorImpactPreference: "medium",
    coverUpImpactPreference: "medium",
    onboardingCases,
    reviewCases: (input.reviewCases ?? []).map((item) => ({
      id: item.id,
      verdict: item.verdict,
    })),
    sizeSeries,
    inferredSizeProfile,
    reviewAdjustments,
    categoryAnchors,
    workStyleSensitivity: getDefaultWorkStyleSensitivity(),
    onboardingCompleted: true,
  };
}

export function getArtistPricingV2Profile(rules: ArtistPricingRules): ArtistPricingV2Profile {
  if (rules.calibrationExamples.pricingV2Profile?.version === 2) {
    const storedProfile = rules.calibrationExamples.pricingV2Profile;
    const fallbackCases = buildFallbackCases(rules);
    const mergedCases = fallbackCases.map((fallbackCase) => {
      const found = storedProfile.onboardingCases.find((item) => item.id === fallbackCase.id);
      return found ?? fallbackCase;
    });

    return buildPricingV2Profile({
      minimumJobPrice: storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      textStartingPrice: storedProfile.textStartingPrice ?? storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      onboardingCases: mergedCases,
      reviewCases: storedProfile.reviewCases ?? [],
    });
  }

  const fallbackCases = buildFallbackCases(rules);
  const minimumJobPrice = rules.minimumCharge || rules.minimumSessionPrice || 1500;
  const textStartingPrice = Math.min(
    minimumJobPrice,
    roundToFriendlyPrice(minimumJobPrice * 0.9, "down"),
  );

  return buildPricingV2Profile({
    minimumJobPrice,
    textStartingPrice,
    onboardingCases: fallbackCases,
    reviewCases: [],
  });
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
