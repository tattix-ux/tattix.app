import type {
  ArtistFeaturedDesign,
  ArtistPricingRules,
  PriceRange,
  SubmissionRequest,
} from "../types.ts";
import {
  buildNormalizedQuoteConfig,
  buildNormalizedQuoteInput,
  estimateNormalizedQuote,
} from "./normalized-engine-core.ts";
import { roundToNearestFifty } from "../utils.ts";

const FEATURED_DESIGN_REFERENCE_PLACEMENT = "forearm-outer" as const;
const FEATURED_DESIGN_REFERENCE_COLOR_MODE = "black-only" as const;
const FEATURED_DESIGN_DEFAULT_DETAIL_LEVEL = "standard" as const;

function isValidPriceRange(range: PriceRange | null | undefined) {
  return Boolean(
    range &&
      Number.isFinite(range.min) &&
      Number.isFinite(range.max) &&
      range.min > 0 &&
      range.max >= range.min,
  );
}

export function parseFeaturedDesignReferenceSizeCm(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  const match = rawValue.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function scaleRange(range: PriceRange, multiplier: number) {
  return {
    min: range.min * multiplier,
    max: range.max * multiplier,
  };
}

function midpoint(range: PriceRange | undefined) {
  if (!range) {
    return null;
  }

  return (range.min + range.max) / 2;
}

function getPlacementSurchargeRange(
  placementDetail: SubmissionRequest["bodyAreaDetail"],
  rules: ArtistPricingRules,
) {
  const calibration = rules.calibrationExamples.placementDifficulty;
  const placementMidpoint = midpoint(rules.placementModifiers[placementDetail]);
  const easy = calibration?.easy ?? midpoint(rules.placementModifiers["forearm-outer"]) ?? rules.anchorPrice;
  const medium = calibration?.medium ?? easy;
  const hard = calibration?.hard ?? easy;

  if (placementDetail === "placement-not-sure") {
    const premium = Math.max(0, medium - easy);
    return { min: premium * 0.9, max: premium * 1.1 };
  }

  const hardPlacement = Number.isFinite(placementMidpoint) ? Number(placementMidpoint) >= 1.12 : false;
  const premium = Math.max(0, (hardPlacement ? hard : easy) - easy);
  return {
    min: premium * 0.9,
    max: premium * 1.1,
  };
}

function interpolateSizePrice(
  points: Record<"8" | "12" | "18" | "25", number>,
  sizeCm: number,
) {
  const ordered = [
    { cm: 8, value: points["8"] },
    { cm: 12, value: points["12"] },
    { cm: 18, value: points["18"] },
    { cm: 25, value: points["25"] },
  ];
  const clampedCm = Math.max(8, Math.min(25, sizeCm));
  let left = ordered[0];
  let right = ordered[ordered.length - 1];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    if (clampedCm >= ordered[index].cm && clampedCm <= ordered[index + 1].cm) {
      left = ordered[index];
      right = ordered[index + 1];
      break;
    }
  }

  const span = Math.max(1, right.cm - left.cm);
  const mix = (clampedCm - left.cm) / span;
  return left.value + (right.value - left.value) * mix;
}

function resolveFeaturedDesignDetailLevel(selectedDesign: ArtistFeaturedDesign) {
  return selectedDesign.referenceDetailLevel ?? FEATURED_DESIGN_DEFAULT_DETAIL_LEVEL;
}

function resolveNormalizedSizeCategory(sizeCm: number): SubmissionRequest["sizeCategory"] {
  if (sizeCm <= 10) {
    return "tiny";
  }

  if (sizeCm <= 15) {
    return "small";
  }

  if (sizeCm <= 21.5) {
    return "medium";
  }

  return "large";
}

