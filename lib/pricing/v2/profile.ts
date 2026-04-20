import type {
  ArtistPricingRules,
  ArtistPricingV2Profile,
  ColorImpactPreferenceValue,
  CoverUpImpactPreferenceValue,
  LeadPreferenceValue,
  PricingV2WorkStyleSensitivity,
} from "@/lib/types";
import { PRICING_V2_ONBOARDING_CASES } from "./onboarding-cases";
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
  colorImpactPreference: ColorImpactPreferenceValue;
  coverUpImpactPreference: CoverUpImpactPreferenceValue;
  workStyleSensitivity: {
    clean_line: PricingV2WorkStyleSensitivity["cleanLine"];
    shaded_detailed: PricingV2WorkStyleSensitivity["shadedDetailed"];
    precision_symmetric: PricingV2WorkStyleSensitivity["precisionSymmetric"];
  };
  leadPreference: LeadPreferenceValue;
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
  if (coverUpMidpoint < 500) {
    return "low";
  }

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
  workStyleSensitivity: BuildPricingV2ProfileInput["workStyleSensitivity"];
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
  const coverUpMultiplier =
    input.coverUpImpactPreference === "low"
      ? 1.08
      : input.coverUpImpactPreference === "medium"
        ? 1.2
        : 1.34;
  const cleanLineMultiplier =
    input.workStyleSensitivity.clean_line === "low"
      ? 0.98
      : input.workStyleSensitivity.clean_line === "medium"
        ? 1.02
        : 1.06;
  const shadedMultiplier =
    input.workStyleSensitivity.shaded_detailed === "low"
      ? 1.02
      : input.workStyleSensitivity.shaded_detailed === "medium"
        ? 1.08
        : 1.14;
  const precisionMultiplier =
    input.workStyleSensitivity.precision_symmetric === "low"
      ? 1.02
      : input.workStyleSensitivity.precision_symmetric === "medium"
        ? 1.08
        : 1.15;
  const singleAnchor10 = Math.max(minimum * 1.34, textBase * 1.2);
  const single6 = singleAnchor10 * Math.pow(6 / 10, 0.58);
  const single16 = singleAnchor10 * Math.pow(16 / 10, 0.62);

  const centers: Record<string, number> = {
    "text-4cm-wrist": Math.max(textBase, minimum * 0.96) * cleanLineMultiplier,
    "symbol-4cm-ankle": Math.max(minimum, textBase * 1.04) * cleanLineMultiplier,
    "object-6cm-forearm": Math.max(minimum * 1.14, single6) * cleanLineMultiplier,
    "object-10cm-forearm": singleAnchor10 * cleanLineMultiplier,
    "object-16cm-forearm": Math.max(singleAnchor10 * 1.42, single16) * cleanLineMultiplier,
    "ornamental-small-hard": Math.max(minimum * 1.54, textBase * 1.42) * precisionMultiplier,
    "medium-color-piece": Math.max(singleAnchor10 * 1.12, minimum * 1.56) * colorMultiplier * shadedMultiplier,
    "small-cover-up": Math.max(minimum * 1.36, textBase * 1.12) * coverUpMultiplier,
  };

  const spreads: Record<string, number> = {
    "text-4cm-wrist": 0.08,
    "symbol-4cm-ankle": 0.09,
    "object-6cm-forearm": 0.09,
    "object-10cm-forearm": 0.1,
    "object-16cm-forearm": 0.12,
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
    workStyleSensitivity: {
      clean_line: "medium",
      shaded_detailed: "medium",
      precision_symmetric: "medium",
    },
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
  const categoryAnchors = buildCategoryAnchors(onboardingCases, minimumJobPrice, reviewAdjustments);
  const workStyleSensitivity: PricingV2WorkStyleSensitivity = {
    cleanLine: input.workStyleSensitivity.clean_line,
    shadedDetailed: input.workStyleSensitivity.shaded_detailed,
    precisionSymmetric: input.workStyleSensitivity.precision_symmetric,
  };

  return {
    version: 2,
    leadPreference: input.leadPreference,
    minimumJobPrice,
    textStartingPrice: roundToFriendlyPrice(input.textStartingPrice, "up"),
    colorImpactPreference: input.colorImpactPreference,
    coverUpImpactPreference: input.coverUpImpactPreference,
    onboardingCases,
    reviewCases: (input.reviewCases ?? []).map((item) => ({
      id: item.id,
      verdict: item.verdict,
    })),
    sizeSeries,
    inferredSizeProfile,
    reviewAdjustments,
    categoryAnchors,
    workStyleSensitivity,
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

    const workStyleSensitivity = storedProfile.workStyleSensitivity ?? getDefaultWorkStyleSensitivity();

    return buildPricingV2Profile({
      minimumJobPrice: storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      textStartingPrice: storedProfile.textStartingPrice ?? storedProfile.minimumJobPrice ?? rules.minimumCharge ?? 1500,
      colorImpactPreference: storedProfile.colorImpactPreference ?? deriveColorImpactPreference(rules),
      coverUpImpactPreference: storedProfile.coverUpImpactPreference ?? deriveCoverUpImpactPreference(rules),
      workStyleSensitivity: {
        clean_line: workStyleSensitivity.cleanLine,
        shaded_detailed: workStyleSensitivity.shadedDetailed,
        precision_symmetric: workStyleSensitivity.precisionSymmetric,
      },
      leadPreference: storedProfile.leadPreference ?? "balanced",
      onboardingCases: mergedCases,
      reviewCases: storedProfile.reviewCases ?? [],
    });
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
    workStyleSensitivity: {
      clean_line: "medium",
      shaded_detailed: "medium",
      precision_symmetric: "medium",
    },
    leadPreference,
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
