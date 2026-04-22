import type { ArtistFeaturedDesign, EstimateMode } from "@/lib/types";
import { clamp, getColorImpactFactor, roundToFriendlyPrice } from "./helpers";
import { buildDisplayEstimateLabel, buildEstimateSummaryText } from "./output";
import { resolvePlacementBucket } from "./placement";
import { getArtistPricingV2Profile } from "./profile";
import { buildFeaturedDesignSizeFactor } from "./size";
import type { FeaturedDesignPricingInput, PricingV2Context, PricingV2Output } from "./types";

function isPositiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function hasFeaturedDesignPricingMetadata(design: ArtistFeaturedDesign | null | undefined) {
  if (!design) {
    return false;
  }

  return Boolean(
    isPositiveNumber(design.referencePriceMin) &&
      isPositiveNumber(design.referencePriceMax) &&
      (design.referencePriceMax ?? 0) >= (design.referencePriceMin ?? 0) &&
      isPositiveNumber(design.referenceSizeCm) &&
      design.referenceDetailLevel &&
      design.referenceColorMode &&
      design.pricingMode &&
      design.colorImpactPreference,
  );
}

function getPlacementFactor(
  bucket: ReturnType<typeof resolvePlacementBucket>,
  pricingMode: NonNullable<ArtistFeaturedDesign["pricingMode"]>,
) {
  if (pricingMode !== "size_and_placement_adjusted" && pricingMode !== "starting_from") {
    return 1;
  }

  if (bucket === "hard") {
    return 1.12;
  }

  if (bucket === "standard") {
    return 1.05;
  }

  return 1;
}

function getReferenceRange(design: ArtistFeaturedDesign) {
  const minimum = design.referencePriceMin ?? 0;
  const maximum = design.referencePriceMax ?? minimum;

  return {
    min: Math.min(minimum, maximum),
    max: Math.max(minimum, maximum),
  };
}

function getReferenceScaleSensitivity(design: ArtistFeaturedDesign) {
  const detailSensitivity =
    design.referenceDetailLevel === "simple"
      ? 0.96
      : design.referenceDetailLevel === "detailed"
        ? 1.08
        : 1;
  const colorReferenceFactor = getColorImpactFactor(
    "black-only",
    design.referenceColorMode ?? "black-only",
    design.colorImpactPreference ?? "medium",
  );
  const scaleSensitivity = clamp(
    1 + (detailSensitivity - 1) * 0.48 + (colorReferenceFactor - 1) * 0.34,
    0.94,
    1.18,
  );

  return {
    detailSensitivity,
    colorReferenceFactor,
    scaleSensitivity,
  };
}

function adjustSizeFactorForReferenceMetadata(
  factor: number,
  pricingMode: NonNullable<ArtistFeaturedDesign["pricingMode"]>,
  scaleSensitivity: number,
) {
  if (pricingMode === "fixed_range") {
    return 1;
  }

  if (Math.abs(factor - 1) < 0.001) {
    return 1;
  }

  const modeCeiling =
    pricingMode === "size_and_placement_adjusted"
      ? 1.62
      : pricingMode === "starting_from"
        ? 1.66
        : 1.52;

  return clamp(
    Math.exp(Math.log(Math.max(factor, 0.01)) * scaleSensitivity),
    0.88,
    modeCeiling,
  );
}

function resolveFeaturedEstimateMode(
  pricingMode: NonNullable<ArtistFeaturedDesign["pricingMode"]>,
): EstimateMode {
  if (pricingMode === "starting_from") {
    return "starting_from";
  }

  if (pricingMode === "fixed_range") {
    return "range";
  }

  return "soft_range";
}

