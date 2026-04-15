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

type FactorRange = {
  min: number;
  max: number;
};

export type NormalizedQuoteInput = {
  size: SizeValue;
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
  sizeFactors: Record<SizeValue, FactorRange>;
  placementFactors: Partial<Record<BodyAreaDetailValue, FactorRange>>;
  detailLevelFactors: Record<DetailLevelValue, FactorRange>;
  colorModeFactors: Record<ColorModeValue, FactorRange>;
};

type QuoteResult = {
  min: number;
  max: number;
};

const DEFAULT_DETAIL_LEVEL: DetailLevelValue = "standard";
const DEFAULT_COLOR_MODE: ColorModeValue = "black-grey";

function isFinitePositive(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function clampFactorRange(range: FactorRange | undefined, fallback: FactorRange): FactorRange {
  if (!range || !isFinitePositive(range.min) || !isFinitePositive(range.max)) {
    return fallback;
  }

  return {
    min: Math.max(0.25, range.min),
    max: Math.max(range.min, range.max),
  };
}

function midpoint(range: PriceRange | undefined) {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) {
    return null;
  }

  return (range.min + range.max) / 2;
}

function deriveBasePrice(rules: ArtistPricingRules) {
  return (
    rules.anchorPrice ??
    rules.basePrice ??
    midpoint(rules.sizeBaseRanges.medium) ??
    midpoint(rules.sizeBaseRanges.small) ??
    rules.minimumSessionPrice ??
    1000
  );
}

function buildFactorRangeFromCalibratedPrice(
  examplePrice: number | null | undefined,
  anchorPrice: number,
  spread = 0.06,
  fallback: FactorRange,
) {
  if (!isFinitePositive(examplePrice) || !isFinitePositive(anchorPrice)) {
    return fallback;
  }

  const safeExamplePrice = Number(examplePrice);
  const center = safeExamplePrice / anchorPrice;

  if (!Number.isFinite(center) || center <= 0) {
    return fallback;
  }

  return {
    min: Math.max(0.25, Number((center * (1 - spread)).toFixed(4))),
    max: Math.max(
      Math.max(0.25, Number((center * (1 - spread)).toFixed(4))),
      Number((center * (1 + spread)).toFixed(4)),
    ),
  };
}

function hasCalibrationExamples(examples: PricingCalibrationExamples | undefined) {
  return Boolean(
    examples &&
      Object.keys(examples.size ?? {}).length &&
      Object.keys(examples.detailLevel ?? {}).length &&
      Object.keys(examples.colorMode ?? {}).length,
  );
}

function deriveSizeFactors(
  rules: ArtistPricingRules,
  basePrice: number,
): Record<SizeValue, FactorRange> {
  const fallback: FactorRange = { min: 1, max: 1.12 };

  return {
    tiny: clampFactorRange(
      rules.sizeBaseRanges.tiny
        ? {
            min: rules.sizeBaseRanges.tiny.min / basePrice,
            max: rules.sizeBaseRanges.tiny.max / basePrice,
          }
        : undefined,
      fallback,
    ),
    small: clampFactorRange(
      rules.sizeBaseRanges.small
        ? {
            min: rules.sizeBaseRanges.small.min / basePrice,
            max: rules.sizeBaseRanges.small.max / basePrice,
          }
        : undefined,
      fallback,
    ),
    medium: clampFactorRange(
      rules.sizeBaseRanges.medium
        ? {
            min: rules.sizeBaseRanges.medium.min / basePrice,
            max: rules.sizeBaseRanges.medium.max / basePrice,
          }
        : undefined,
      fallback,
    ),
    large: clampFactorRange(
      rules.sizeBaseRanges.large
        ? {
            min: rules.sizeBaseRanges.large.min / basePrice,
            max: rules.sizeBaseRanges.large.max / basePrice,
          }
        : undefined,
      fallback,
    ),
  };
}

