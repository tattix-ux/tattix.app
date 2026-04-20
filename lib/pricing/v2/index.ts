import type { SubmissionRequest } from "@/lib/types";
import { estimateCustomRequestPrice } from "./custom-request";
import { estimateFeaturedDesignPrice } from "./featured-design";
import { getArtistPricingV2Profile } from "./profile";
import { resolveRepresentativeSizeCm } from "./size";
import type { SubmissionPricingV2Context, SubmissionPricingV2Result } from "./types";

function resolvePricingSource(submission: SubmissionRequest) {
  if (submission.pricingSource) {
    return submission.pricingSource;
  }

  return submission.selectedDesignId ? "featured_design" : "custom_request";
}

function resolveAreaScope(submission: SubmissionRequest) {
  if (submission.areaScope) {
    return submission.areaScope;
  }

  if (submission.intent === "not-sure") {
    return "unsure";
  }

  return "standard_piece";
}

function resolveRequestType(submission: SubmissionRequest) {
  if (submission.requestType) {
    return submission.requestType;
  }

  if (submission.coverUp) {
    return "cover_up";
  }

  if (submission.intent === "not-sure") {
    return "unsure";
  }

  return "single_object";
}

function resolveColorMode(submission: SubmissionRequest) {
  return submission.colorMode ?? "black-only";
}

export function estimateSubmissionPriceV2(
  submission: SubmissionRequest,
  context: SubmissionPricingV2Context,
): SubmissionPricingV2Result {
  const profile = getArtistPricingV2Profile(context.pricingRules);
  const pricingSource = resolvePricingSource(submission);
  const sizeCm = resolveRepresentativeSizeCm(submission);
  const colorMode = resolveColorMode(submission);
  const areaScope = resolveAreaScope(submission);

  if (pricingSource === "featured_design" && submission.selectedDesignId) {
    const design = context.featuredDesigns?.find((item) => item.id === submission.selectedDesignId);

    if (design?.referencePriceMin && design.referencePriceMax) {
      const quote = estimateFeaturedDesignPrice(
        design,
        {
          placement: submission.bodyAreaDetail,
          sizeCm,
          colorMode,
        },
        {
          locale: context.locale,
          currency: context.currency,
          pricingRules: context.pricingRules,
          profile,
        },
      );

      return {
        ...quote,
        pricingSource,
        requestType: null,
        featuredDesignPricingMode: design.pricingMode ?? "size_adjusted",
        submission,
      };
    }
  }

  const requestType = resolveRequestType(submission);
  const quote = estimateCustomRequestPrice(
    {
      areaScope,
      requestType: areaScope === "standard_piece" || areaScope === "unsure" ? requestType : null,
      placement: submission.bodyAreaDetail,
      largeAreaCoverage: submission.largeAreaCoverage ?? null,
      wideAreaTarget: submission.wideAreaTarget ?? null,
      sizeCm,
      colorMode,
      workStyle: submission.workStyle ?? "unsure",
      hasReferenceImage: Boolean(submission.referenceImage?.trim()),
      hasReferenceNote: Boolean(submission.referenceDescription?.trim() || submission.notes?.trim()),
      coverUp: submission.coverUp ?? null,
    },
    {
      locale: context.locale,
      currency: context.currency,
      pricingRules: context.pricingRules,
      profile,
    },
  );

  return {
    ...quote,
    pricingSource: "custom_request",
    requestType: areaScope === "standard_piece" || areaScope === "unsure" ? requestType : null,
    featuredDesignPricingMode: null,
    submission,
  };
}

// Legacy note:
// New public submit flow uses this v2 entry point instead of the older normalized/legacy hybrid engine.
