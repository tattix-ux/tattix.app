import { dampedPowerScale, getColorImpactFactor, roundToFriendlyPrice } from "./helpers";
import { buildDisplayEstimateLabel, buildEstimateSummaryText } from "./output";
import { resolvePlacementBucket } from "./placement";
import { getArtistPricingV2Profile } from "./profile";
import type { FeaturedDesignPricingInput, PricingV2Context, PricingV2Output } from "./types";
import type { ArtistFeaturedDesign, ColorImpactPreferenceValue } from "@/lib/types";

function getReferenceColorMode(design: ArtistFeaturedDesign) {
  return design.referenceColorMode ?? "black-only";
}

function getPricingMode(design: ArtistFeaturedDesign) {
  return design.pricingMode ?? "size_adjusted";
}

function getColorPreference(design: ArtistFeaturedDesign): ColorImpactPreferenceValue {
  return design.colorImpactPreference ?? "medium";
}

function getPlacementFactor(bucket: ReturnType<typeof resolvePlacementBucket>) {
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

export function estimateFeaturedDesignPrice(
  design: ArtistFeaturedDesign,
  input: FeaturedDesignPricingInput,
  context: PricingV2Context,
): PricingV2Output {
  const profile = context.profile ?? getArtistPricingV2Profile(context.pricingRules);
  const pricingMode = getPricingMode(design);
  const referenceRange = getReferenceRange(design);
  const referenceSizeCm = design.referenceSizeCm ?? input.sizeCm ?? 8;
  const referenceColorMode = getReferenceColorMode(design);
  const colorPreference = getColorPreference(design);
  const colorFactor = getColorImpactFactor(referenceColorMode, input.colorMode, colorPreference);
  const placementFactor =
    pricingMode === "size_and_placement_adjusted"
      ? getPlacementFactor(resolvePlacementBucket(input.placement))
      : 1;
  const sizeFactor =
    pricingMode === "fixed_range"
      ? 1
      : dampedPowerScale(input.sizeCm / Math.max(referenceSizeCm, 2), 0.45, 0.9, 1.42);
  const adjustedMin = Math.max(
    roundToFriendlyPrice(profile.minimumJobPrice, "up"),
    roundToFriendlyPrice(referenceRange.min * sizeFactor * placementFactor * colorFactor, "down"),
  );
  const adjustedMax = Math.max(
    adjustedMin,
    roundToFriendlyPrice(referenceRange.max * sizeFactor * placementFactor * colorFactor, "up"),
  );

  if (pricingMode === "starting_from") {
    const minimum = Math.max(profile.minimumJobPrice, adjustedMin);

    return {
      mode: "starting_from",
      min: minimum,
      max: null,
      displayLabel: buildDisplayEstimateLabel(minimum, null, "starting_from", context.locale, context.currency),
      summaryText: buildEstimateSummaryText("starting_from", "featured_design", context.locale),
      internalConfidence: 0.72,
      internalReasoning: [
        `pricingMode:${pricingMode}`,
        `sizeFactor:${sizeFactor.toFixed(3)}`,
        `placementFactor:${placementFactor.toFixed(3)}`,
        `colorFactor:${colorFactor.toFixed(3)}`,
      ],
    };
  }

  return {
    mode: pricingMode === "fixed_range" ? "range" : "soft_range",
    min: adjustedMin,
    max: adjustedMax,
    displayLabel: buildDisplayEstimateLabel(
      adjustedMin,
      adjustedMax,
      pricingMode === "fixed_range" ? "range" : "soft_range",
      context.locale,
      context.currency,
    ),
    summaryText: buildEstimateSummaryText(
      pricingMode === "fixed_range" ? "range" : "soft_range",
      "featured_design",
      context.locale,
    ),
    internalConfidence: pricingMode === "fixed_range" ? 0.84 : 0.7,
    internalReasoning: [
      `pricingMode:${pricingMode}`,
      `sizeFactor:${sizeFactor.toFixed(3)}`,
      `placementFactor:${placementFactor.toFixed(3)}`,
      `colorFactor:${colorFactor.toFixed(3)}`,
    ],
  };
}
