import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { SizeValue } from "@/lib/constants/options";
import type {
  ArtistPricingRules,
  ColorModeValue,
  DetailLevelValue,
  PriceRange,
  PricingCalibrationExamples,
  SubmissionRequest,
} from "@/lib/types";
import { roundToNearestFifty } from "@/lib/utils";

type SurchargeRange = {
  min: number;
  max: number;
};

export type NormalizedQuoteInput = {
  size: SizeValue;
  sizeCm: number;
  placement: BodyAreaDetailValue;
  detailLevel?: DetailLevelValue | null;
  colorMode?: ColorModeValue | null;
  coverUp?: boolean | null;
  customDesign?: boolean | null;
  designType?: string | null;
};

export type NormalizedQuoteConfig = {
  anchorPrice: number;
  minimumCharge: number;
  validationAdjustment: number;
  baselinePrice: number;
  sizeCurvePoints: Record<"8" | "12" | "18" | "25", number>;
  hardPlacementDetails: Set<BodyAreaDetailValue>;
  detailSurcharges: Record<DetailLevelValue, SurchargeRange>;
  placementSurcharges: {
    easy: SurchargeRange;
    hard: SurchargeRange;
    "not-sure": SurchargeRange;
  };
  colorSurcharges: Record<ColorModeValue, SurchargeRange>;
};

type QuoteResult = {
  min: number;
  max: number;
};

const DEFAULT_DETAIL_LEVEL: DetailLevelValue = "standard";
const DEFAULT_COLOR_MODE: ColorModeValue = "black-grey";
const SIZE_CURVE_KEYS = ["8", "12", "18", "25"] as const;
const DEFAULT_HARD_PLACEMENTS = new Set<BodyAreaDetailValue>([
  "ribs",
  "spine-area",
  "neck-front",
  "neck-side",
  "hand",
  "fingers",
  "foot",
  "toes",
  "ankle",
  "wrist",
  "head",
]);

function isFinitePositive(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function midpoint(range: PriceRange | undefined) {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) {
    return null;
  }

  return (range.min + range.max) / 2;
}

function deriveAnchorPrice(rules: ArtistPricingRules) {
  return (
    rules.anchorPrice ??
    rules.basePrice ??
    rules.minimumCharge ??
    rules.minimumSessionPrice ??
    midpoint(rules.sizeBaseRanges.small) ??
    1000
  );
}

function clampRange(range: SurchargeRange | undefined, fallback: SurchargeRange): SurchargeRange {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) {
    return fallback;
  }

  return {
    min: Math.min(range.min, range.max),
    max: Math.max(range.min, range.max),
  };
}

function createCenteredRange(center: number, spread: number, floor?: number): SurchargeRange {
  const rawMin = center - spread;
  const min = typeof floor === "number" ? Math.max(floor, rawMin) : rawMin;
  const max = Math.max(min, center + spread);

  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
  };
}

function createFactorFallback(center: number, spread: number, floor = 0.25) {
  return {
    min: Math.max(floor, Number((center - spread).toFixed(4))),
    max: Math.max(Math.max(floor, Number((center - spread).toFixed(4))), Number((center + spread).toFixed(4))),
  };
}

function deriveSizeFactorFallbacks(rules: ArtistPricingRules, anchorPrice: number) {
  const derive = (size: SizeValue, fallbackCenter: number, fallbackSpread: number) => {
    const baseMidpoint = midpoint(rules.sizeBaseRanges[size]);

    if (isFinitePositive(baseMidpoint) && isFinitePositive(anchorPrice)) {
      const factor = Number(baseMidpoint) / anchorPrice;
      return createFactorFallback(factor, fallbackSpread);
    }

    return createFactorFallback(fallbackCenter, fallbackSpread);
  };

  return {
    tiny: derive("tiny", 0.72, 0.08),
    small: derive("small", 1, 0.06),
    medium: derive("medium", 1.4, 0.08),
    large: derive("large", 2.1, 0.12),
  } satisfies Record<SizeValue, { min: number; max: number }>;
}

