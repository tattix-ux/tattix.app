import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { SizeValue } from "@/lib/constants/options";
import type {
  ArtistPricingRules,
  ColorModeValue,
  DetailLevelValue,
  PriceRange,
  SubmissionRequest,
} from "@/lib/types";
import { roundToNearestFifty } from "@/lib/utils";

type FactorRange = {
  min: number;
  max: number;
};

type AddonRange = {
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
  basePrice: number;
  minimumCharge: number;
  sizeFactors: Record<SizeValue, FactorRange>;
  placementFactors: Partial<Record<BodyAreaDetailValue, FactorRange>>;
  detailLevelFactors: Record<DetailLevelValue, FactorRange>;
  colorModeFactors: Record<ColorModeValue, FactorRange>;
  addons: {
    coverUp: AddonRange;
    customDesign: AddonRange;
  };
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

function clampAddonRange(range: AddonRange | undefined): AddonRange {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max)) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.max(0, range.min),
    max: Math.max(Math.max(0, range.min), range.max),
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
    rules.basePrice ??
    midpoint(rules.sizeBaseRanges.medium) ??
    midpoint(rules.sizeBaseRanges.small) ??
    rules.minimumSessionPrice ??
    1000
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
  const basePrice = Math.max(deriveBasePrice(rules), 100);
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

  return {
    basePrice,
    minimumCharge: Math.max(0, rules.minimumCharge ?? rules.minimumSessionPrice ?? 0),
    sizeFactors: rules.sizeModifiers
      ? {
          tiny: clampFactorRange(rules.sizeModifiers.tiny, { min: 0.35, max: 0.6 }),
          small: clampFactorRange(rules.sizeModifiers.small, { min: 0.55, max: 0.85 }),
          medium: clampFactorRange(rules.sizeModifiers.medium, { min: 0.95, max: 1.2 }),
          large: clampFactorRange(rules.sizeModifiers.large, { min: 1.8, max: 2.4 }),
        }
      : deriveSizeFactors(rules, basePrice),
    placementFactors: Object.keys(placementFactors).length > 0 ? placementFactors : fallbackPlacementFactors,
    detailLevelFactors: {
      simple: clampFactorRange(rules.detailLevelModifiers?.simple, { min: 0.92, max: 1 }),
      standard: clampFactorRange(rules.detailLevelModifiers?.standard, { min: 1, max: 1.12 }),
      detailed: clampFactorRange(rules.detailLevelModifiers?.detailed, { min: 1.12, max: 1.28 }),
    },
    colorModeFactors: {
      "black-only": clampFactorRange(rules.colorModeModifiers?.["black-only"], { min: 0.94, max: 1 }),
      "black-grey": clampFactorRange(rules.colorModeModifiers?.["black-grey"], { min: 1, max: 1.08 }),
      "full-color": clampFactorRange(rules.colorModeModifiers?.["full-color"], { min: 1.18, max: 1.35 }),
    },
    addons: {
      coverUp: clampAddonRange(rules.addonFees?.coverUp ?? { min: 500, max: 1500 }),
      customDesign: clampAddonRange(rules.addonFees?.customDesign ?? { min: 250, max: 1000 }),
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

  const coverUpRange = input.coverUp ? clampAddonRange(config.addons.coverUp) : { min: 0, max: 0 };
  const customDesignRange = input.customDesign
    ? clampAddonRange(config.addons.customDesign)
    : { min: 0, max: 0 };

  const rawMin =
    config.basePrice *
      sizeRange.min *
      placementRange.min *
      detailRange.min *
      colorRange.min +
    coverUpRange.min +
    customDesignRange.min;
  const rawMax =
    config.basePrice *
      sizeRange.max *
      placementRange.max *
      detailRange.max *
      colorRange.max +
    coverUpRange.max +
    customDesignRange.max;

  const roundedMin = Math.max(roundToNearestFifty(rawMin), config.minimumCharge);
  const roundedMax = Math.max(roundToNearestFifty(rawMax), roundedMin);

  return {
    min: roundedMin,
    max: roundedMax,
  };
}
