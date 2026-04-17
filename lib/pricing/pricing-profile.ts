import type {
  ArtistPricingRules,
  PricingCalibrationRawInputs,
  PricingProfile,
} from "../types.ts";

export const PRICING_PROFILE_VERSION = 1 as const;

const MIN_PRICE_FLOOR = 1;
const SIZE_SMALL_LIMITS = { min: 0.6, max: 1 } as const;
const SIZE_LARGE_LIMITS = { min: 1, max: 2.5 } as const;
const DETAIL_LOW_LIMITS = { min: 0.75, max: 1 } as const;
const DETAIL_HIGH_LIMITS = { min: 1, max: 1.8 } as const;
const COLOR_LIMITS = { min: 1, max: 1.6 } as const;
const ANCHOR_LIMITS = { min: 0.7, max: 2.4 } as const;
const SIZE_SMOOTHING = 0.75;
const DETAIL_SMOOTHING = 0.7;
const COLOR_SMOOTHING = 0.7;
const ANCHOR_SMOOTHING = 0.75;

type PriceInputValue = number | string | null | undefined;

export type PricingCalibrationRawInputLike = Partial<
  Record<keyof PricingCalibrationRawInputs, PriceInputValue>
>;

export type DerivedPricingProfile = {
  sanitizedInputs: PricingCalibrationRawInputs;
  pricingProfile: PricingProfile;
};

function roundPrice(value: number) {
  return Math.max(MIN_PRICE_FLOOR, Math.round(value));
}

function roundRatio(value: number) {
  return Number(value.toFixed(4));
}

function toFiniteNumber(value: PriceInputValue) {
  const numeric = typeof value === "string" ? Number(value) : value;
  return typeof numeric === "number" && Number.isFinite(numeric) ? numeric : null;
}

function sanitizePositivePrice(value: PriceInputValue, fallback: number) {
  const numeric = toFiniteNumber(value);

  if (numeric === null || numeric <= 0) {
    return roundPrice(fallback);
  }

  return roundPrice(numeric);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeDivide(numerator: number, denominator: number, fallback = 1) {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return fallback;
  }

  return numerator / denominator;
}

export function smoothRatio(
  ratio: number,
  options: {
    center?: number;
    strength?: number;
    min?: number;
    max?: number;
  } = {},
) {
  const center = options.center ?? 1;
  const strength = options.strength ?? 1;
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;

  if (!Number.isFinite(ratio)) {
    return roundRatio(clamp(center, min, max));
  }

  const smoothed = center + (ratio - center) * strength;
  return roundRatio(clamp(smoothed, min, max));
}

export function enforceMonotonic(values: number[]) {
  if (!values.length) {
    return [];
  }

  const nextValues = [values[0]];

  for (let index = 1; index < values.length; index += 1) {
    nextValues[index] = Math.max(nextValues[index - 1], values[index]);
  }

  return nextValues.map(roundRatio);
}

export function sanitizePricingCalibrationInputs(
  rawInputs: PricingCalibrationRawInputLike,
): PricingCalibrationRawInputs {
  const minimumPrice = sanitizePositivePrice(rawInputs.minimumPrice, MIN_PRICE_FLOOR);
  const roseMedium18cm = sanitizePositivePrice(rawInputs.roseMedium18cm, minimumPrice);

  return {
    minimumPrice,
    roseMedium8cm: sanitizePositivePrice(rawInputs.roseMedium8cm, roseMedium18cm),
    roseMedium18cm,
    roseMedium25cm: sanitizePositivePrice(rawInputs.roseMedium25cm, roseMedium18cm),
    roseLow18cm: sanitizePositivePrice(rawInputs.roseLow18cm, roseMedium18cm),
    roseHigh18cm: sanitizePositivePrice(rawInputs.roseHigh18cm, roseMedium18cm),
    roseColor18cm: sanitizePositivePrice(rawInputs.roseColor18cm, roseMedium18cm),
    daggerAnchor18cm: sanitizePositivePrice(rawInputs.daggerAnchor18cm, roseMedium18cm),
  };
}