function deriveRepresentativeSizeCm(input: SubmissionRequest) {
  if (
    typeof input.approximateSizeCm === "number" &&
    Number.isFinite(input.approximateSizeCm) &&
    input.approximateSizeCm > 0
  ) {
    return input.approximateSizeCm;
  }

  const width = typeof input.widthCm === "number" && Number.isFinite(input.widthCm) ? input.widthCm : null;
  const height = typeof input.heightCm === "number" && Number.isFinite(input.heightCm) ? input.heightCm : null;

  if (width && height) {
    return Math.max(width, height);
  }

  if (width) {
    return width;
  }

  const fallbackByCategory: Record<SizeValue, number> = {
    tiny: 8,
    small: 12,
    medium: 18,
    large: 25,
  };

  return fallbackByCategory[input.sizeCategory] ?? 12;
}

function hasCalibrationExamples(examples: PricingCalibrationExamples | undefined) {
  return Boolean(
    examples &&
      examples.sizeCurve &&
      SIZE_CURVE_KEYS.every((key) => isFinitePositive(examples.sizeCurve?.[key])) &&
      isFinitePositive(examples.detailLevel.standard) &&
      isFinitePositive(examples.colorMode["black-only"]),
  );
}

function collectHardPlacementDetails(rules: ArtistPricingRules) {
  const derived = Object.entries(rules.placementModifiers ?? {})
    .filter(([, range]) => midpoint(range) !== null)
    .filter(([, range]) => (midpoint(range) ?? 1) >= 1.12)
    .map(([key]) => key as BodyAreaDetailValue);

  if (derived.length > 0) {
    return new Set(derived);
  }

  const legacyDerived = Object.entries(rules.placementMultipliers ?? {})
    .filter(([, multiplier]) => Number.isFinite(multiplier) && multiplier >= 1.12)
    .map(([key]) => key as BodyAreaDetailValue);

  if (legacyDerived.length > 0) {
    return new Set(legacyDerived);
  }

  return DEFAULT_HARD_PLACEMENTS;
}

function deriveSizeCurvePoints(
  rules: ArtistPricingRules,
  anchorPrice: number,
) {
  const calibrationCurve = rules.calibrationExamples.sizeCurve;
  if (hasCalibrationExamples(rules.calibrationExamples) && calibrationCurve) {
    return {
      "8": calibrationCurve["8"],
      "12": calibrationCurve["12"],
      "18": calibrationCurve["18"],
      "25": calibrationCurve["25"],
    } as Record<"8" | "12" | "18" | "25", number>;
  }

  const fallbackFactors = deriveSizeFactorFallbacks(rules, anchorPrice);

  return {
    "8": Math.max(Math.round(anchorPrice * midpoint(fallbackFactors.tiny as PriceRange)!), 1),
    "12": Math.max(Math.round(anchorPrice * midpoint(fallbackFactors.small as PriceRange)!), 1),
    "18": Math.max(Math.round(anchorPrice * midpoint(fallbackFactors.medium as PriceRange)!), 1),
    "25": Math.max(Math.round(anchorPrice * midpoint(fallbackFactors.large as PriceRange)!), 1),
  };
}

function interpolateBetweenPoints(
  sizeCm: number,
  points: Record<"8" | "12" | "18" | "25", number>,
) {
  const clampedCm = Math.max(8, Math.min(25, sizeCm));
  const ordered = [
    { cm: 8, value: points["8"] },
    { cm: 12, value: points["12"] },
    { cm: 18, value: points["18"] },
    { cm: 25, value: points["25"] },
  ];

  let left = ordered[0];
  let right = ordered[ordered.length - 1];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    if (clampedCm >= ordered[index].cm && clampedCm <= ordered[index + 1].cm) {
      left = ordered[index];
      right = ordered[index + 1];
      break;
    }
  }

  const span = Math.max(right.cm - left.cm, 1);
  const mix = (clampedCm - left.cm) / span;
  return left.value + (right.value - left.value) * mix;
}

function deriveBaselinePrice(anchorPrice: number, rules: ArtistPricingRules, sizeCurvePoints: Record<"8" | "12" | "18" | "25", number>) {
  const calibratedBaseline =
    rules.calibrationExamples.sizeCurve?.["12"] ??
    rules.calibrationExamples.detailLevel.standard ??
    rules.calibrationExamples.placementDifficulty?.easy ??
    rules.calibrationExamples.colorMode["black-only"] ??
    sizeCurvePoints["12"];

  return Math.max(anchorPrice, calibratedBaseline, 100);
}