export function estimateFeaturedDesignPrice(
  design: ArtistFeaturedDesign,
  input: FeaturedDesignPricingInput,
  context: PricingV2Context,
): PricingV2Output {
  if (!hasFeaturedDesignPricingMetadata(design)) {
    throw new Error("Featured design pricing metadata is incomplete.");
  }

  const profile = context.profile ?? getArtistPricingV2Profile(context.pricingRules);
  const pricingMode = design.pricingMode ?? "size_adjusted";
  const referenceRange = getReferenceRange(design);
  const referenceSizeCm = design.referenceSizeCm ?? input.sizeCm;
  const placementFactor = getPlacementFactor(resolvePlacementBucket(input.placement), pricingMode);
  const sizeFactorResult =
    pricingMode === "fixed_range"
      ? null
      : buildFeaturedDesignSizeFactor(
          input.sizeCm,
          referenceSizeCm,
          profile,
          pricingMode === "size_and_placement_adjusted" ? "size_and_placement_adjusted" : pricingMode,
        );
  const scaleSensitivity = getReferenceScaleSensitivity(design);
  const sizeFactor = adjustSizeFactorForReferenceMetadata(
    sizeFactorResult?.factor ?? 1,
    pricingMode,
    scaleSensitivity.scaleSensitivity,
  );
  const estimateMode = resolveFeaturedEstimateMode(pricingMode);

  if (estimateMode === "starting_from") {
    const startingFrom = referenceRange.min * sizeFactor * placementFactor;
    const minimum = Math.max(
      roundToFriendlyPrice(profile.minimumJobPrice, "up"),
      roundToFriendlyPrice(startingFrom, "up"),
    );

    return {
      mode: estimateMode,
      min: minimum,
      max: null,
      displayLabel: buildDisplayEstimateLabel(
        minimum,
        null,
        estimateMode,
        context.locale,
        context.currency,
      ),
      summaryText: buildEstimateSummaryText(
        estimateMode,
        "featured_design",
        context.locale,
      ),
      internalConfidence: 0.72,
      internalReasoning: [
        `pricingMode:${pricingMode}`,
        `referenceDetail:${design.referenceDetailLevel}`,
        `referenceColorMode:${design.referenceColorMode}`,
        `colorImpactPreference:${design.colorImpactPreference}`,
        `sizeFactor:${sizeFactor.toFixed(3)}`,
        `placementFactor:${placementFactor.toFixed(3)}`,
        `detailSensitivity:${scaleSensitivity.detailSensitivity.toFixed(3)}`,
        `referenceColorFactor:${scaleSensitivity.colorReferenceFactor.toFixed(3)}`,
      ],
    };
  }

  const adjustedMin = Math.max(
    roundToFriendlyPrice(profile.minimumJobPrice, "up"),
    roundToFriendlyPrice(referenceRange.min * sizeFactor * placementFactor, "down"),
  );
  const adjustedMax = Math.max(
    adjustedMin,
    roundToFriendlyPrice(referenceRange.max * sizeFactor * placementFactor, "up"),
  );

  return {
    mode: estimateMode,
    min: adjustedMin,
    max: adjustedMax,
    displayLabel: buildDisplayEstimateLabel(
      adjustedMin,
      adjustedMax,
      estimateMode,
      context.locale,
      context.currency,
    ),
    summaryText: buildEstimateSummaryText(
      estimateMode,
      "featured_design",
      context.locale,
    ),
    internalConfidence: estimateMode === "range" ? 0.82 : 0.76,
    internalReasoning: [
      `pricingMode:${pricingMode}`,
      `referenceDetail:${design.referenceDetailLevel}`,
      `referenceColorMode:${design.referenceColorMode}`,
      `colorImpactPreference:${design.colorImpactPreference}`,
      `sizeFactor:${sizeFactor.toFixed(3)}`,
      `defaultSizeFactor:${(sizeFactorResult?.defaultFactor ?? 1).toFixed(3)}`,
      `artistSizeFactor:${(sizeFactorResult?.artistFactor ?? 1).toFixed(3)}`,
      `placementFactor:${placementFactor.toFixed(3)}`,
      `detailSensitivity:${scaleSensitivity.detailSensitivity.toFixed(3)}`,
      `referenceColorFactor:${scaleSensitivity.colorReferenceFactor.toFixed(3)}`,
      `scaleSensitivity:${scaleSensitivity.scaleSensitivity.toFixed(3)}`,
    ],
  };
}