function buildFeaturedDesignReferenceInput(
  submission: SubmissionRequest,
  selectedDesign: ArtistFeaturedDesign,
) {
  const requestInput = buildNormalizedQuoteInput(submission);
  const referenceSizeCm = parseFeaturedDesignReferenceSizeCm(selectedDesign.priceNote) ?? 12;

  return {
    ...requestInput,
    size: resolveNormalizedSizeCategory(referenceSizeCm),
    sizeCm: referenceSizeCm,
    placement: FEATURED_DESIGN_REFERENCE_PLACEMENT,
    detailLevel: resolveFeaturedDesignDetailLevel(selectedDesign),
    colorMode: FEATURED_DESIGN_REFERENCE_COLOR_MODE,
  };
}

function buildFeaturedDesignRequestInput(
  submission: SubmissionRequest,
  selectedDesign: ArtistFeaturedDesign,
) {
  const requestInput = buildNormalizedQuoteInput(submission);

  return {
    ...requestInput,
    detailLevel: resolveFeaturedDesignDetailLevel(selectedDesign),
    colorMode: FEATURED_DESIGN_REFERENCE_COLOR_MODE,
  };
}

function applyQuoteDeltaToReferenceRange(
  referenceRange: PriceRange,
  referenceQuote: PriceRange,
  requestQuote: PriceRange,
  minimumCharge: number,
) {
  const minDelta = requestQuote.min - referenceQuote.min;
  const maxDelta = requestQuote.max - referenceQuote.max;

  const min = Math.max(roundToNearestFifty(referenceRange.min + minDelta), minimumCharge);
  const max = Math.max(roundToNearestFifty(referenceRange.max + maxDelta), min);

  return { min, max };
}

export function estimateFeaturedDesignPrice(
  submission: SubmissionRequest,
  rules: ArtistPricingRules,
  selectedDesign: ArtistFeaturedDesign | null | undefined,
) {
  if (!selectedDesign || !selectedDesign.referencePriceMin || !selectedDesign.referencePriceMax) {
    return null;
  }

  const referenceRange = {
    min: selectedDesign.referencePriceMin,
    max: selectedDesign.referencePriceMax,
  };
  const minimumCharge = rules.minimumCharge || rules.minimumSessionPrice || 0;

  try {
    const config = buildNormalizedQuoteConfig(rules);
    const referenceQuote = estimateNormalizedQuote(
      buildFeaturedDesignReferenceInput(submission, selectedDesign),
      config,
    );
    const requestQuote = estimateNormalizedQuote(
      buildFeaturedDesignRequestInput(submission, selectedDesign),
      config,
    );

    if (isValidPriceRange(referenceQuote) && isValidPriceRange(requestQuote)) {
      return applyQuoteDeltaToReferenceRange(
        referenceRange,
        referenceQuote,
        requestQuote,
        minimumCharge,
      );
    }
  } catch {
    // Fall back to the legacy featured design scaling path if normalized deltas fail.
  }

  const config = buildNormalizedQuoteConfig(rules);
  const requestSizeCm = buildNormalizedQuoteInput(submission).sizeCm;
  const referenceSizeCm = parseFeaturedDesignReferenceSizeCm(selectedDesign.priceNote) ?? 12;
  const requestCurve = config.sizeCurvePoints
    ? interpolateSizePrice(config.sizeCurvePoints, requestSizeCm)
    : null;
  const referenceCurve = config.sizeCurvePoints
    ? interpolateSizePrice(config.sizeCurvePoints, referenceSizeCm)
    : null;

  const sizeMultiplier =
    requestCurve && referenceCurve && referenceCurve > 0 ? requestCurve / referenceCurve : 1;

  const baseRange = scaleRange(referenceRange, sizeMultiplier);
  const placementSurcharge = getPlacementSurchargeRange(submission.bodyAreaDetail, rules);

  const min = Math.max(roundToNearestFifty(baseRange.min + placementSurcharge.min), minimumCharge);
  const max = Math.max(roundToNearestFifty(baseRange.max + placementSurcharge.max), min);

  return { min, max };
}