export function buildNormalizedQuoteConfig(
  rules: ArtistPricingRules,
): NormalizedQuoteConfig {
  const anchorPrice = Math.max(deriveBasePrice(rules), 100);
  const fallbackPlacementFactors = Object.fromEntries(
    Object.entries(rules.placementMultipliers ?? {}).map(([key, value]) => [
      key,
      clampFactorRange(
        { min: value, max: value },
        { min: 1, max: 1 },
      ),
    ]),
  ) as Partial<Record<BodyAreaDetailValue, FactorRange>>;
  const placementFactors = Object.fromEntries(
    Object.entries(rules.placementModifiers ?? {}).map(([key, value]) => [
      key,
      clampFactorRange(value, { min: 1, max: 1 }),
      ]),
  ) as Partial<Record<BodyAreaDetailValue, FactorRange>>;
  const useCalibration = hasCalibrationExamples(rules.calibrationExamples);
  const fallbackSizeFactors = rules.sizeModifiers
    ? {
        tiny: clampFactorRange(rules.sizeModifiers.tiny, { min: 0.35, max: 0.6 }),
        small: clampFactorRange(rules.sizeModifiers.small, { min: 0.55, max: 0.85 }),
        medium: clampFactorRange(rules.sizeModifiers.medium, { min: 0.95, max: 1.2 }),
        large: clampFactorRange(rules.sizeModifiers.large, { min: 1.8, max: 2.4 }),
      }
    : deriveSizeFactors(rules, anchorPrice);

  return {
    anchorPrice,
    minimumCharge: Math.max(0, rules.minimumCharge ?? rules.minimumSessionPrice ?? Math.round(anchorPrice * 0.9)),
    sizeFactors: useCalibration
      ? {
          tiny: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.size.tiny,
            anchorPrice,
            0.08,
            fallbackSizeFactors.tiny,
          ),
          small: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.size.small,
            anchorPrice,
            0.08,
            fallbackSizeFactors.small,
          ),
          medium: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.size.medium,
            anchorPrice,
            0.08,
            fallbackSizeFactors.medium,
          ),
          large: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.size.large,
            anchorPrice,
            0.1,
            fallbackSizeFactors.large,
          ),
        }
      : fallbackSizeFactors,
    placementFactors:
      useCalibration && Object.keys(rules.calibrationExamples.placement ?? {}).length > 0
        ? Object.fromEntries(
            Object.entries(rules.calibrationExamples.placement).map(([key, value]) => [
              key,
              buildFactorRangeFromCalibratedPrice(
                value,
                anchorPrice,
                0.06,
                placementFactors[key as BodyAreaDetailValue] ??
                  fallbackPlacementFactors[key as BodyAreaDetailValue] ??
                  { min: 1, max: 1.08 },
              ),
            ]),
          ) as Partial<Record<BodyAreaDetailValue, FactorRange>>
        : Object.keys(placementFactors).length > 0
          ? placementFactors
          : fallbackPlacementFactors,
    detailLevelFactors: useCalibration
      ? {
          simple: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.detailLevel.simple,
            anchorPrice,
            0.05,
            clampFactorRange(rules.detailLevelModifiers?.simple, { min: 0.92, max: 1 }),
          ),
          standard: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.detailLevel.standard,
            anchorPrice,
            0.05,
            clampFactorRange(rules.detailLevelModifiers?.standard, { min: 1, max: 1.12 }),
          ),
          detailed: buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.detailLevel.detailed,
            anchorPrice,
            0.06,
            clampFactorRange(rules.detailLevelModifiers?.detailed, { min: 1.12, max: 1.28 }),
          ),
        }
      : {
          simple: clampFactorRange(rules.detailLevelModifiers?.simple, { min: 0.92, max: 1 }),
          standard: clampFactorRange(rules.detailLevelModifiers?.standard, { min: 1, max: 1.12 }),
          detailed: clampFactorRange(rules.detailLevelModifiers?.detailed, { min: 1.12, max: 1.28 }),
        },
    colorModeFactors: useCalibration
      ? {
          "black-only": buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.colorMode["black-only"],
            anchorPrice,
            0.05,
            clampFactorRange(rules.colorModeModifiers?.["black-only"], { min: 0.94, max: 1 }),
          ),
          "black-grey": buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.colorMode["black-grey"],
            anchorPrice,
            0.05,
            clampFactorRange(rules.colorModeModifiers?.["black-grey"], { min: 1, max: 1.08 }),
          ),
          "full-color": buildFactorRangeFromCalibratedPrice(
            rules.calibrationExamples.colorMode["full-color"],
            anchorPrice,
            0.06,
            clampFactorRange(rules.colorModeModifiers?.["full-color"], { min: 1.18, max: 1.35 }),
          ),
        }
      : {
          "black-only": clampFactorRange(rules.colorModeModifiers?.["black-only"], { min: 0.94, max: 1 }),
          "black-grey": clampFactorRange(rules.colorModeModifiers?.["black-grey"], { min: 1, max: 1.08 }),
          "full-color": clampFactorRange(rules.colorModeModifiers?.["full-color"], { min: 1.18, max: 1.35 }),
        },
  };
}

export function buildNormalizedQuoteInput(
  submission: SubmissionRequest,
): NormalizedQuoteInput {
  return {
    size: submission.sizeCategory,
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
  const sizeRange = clampFactorRange(config.sizeFactors[input.size], { min: 1, max: 1.12 });
  const placementRange = clampFactorRange(config.placementFactors[input.placement], { min: 1, max: 1 });
  const detailRange = clampFactorRange(
    config.detailLevelFactors[input.detailLevel ?? DEFAULT_DETAIL_LEVEL],
    config.detailLevelFactors[DEFAULT_DETAIL_LEVEL],
  );
  const colorRange = clampFactorRange(
    config.colorModeFactors[input.colorMode ?? DEFAULT_COLOR_MODE],
    config.colorModeFactors[DEFAULT_COLOR_MODE],
  );

  const rawMin =
    config.anchorPrice *
      sizeRange.min *
      placementRange.min *
      detailRange.min *
      colorRange.min;
  const rawMax =
    config.anchorPrice *
      sizeRange.max *
      placementRange.max *
      detailRange.max *
      colorRange.max;

  const roundedMin = Math.max(roundToNearestFifty(rawMin), config.minimumCharge);
  const roundedMax = Math.max(roundToNearestFifty(rawMax), roundedMin);

  return {
    min: roundedMin,
    max: roundedMax,
  };
}