function deriveDetailSurcharges(
  rules: ArtistPricingRules,
  baselinePrice: number,
) {
  const standardPrice =
    rules.calibrationExamples.detailLevel.standard ??
    baselinePrice;

  if (isFinitePositive(standardPrice)) {
    const simplePrice = rules.calibrationExamples.detailLevel.simple ?? standardPrice;
    const detailedPrice = rules.calibrationExamples.detailLevel.detailed ?? Math.round(standardPrice * 1.18);
    const ultraPrice = rules.calibrationExamples.detailLevel.ultra ?? Math.round(detailedPrice * 1.12);

    return {
      simple: createCenteredRange(simplePrice - standardPrice, Math.max(40, standardPrice * 0.03)),
      standard: { min: 0, max: 0 },
      detailed: createCenteredRange(detailedPrice - standardPrice, Math.max(60, standardPrice * 0.04), 0),
      ultra: createCenteredRange(ultraPrice - standardPrice, Math.max(80, standardPrice * 0.05), 0),
    };
  }

  const standardFactor = midpoint(rules.detailLevelModifiers.standard) ?? 1;
  const factorDelta = (factor: number | null, fallback = 1) => ((factor ?? fallback) - standardFactor) * baselinePrice;

  return {
    simple: createCenteredRange(factorDelta(midpoint(rules.detailLevelModifiers.simple), 0.92), Math.max(40, baselinePrice * 0.03)),
    standard: { min: 0, max: 0 },
    detailed: createCenteredRange(
      factorDelta(midpoint(rules.detailLevelModifiers.detailed), 1.22),
      Math.max(60, baselinePrice * 0.04),
      0,
    ),
    ultra: createCenteredRange(
      factorDelta((midpoint(rules.detailLevelModifiers.detailed) ?? 1.22) * 1.12, 1.34),
      Math.max(80, baselinePrice * 0.05),
      0,
    ),
  };
}

function derivePlacementSurcharges(
  rules: ArtistPricingRules,
  baselinePrice: number,
  hardPlacementDetails: Set<BodyAreaDetailValue>,
) {
  const calibrationEasy = rules.calibrationExamples.placementDifficulty?.easy;
  const calibrationHard = rules.calibrationExamples.placementDifficulty?.hard;

  if (isFinitePositive(calibrationEasy) && isFinitePositive(calibrationHard)) {
    const safeEasy = Number(calibrationEasy);
    const safeHard = Number(calibrationHard);
    const hardDelta = safeHard - safeEasy;
    return {
      easy: { min: 0, max: 0 },
      hard: createCenteredRange(hardDelta, Math.max(50, safeEasy * 0.03), 0),
      "not-sure": createCenteredRange(hardDelta * 0.45, Math.max(30, safeEasy * 0.02), 0),
    };
  }

  const placementEntries = Object.entries(rules.placementModifiers ?? {}) as Array<[BodyAreaDetailValue, PriceRange]>;
  const easyFactors = placementEntries
    .filter(([key]) => !hardPlacementDetails.has(key))
    .map(([, range]) => midpoint(range))
    .filter((value): value is number => value !== null);
  const hardFactors = placementEntries
    .filter(([key]) => hardPlacementDetails.has(key))
    .map(([, range]) => midpoint(range))
    .filter((value): value is number => value !== null);

  const easyMid = easyFactors.length > 0 ? easyFactors.reduce((sum, value) => sum + value, 0) / easyFactors.length : 1;
  const hardMid =
    hardFactors.length > 0
      ? hardFactors.reduce((sum, value) => sum + value, 0) / hardFactors.length
      : Math.max(easyMid, 1.18);
  const hardDelta = Math.max(0, (hardMid - easyMid) * baselinePrice);

  return {
    easy: { min: 0, max: 0 },
    hard: createCenteredRange(hardDelta, Math.max(50, baselinePrice * 0.03), 0),
    "not-sure": createCenteredRange(hardDelta * 0.45, Math.max(30, baselinePrice * 0.02), 0),
  };
}

