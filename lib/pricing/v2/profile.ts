import type {
  ArtistPricingRules,
  ArtistPricingV2Profile,
  LeadPreferenceValue,
  PricingV2CaseAnswer,
  PricingV2SpecialCaseAdjustments,
  PricingV2WideAreaAnswer,
  PricingV2WorkStyleSensitivity,
} from "@/lib/types";
import {
  PRICING_V2_LARGE_AREA_CASE_IDS,
  PRICING_V2_LARGE_AREA_CASES,
  PRICING_V2_ONBOARDING_CASES,
  PRICING_V2_SIZE_SERIES_CASE_IDS,
  PRICING_V2_SPECIAL_CASE_IDS,
  PRICING_V2_WIDE_AREA_CASE_IDS,
  PRICING_V2_WIDE_AREA_CASES,
} from "./onboarding-cases";
import { clamp, midpoint, roundToFriendlyPrice } from "./helpers";
import {
  buildCustomRequestSizeFactor,
  buildCategoryAnchors,
  deriveReviewAdjustments,
  deriveSizeProfileFromOnboarding,
  deriveSizeSeriesFromOnboarding,
} from "./size";

type BuildPricingV2ProfileInput = {
  minimumJobPrice: number;
  textStartingPrice: number;
  onboardingCases: Array<{ id: string; min: number; max: number }>;
  onboardingLargeAreasEnabled?: boolean;
  largeAreaCases?: Array<{ id: string; min: number; max: number }>;
  wideAreaCases?: Array<{ id: string; startingFrom: number }>;
  reviewCases?: Array<{
    id: string;
    verdict: "looks-right" | "slightly-low" | "slightly-high";
    reason?: "size" | "detail" | "placement" | "color_shading" | "cover_up" | "general";
    adjustmentBias?: number;
    iterationCount?: number;
  }>;
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

function getCaseCenter(
  cases: Array<{ id: string; min: number; max: number }>,
  id: string,
  fallback: number,
) {
  const found = cases.find((item) => item.id === id);

  if (!found) {
    return fallback;
  }

  return midpoint(found.min, found.max);
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
    "single-figure-12cm-upper-arm": Math.max(singleAnchor10 * 1.28, minimum * 1.56),
    "advanced-realism-black-grey": Math.max(singleAnchor10 * 1.6, minimum * 1.98),
    "ornamental-small-hard": Math.max(singleAnchor10 * 1.2, minimum * 1.48),
    "medium-color-piece": Math.max(singleAnchor10 * 1.26, minimum * 1.6),
    "small-cover-up": Math.max(singleAnchor10 * 1.14, minimum * 1.4),
  };

  const spreads: Record<string, number> = {
    "object-6cm-forearm": 0.09,
    "object-10cm-forearm": 0.1,
    "object-16cm-forearm": 0.12,
    "single-figure-12cm-upper-arm": 0.12,
    "advanced-realism-black-grey": 0.14,
    "ornamental-small-hard": 0.12,
    "medium-color-piece": 0.13,
    "small-cover-up": 0.15,
  };

  const sizeSeriesCaseIds = new Set<string>(PRICING_V2_SIZE_SERIES_CASE_IDS);
  const specialCaseIds = new Set<string>(PRICING_V2_SPECIAL_CASE_IDS);

  return PRICING_V2_ONBOARDING_CASES.filter(
    (item) => sizeSeriesCaseIds.has(item.id) || specialCaseIds.has(item.id),
  ).map((item) => ({
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

function getRoundedCaseRange(
  cases: Array<{ id: string; min: number; max: number }>,
  id: string,
  fallback: { min: number; max: number },
) {
  const found = cases.find((item) => item.id === id);
  if (!found) {
    return fallback;
  }

  return {
    min: roundToFriendlyPrice(Math.min(found.min, found.max), "down"),
    max: roundToFriendlyPrice(Math.max(found.min, found.max), "up"),
  };
}

function getRoundedStartingFrom(
  cases: Array<{ id: string; startingFrom: number }>,
  id: string,
  fallback: number,
) {
  const found = cases.find((item) => item.id === id);
  return roundToFriendlyPrice(found?.startingFrom ?? fallback, "up");
}

function deriveSpecialCaseAdjustments(
  onboardingCases: Array<{ id: string; min: number; max: number }>,
  minimumJobPrice: number,
  categoryAnchors: ArtistPricingV2Profile["categoryAnchors"],
  inferredSizeProfile: ArtistPricingV2Profile["inferredSizeProfile"],
): PricingV2SpecialCaseAdjustments {
  const sizeContext = { inferredSizeProfile };
  const baselineSingle12 = Math.max(
    minimumJobPrice,
    categoryAnchors.singleObject * buildCustomRequestSizeFactor("single_object", 12, sizeContext).factor,
  );
  const observedSingleFigure = getCaseCenter(
    onboardingCases,
    "single-figure-12cm-upper-arm",
    baselineSingle12 * 1.16,
  );
  const shadedPlusGreyRatio = observedSingleFigure / Math.max(baselineSingle12, 1);
  const blackGreyFactor = clamp(1 + (shadedPlusGreyRatio - 1) * 0.24, 1.03, 1.11);
  const shadedDetailedFactor = clamp(shadedPlusGreyRatio / blackGreyFactor, 1.02, 1.22);
  const baselineSingle11 = Math.max(
    minimumJobPrice,
    categoryAnchors.singleObject * buildCustomRequestSizeFactor("single_object", 11, sizeContext).factor,
  );
  const baselineAdvancedRealism = Math.max(
    minimumJobPrice,
    baselineSingle11 * blackGreyFactor * shadedDetailedFactor,
  );
  const observedAdvancedRealism = getCaseCenter(
    onboardingCases,
    "advanced-realism-black-grey",
    baselineAdvancedRealism * 1.1,
  );
  const advancedRealismFactor = clamp(
    observedAdvancedRealism / Math.max(baselineAdvancedRealism, 1),
    1,
    1.26,
  );

  const observedColorPiece = getCaseCenter(
    onboardingCases,
    "medium-color-piece",
    baselineSingle11 * shadedDetailedFactor * 1.1,
  );
  const fullColorFactor = clamp(
    observedColorPiece / Math.max(baselineSingle11 * shadedDetailedFactor, 1),
    Math.max(blackGreyFactor + 0.04, 1.08),
    1.24,
  );

  const baselinePrecisionPiece = Math.max(
    minimumJobPrice,
    categoryAnchors.multiElement * buildCustomRequestSizeFactor("multi_element", 8, sizeContext).factor * 1.16,
  );
  const observedPrecisionPiece = getCaseCenter(
    onboardingCases,
    "ornamental-small-hard",
    baselinePrecisionPiece * 1.08,
  );
  const precisionSymmetricFactor = clamp(
    observedPrecisionPiece / Math.max(baselinePrecisionPiece, 1),
    1.02,
    1.26,
  );

  const baselineCoverUpComparable = Math.max(
    minimumJobPrice,
    categoryAnchors.singleObject * buildCustomRequestSizeFactor("single_object", 7, sizeContext).factor * 1.08,
  );
  const observedCoverUpPiece = getCaseCenter(
    onboardingCases,
    "small-cover-up",
    baselineCoverUpComparable * 1.12,
  );
  const coverUpPremiumFactor = clamp(
    observedCoverUpPiece / Math.max(baselineCoverUpComparable, 1),
    1.04,
    1.28,
  );

  return {
    blackGreyFactor,
    fullColorFactor,
    shadedDetailedFactor,
    advancedRealismFactor,
    precisionSymmetricFactor,
    coverUpPremiumFactor,
  };
}

type SuggestedLargeAreaInput = {
  minimumJobPrice: number;
  onboardingCases: Array<{ id: string; min: number; max: number }>;
};

export function buildSuggestedLargeAreaCases(
  input: SuggestedLargeAreaInput,
): PricingV2CaseAnswer[] {
  const minimum = Math.max(input.minimumJobPrice, 500);
  const object16 = getRoundedCaseRange(input.onboardingCases, "object-16cm-forearm", {
    min: roundToFriendlyPrice(minimum * 1.8, "down"),
    max: roundToFriendlyPrice(minimum * 2.3, "up"),
  });
  const singleFigure = getRoundedCaseRange(input.onboardingCases, "single-figure-12cm-upper-arm", {
    min: roundToFriendlyPrice(minimum * 1.9, "down"),
    max: roundToFriendlyPrice(minimum * 2.5, "up"),
  });
  const ornamental = getRoundedCaseRange(input.onboardingCases, "ornamental-small-hard", {
    min: roundToFriendlyPrice(minimum * 1.75, "down"),
    max: roundToFriendlyPrice(minimum * 2.35, "up"),
  });

  const centers: Record<string, number> = {
    "forearm-large-coverage": Math.max(midpoint(object16.min, object16.max) * 1.7, minimum * 2.8),
    "calf-large-coverage": Math.max(midpoint(ornamental.min, ornamental.max) * 1.82, minimum * 3),
    "chest-large-coverage": Math.max(midpoint(singleFigure.min, singleFigure.max) * 1.95, minimum * 3.2),
  };

  const spreads: Record<string, number> = {
    "forearm-large-coverage": 0.14,
    "calf-large-coverage": 0.14,
    "chest-large-coverage": 0.16,
  };

  const ids = new Set<string>(PRICING_V2_LARGE_AREA_CASE_IDS);

  return PRICING_V2_LARGE_AREA_CASES.filter((item) => ids.has(item.id)).map((item) => ({
    id: item.id,
    ...buildRoundedBand(centers[item.id] ?? minimum * 3, spreads[item.id] ?? 0.15, minimum * 2),
  }));
}

export function buildSuggestedWideAreaCases(
  largeAreaCases: Array<{ id: string; min: number; max: number }>,
  minimumJobPrice: number,
): PricingV2WideAreaAnswer[] {
  const minimum = Math.max(minimumJobPrice, 500);
  const forearmLarge = getRoundedCaseRange(largeAreaCases, "forearm-large-coverage", {
    min: roundToFriendlyPrice(minimum * 2.8, "down"),
    max: roundToFriendlyPrice(minimum * 3.4, "up"),
  });
  const chestLarge = getRoundedCaseRange(largeAreaCases, "chest-large-coverage", {
    min: roundToFriendlyPrice(minimum * 3.2, "down"),
    max: roundToFriendlyPrice(minimum * 3.9, "up"),
  });

  const starts: Record<string, number> = {
    "half-sleeve": Math.max(forearmLarge.max * 1.55, minimum * 4.8),
    "full-sleeve": Math.max(forearmLarge.max * 2.8, minimum * 8.4),
    "back-large-coverage": Math.max(chestLarge.max * 2.1, minimum * 7.2),
  };

  const ids = new Set<string>(PRICING_V2_WIDE_AREA_CASE_IDS);

  return PRICING_V2_WIDE_AREA_CASES.filter((item) => ids.has(item.id)).map((item) => ({
    id: item.id,
    startingFrom: roundToFriendlyPrice(starts[item.id] ?? minimum * 5, "up"),
  }));
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
  const specialCaseAdjustments = deriveSpecialCaseAdjustments(
    onboardingCases,
    minimumJobPrice,
    categoryAnchors,
    inferredSizeProfile,
  );
  const largeAreaCases = (input.largeAreaCases ?? []).map((item) => ({
    id: item.id,
    min: roundToFriendlyPrice(Math.min(item.min, item.max), "down"),
    max: roundToFriendlyPrice(Math.max(item.min, item.max), "up"),
  }));
  const wideAreaCases = (input.wideAreaCases ?? []).map((item) => ({
    id: item.id,
    startingFrom: roundToFriendlyPrice(item.startingFrom, "up"),
  }));

  return {
    version: 2,
    leadPreference: getDefaultLeadPreference(),
    minimumJobPrice,
    textStartingPrice: roundToFriendlyPrice(input.textStartingPrice, "up"),
    colorImpactPreference: "medium",
    coverUpImpactPreference: "medium",
    onboardingCases,
    onboardingLargeAreasEnabled: input.onboardingLargeAreasEnabled ?? false,
    largeAreaCases,
    wideAreaCases,
    reviewCases: (input.reviewCases ?? []).map((item) => ({
      id: item.id,
      verdict: item.verdict,
      reason: item.reason,
      adjustmentBias:
        typeof item.adjustmentBias === "number"
          ? clamp(item.adjustmentBias, 0.78, 1.34)
          : undefined,
      iterationCount: Math.max(0, item.iterationCount ?? 0),
    })),
    sizeSeries,
    inferredSizeProfile,
    reviewAdjustments,
    categoryAnchors,
    specialCaseAdjustments,
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
    const fallbackLargeAreaCases = buildSuggestedLargeAreaCases({
      minimumJobPrice: storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      onboardingCases: mergedCases,
    });
    const mergedLargeAreaCases = fallbackLargeAreaCases.map((fallbackCase) => {
      const found = storedProfile.largeAreaCases?.find((item) => item.id === fallbackCase.id);
      return found ?? fallbackCase;
    });
    const fallbackWideAreaCases = buildSuggestedWideAreaCases(
      mergedLargeAreaCases,
      storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
    );
    const mergedWideAreaCases = fallbackWideAreaCases.map((fallbackCase) => {
      const found = storedProfile.wideAreaCases?.find((item) => item.id === fallbackCase.id);
      return found ?? fallbackCase;
    });

    return buildPricingV2Profile({
      minimumJobPrice: storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      textStartingPrice: storedProfile.textStartingPrice ?? storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      onboardingCases: mergedCases,
      onboardingLargeAreasEnabled: storedProfile.onboardingLargeAreasEnabled ?? false,
      largeAreaCases: mergedLargeAreaCases,
      wideAreaCases: mergedWideAreaCases,
      reviewCases: storedProfile.reviewCases ?? [],
    });
  }

  const fallbackCases = buildFallbackCases(rules);
  const minimumJobPrice = rules.minimumCharge || rules.minimumSessionPrice || 1500;
  const textStartingPrice = Math.min(
    minimumJobPrice,
    roundToFriendlyPrice(minimumJobPrice * 0.9, "down"),
  );
  const fallbackLargeAreaCases = buildSuggestedLargeAreaCases({
    minimumJobPrice,
    onboardingCases: fallbackCases,
  });
  const fallbackWideAreaCases = buildSuggestedWideAreaCases(fallbackLargeAreaCases, minimumJobPrice);

  return buildPricingV2Profile({
    minimumJobPrice,
    textStartingPrice,
    onboardingCases: fallbackCases,
    onboardingLargeAreasEnabled: false,
    largeAreaCases: fallbackLargeAreaCases,
    wideAreaCases: fallbackWideAreaCases,
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
