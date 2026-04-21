import { roundToFriendlyPrice } from "./helpers";
import { buildDisplayEstimateLabel, buildEstimateSummaryText } from "./output";
import { resolvePlacementBucket } from "./placement";
import { getArtistPricingV2Profile } from "./profile";
import { buildFeaturedDesignSizeFactor } from "./size";
import type { FeaturedDesignPricingInput, PricingV2Context, PricingV2Output } from "./types";
import type { ArtistFeaturedDesign } from "@/lib/types";

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
  const referenceRange = getReferenceRange(design);
  const referenceSizeCm = design.referenceSizeCm ?? input.sizeCm ?? 8;
  const placementFactor = getPlacementFactor(resolvePlacementBucket(input.placement));
  const sizeFactorResult = buildFeaturedDesignSizeFactor(
    input.sizeCm,
    referenceSizeCm,
    profile,
    "size_adjusted",
  );
  const adjustedMin = Math.max(
    roundToFriendlyPrice(profile.minimumJobPrice, "up"),
    roundToFriendlyPrice(referenceRange.min * sizeFactorResult.factor * placementFactor, "down"),
  );
  const adjustedMax = Math.max(
    adjustedMin,
    roundToFriendlyPrice(referenceRange.max * sizeFactorResult.factor * placementFactor, "up"),
  );

  return {
    mode: "soft_range",
    min: adjustedMin,
    max: adjustedMax,
    displayLabel: buildDisplayEstimateLabel(
      adjustedMin,
      adjustedMax,
      "soft_range",
      context.locale,
      context.currency,
    ),
    summaryText: buildEstimateSummaryText(
      "soft_range",
      "featured_design",
      context.locale,
    ),
    internalConfidence: 0.74,
    internalReasoning: [
      "pricingMode:size_and_placement_adjusted",
      `sizeFactor:${sizeFactorResult.factor.toFixed(3)}`,
      `defaultSizeFactor:${sizeFactorResult.defaultFactor.toFixed(3)}`,
      `artistSizeFactor:${sizeFactorResult.artistFactor.toFixed(3)}`,
      `placementFactor:${placementFactor.toFixed(3)}`,
      "colorFactor:1.000",
    ],
  };
}