function deriveColorSurcharges(
  rules: ArtistPricingRules,
  baselinePrice: number,
) {
  const blackPrice =
    rules.calibrationExamples.colorMode["black-only"] ??
    baselinePrice;
  const fullColorPrice =
    rules.calibrationExamples.colorMode["full-color"] ??
    Math.round(blackPrice * 1.22);
  const blackGreyPrice =
    rules.calibrationExamples.colorMode["black-grey"] ??
    Math.round(blackPrice + (fullColorPrice - blackPrice) * 0.5);

  if (isFinitePositive(blackPrice)) {
    return {
      "black-only": { min: 0, max: 0 },
      "black-grey": createCenteredRange(blackGreyPrice - blackPrice, Math.max(35, blackPrice * 0.025), 0),
      "full-color": createCenteredRange(fullColorPrice - blackPrice, Math.max(50, blackPrice * 0.03), 0),
    };
  }

  const blackMid = midpoint(rules.colorModeModifiers["black-only"]) ?? 1;
  const blackGreyMid = midpoint(rules.colorModeModifiers["black-grey"]) ?? 1.05;
  const fullColorMid = midpoint(rules.colorModeModifiers["full-color"]) ?? 1.22;

  return {
    "black-only": { min: 0, max: 0 },
    "black-grey": createCenteredRange((blackGreyMid - blackMid) * baselinePrice, Math.max(35, baselinePrice * 0.025), 0),
    "full-color": createCenteredRange((fullColorMid - blackMid) * baselinePrice, Math.max(50, baselinePrice * 0.03), 0),
  };
}

function getDetailSizeWeight(sizeCm: number) {
  const clampedCm = Math.max(8, Math.min(25, sizeCm));

  if (clampedCm <= 12) {
    return 0.85 + ((clampedCm - 8) / 4) * 0.15;
  }

  return 1 + ((clampedCm - 12) / 13) * 0.25;
}

function getPlacementSizeWeight(sizeCm: number) {
  const clampedCm = Math.max(8, Math.min(25, sizeCm));

  if (clampedCm <= 12) {
    return 0.9 + ((clampedCm - 8) / 4) * 0.1;
  }

  return 1 + ((clampedCm - 12) / 13) * 0.15;
}

function getColorSizeWeight(sizeCm: number) {
  const clampedCm = Math.max(8, Math.min(25, sizeCm));

  if (clampedCm <= 12) {
    return 0.9 + ((clampedCm - 8) / 4) * 0.1;
  }

  return 1 + ((clampedCm - 12) / 13) * 0.2;
}

function scaleSurcharge(range: SurchargeRange, weight: number) {
  return {
    min: range.min * weight,
    max: range.max * weight,
  };
}

function resolvePlacementBucket(
  placement: BodyAreaDetailValue,
  hardPlacementDetails: Set<BodyAreaDetailValue>,
) {
  if (placement === "placement-not-sure") {
    return "not-sure" as const;
  }

  return hardPlacementDetails.has(placement) ? "hard" : "easy";
}

function buildUncertaintyBand(
  input: NormalizedQuoteInput,
  placementBucket: "easy" | "hard" | "not-sure",
) {
  let band = 0.06;

  if ((input.detailLevel ?? DEFAULT_DETAIL_LEVEL) === "simple") {
    band -= 0.01;
  }

  if ((input.detailLevel ?? DEFAULT_DETAIL_LEVEL) === "detailed") {
    band += 0.015;
  }

  if ((input.colorMode ?? DEFAULT_COLOR_MODE) === "black-grey") {
    band += 0.01;
  }

  if ((input.colorMode ?? DEFAULT_COLOR_MODE) === "full-color") {
    band += 0.02;
  }

  if (placementBucket === "hard") {
    band += 0.01;
  }

  if (placementBucket === "not-sure") {
    band += 0.005;
  }

  if (input.sizeCm >= 18) {
    band += 0.01;
  }

  if (input.sizeCm >= 25) {
    band += 0.01;
  }

  return Math.min(0.12, Math.max(0.05, band));
}