export function derivePricingProfile(
  rawInputs: PricingCalibrationRawInputLike,
): DerivedPricingProfile {
  const sanitizedInputs = sanitizePricingCalibrationInputs(rawInputs);
  const {
    minimumPrice,
    roseMedium8cm,
    roseMedium18cm,
    roseMedium25cm,
    roseLow18cm,
    roseHigh18cm,
    roseColor18cm,
    daggerAnchor18cm,
  } = sanitizedInputs;

  const smallRatio = smoothRatio(safeDivide(roseMedium8cm, roseMedium18cm), {
    strength: SIZE_SMOOTHING,
    min: SIZE_SMALL_LIMITS.min,
    max: SIZE_SMALL_LIMITS.max,
  });
  const largeRatio = smoothRatio(safeDivide(roseMedium25cm, roseMedium18cm), {
    strength: SIZE_SMOOTHING,
    min: SIZE_LARGE_LIMITS.min,
    max: SIZE_LARGE_LIMITS.max,
  });
  const sizeBand = enforceMonotonic([
    clamp(smallRatio, SIZE_SMALL_LIMITS.min, SIZE_SMALL_LIMITS.max),
    1,
    clamp(largeRatio, SIZE_LARGE_LIMITS.min, SIZE_LARGE_LIMITS.max),
  ]);

  const lowRatio = smoothRatio(safeDivide(roseLow18cm, roseMedium18cm), {
    strength: DETAIL_SMOOTHING,
    min: DETAIL_LOW_LIMITS.min,
    max: DETAIL_LOW_LIMITS.max,
  });
  const highRatio = smoothRatio(safeDivide(roseHigh18cm, roseMedium18cm), {
    strength: DETAIL_SMOOTHING,
    min: DETAIL_HIGH_LIMITS.min,
    max: DETAIL_HIGH_LIMITS.max,
  });
  const detailBand = enforceMonotonic([
    clamp(lowRatio, DETAIL_LOW_LIMITS.min, DETAIL_LOW_LIMITS.max),
    1,
    clamp(highRatio, DETAIL_HIGH_LIMITS.min, DETAIL_HIGH_LIMITS.max),
  ]);

  const colorFactor = smoothRatio(safeDivide(roseColor18cm, roseMedium18cm), {
    strength: COLOR_SMOOTHING,
    min: COLOR_LIMITS.min,
    max: COLOR_LIMITS.max,
  });

  const anchorRatio = smoothRatio(safeDivide(daggerAnchor18cm, roseMedium18cm), {
    strength: ANCHOR_SMOOTHING,
    min: ANCHOR_LIMITS.min,
    max: ANCHOR_LIMITS.max,
  });

  return {
    sanitizedInputs,
    pricingProfile: {
      version: PRICING_PROFILE_VERSION,
      basePrice: minimumPrice,
      size: {
        small: clamp(sizeBand[0] ?? 1, SIZE_SMALL_LIMITS.min, SIZE_SMALL_LIMITS.max),
        medium: 1,
        large: clamp(sizeBand[2] ?? 1, SIZE_LARGE_LIMITS.min, SIZE_LARGE_LIMITS.max),
      },
      detail: {
        low: clamp(detailBand[0] ?? 1, DETAIL_LOW_LIMITS.min, DETAIL_LOW_LIMITS.max),
        medium: 1,
        high: clamp(detailBand[2] ?? 1, DETAIL_HIGH_LIMITS.min, DETAIL_HIGH_LIMITS.max),
      },
      color: {
        factor: colorFactor,
      },
      anchor: {
        ratio: anchorRatio,
      },
    },
  };
}

export function getArtistPricingProfile(rules: ArtistPricingRules) {
  return rules.calibrationExamples.pricingProfile ?? null;
}