export function buildNormalizedQuoteConfig(
  rules: ArtistPricingRules,
): NormalizedQuoteConfig {
  const anchorPrice = Math.max(deriveAnchorPrice(rules), 100);
  const sizeCurvePoints = deriveSizeCurvePoints(rules, anchorPrice);
  const baselinePrice = deriveBaselinePrice(anchorPrice, rules, sizeCurvePoints);
  const hardPlacementDetails = collectHardPlacementDetails(rules);

  return {
    anchorPrice,
    minimumCharge: Math.max(
      0,
      rules.minimumCharge ?? rules.minimumSessionPrice ?? Math.round(anchorPrice * 0.9),
    ),
    validationAdjustment:
      typeof rules.calibrationExamples.globalScale === "number" &&
      Number.isFinite(rules.calibrationExamples.globalScale) &&
      rules.calibrationExamples.globalScale > 0
        ? rules.calibrationExamples.globalScale
        : 1,
    baselinePrice,
    sizeCurvePoints,
    hardPlacementDetails,
    detailSurcharges: {
      simple: clampRange(deriveDetailSurcharges(rules, baselinePrice).simple, { min: -120, max: -40 }),
      standard: { min: 0, max: 0 },
      detailed: clampRange(deriveDetailSurcharges(rules, baselinePrice).detailed, { min: 180, max: 320 }),
    },
    placementSurcharges: derivePlacementSurcharges(rules, baselinePrice, hardPlacementDetails),
    colorSurcharges: deriveColorSurcharges(rules, baselinePrice),
  };
}

export function buildNormalizedQuoteInput(
  submission: SubmissionRequest,
): NormalizedQuoteInput {
  return {
    size: submission.sizeCategory,
    sizeCm: deriveRepresentativeSizeCm(submission),
    placement: submission.bodyAreaDetail,
    detailLevel: submission.detailLevel ?? DEFAULT_DETAIL_LEVEL,
    colorMode: submission.colorMode ?? DEFAULT_COLOR_MODE,
    coverUp: submission.coverUp ?? false,
    customDesign:
      submission.customDesign ??
      (!submission.selectedDesignId &&
        submission.intent !== "flash-design" &&
        submission.intent !== "discounted-design"),
    designType: submission.designType ?? submission.intent,
  };
}

export function estimateNormalizedQuote(
  input: NormalizedQuoteInput,
  config: NormalizedQuoteConfig,
): QuoteResult {
  const baseSizePrice = interpolateBetweenPoints(input.sizeCm, config.sizeCurvePoints);
  const detailWeight = getDetailSizeWeight(input.sizeCm);
  const placementWeight = getPlacementSizeWeight(input.sizeCm);
  const colorWeight = getColorSizeWeight(input.sizeCm);
  const detailRange = scaleSurcharge(
    config.detailSurcharges[input.detailLevel ?? DEFAULT_DETAIL_LEVEL] ??
      config.detailSurcharges[DEFAULT_DETAIL_LEVEL],
    detailWeight,
  );
  const placementBucket = resolvePlacementBucket(input.placement, config.hardPlacementDetails);
  const placementRange = scaleSurcharge(
    config.placementSurcharges[placementBucket],
    placementWeight,
  );
  const colorRange = scaleSurcharge(
    config.colorSurcharges[input.colorMode ?? DEFAULT_COLOR_MODE] ??
      config.colorSurcharges[DEFAULT_COLOR_MODE],
    colorWeight,
  );

  const centralEstimate =
    (baseSizePrice +
      (detailRange.min + detailRange.max) / 2 +
      (placementRange.min + placementRange.max) / 2 +
      (colorRange.min + colorRange.max) / 2) *
    config.validationAdjustment;
  const uncertaintyBand = buildUncertaintyBand(input, placementBucket);
  const rangeMin =
    (baseSizePrice + detailRange.min + placementRange.min + colorRange.min) *
    config.validationAdjustment;
  const rangeMax =
    (baseSizePrice + detailRange.max + placementRange.max + colorRange.max) *
    config.validationAdjustment;

  const rawMin = Math.min(rangeMin, centralEstimate * (1 - uncertaintyBand));
  const rawMax = Math.max(rangeMax, centralEstimate * (1 + uncertaintyBand));

  const roundedMin = Math.max(roundToNearestFifty(rawMin), config.minimumCharge, config.anchorPrice);
  const roundedMax = Math.max(roundToNearestFifty(rawMax), roundedMin);

  return {
    min: roundedMin,
    max: roundedMax,
  };
}
