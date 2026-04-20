import type { RequestTypeValue } from "@/lib/constants/options";
import type { EstimateMode, WorkStyleSensitivityValue } from "@/lib/types";
import { clamp, roundToFriendlyPrice } from "./helpers";
import { buildDisplayEstimateLabel, buildEstimateSummaryText } from "./output";
import { resolvePlacementBucket } from "./placement";
import { getArtistPricingV2Profile, getLeadPreferenceAdjustment } from "./profile";
import { applyMinimumPriceTension, buildCustomRequestSizeFactor } from "./size";
import type { CustomRequestPricingInput, PricingV2Context, PricingV2Output } from "./types";

function getPlacementFactor(bucket: ReturnType<typeof resolvePlacementBucket>) {
  if (bucket === "hard") {
    return 1.16;
  }

  if (bucket === "standard") {
    return 1.08;
  }

  return 1;
}

function getColorFactor(
  requestType: RequestTypeValue,
  colorMode: CustomRequestPricingInput["colorMode"],
  preference: PricingV2Context["profile"]["colorImpactPreference"],
) {
  const base =
    preference === "low"
      ? { "black-only": 1, "black-grey": 1.04, "full-color": 1.08 }
      : preference === "medium"
        ? { "black-only": 1, "black-grey": 1.08, "full-color": 1.16 }
        : { "black-only": 1, "black-grey": 1.12, "full-color": 1.24 };

  const requestFactor = base[colorMode];

  if (requestType === "text") {
    return 1 + (requestFactor - 1) * 0.45;
  }

  if (requestType === "mini_simple") {
    return 1 + (requestFactor - 1) * 0.72;
  }

  return requestFactor;
}

function getMode(requestType: RequestTypeValue, hasReferenceSignal: boolean): EstimateMode {
  if (requestType === "cover_up") {
    return "starting_from";
  }

  if (requestType === "multi_element" || requestType === "unsure") {
    return "soft_range";
  }

  if (requestType === "single_object" && !hasReferenceSignal) {
    return "soft_range";
  }

  return "range";
}

function getWorkStyleSensitivityFactor(
  workStyle: CustomRequestPricingInput["workStyle"],
  sensitivity: WorkStyleSensitivityValue,
) {
  if (workStyle === "clean_line") {
    if (sensitivity === "high") return 1.08;
    if (sensitivity === "medium") return 1.04;
    return 1;
  }

  if (workStyle === "shaded_detailed") {
    if (sensitivity === "high") return 1.16;
    if (sensitivity === "medium") return 1.1;
    return 1.04;
  }

  if (workStyle === "precision_symmetric") {
    if (sensitivity === "high") return 1.17;
    if (sensitivity === "medium") return 1.11;
    return 1.05;
  }

  return 1.01;
}

function getWorkStyleRequestWeight(
  requestType: RequestTypeValue,
  workStyle: CustomRequestPricingInput["workStyle"],
) {
  if (workStyle === "unsure") {
    return 0.35;
  }

  if (requestType === "text") {
    return workStyle === "shaded_detailed" ? 0.35 : 0.82;
  }

  if (requestType === "mini_simple") {
    return workStyle === "shaded_detailed" ? 0.58 : 0.8;
  }

  if (requestType === "cover_up") {
    return workStyle === "clean_line" ? 0.42 : 0.68;
  }

  if (requestType === "multi_element") {
    return workStyle === "clean_line" ? 0.72 : 1;
  }

  return 1;
}

function getWorkStyleFactor(
  input: Pick<CustomRequestPricingInput, "requestType" | "workStyle">,
  profile: PricingV2Context["profile"],
) {
  const sensitivity =
    input.workStyle === "clean_line"
      ? profile.workStyleSensitivity.cleanLine
      : input.workStyle === "shaded_detailed"
        ? profile.workStyleSensitivity.shadedDetailed
        : input.workStyle === "precision_symmetric"
          ? profile.workStyleSensitivity.precisionSymmetric
          : "medium";
  const baseFactor = getWorkStyleSensitivityFactor(input.workStyle, sensitivity);
  const weight = getWorkStyleRequestWeight(input.requestType, input.workStyle);

  return 1 + (baseFactor - 1) * weight;
}

function getSpread(
  requestType: RequestTypeValue,
  mode: EstimateMode,
  input: CustomRequestPricingInput,
  bucket: ReturnType<typeof resolvePlacementBucket>,
) {
  let spread =
    requestType === "text"
      ? 0.1
      : requestType === "mini_simple"
        ? 0.12
        : requestType === "single_object"
          ? 0.16
          : requestType === "multi_element"
            ? 0.22
            : requestType === "cover_up"
              ? 0.12
              : 0.2;

  if (!input.hasReferenceImage && !input.hasReferenceNote) {
    spread += 0.02;
  }

  if (bucket === "hard") {
    spread += 0.02;
  }

  if (input.sizeCm >= 18) {
    spread += 0.02;
  }

  if (mode === "soft_range") {
    spread += 0.02;
  }

  return clamp(spread, 0.08, 0.28);
}

export function estimateCustomRequestPrice(
  input: CustomRequestPricingInput,
  context: PricingV2Context,
): PricingV2Output {
  const profile = context.profile ?? getArtistPricingV2Profile(context.pricingRules);
  const categoryAnchor =
    input.requestType === "text"
      ? profile.categoryAnchors.text
      : input.requestType === "mini_simple"
        ? profile.categoryAnchors.miniSimple
        : input.requestType === "single_object"
          ? profile.categoryAnchors.singleObject
          : input.requestType === "multi_element"
            ? profile.categoryAnchors.multiElement
            : input.requestType === "cover_up"
              ? profile.categoryAnchors.coverUp
              : profile.categoryAnchors.unsure;
  const sizeFactorResult = buildCustomRequestSizeFactor(input.requestType, input.sizeCm, profile);
  const placementBucket = resolvePlacementBucket(input.placement);
  const placementFactor = getPlacementFactor(placementBucket);
  const colorFactor = getColorFactor(input.requestType, input.colorMode, profile.colorImpactPreference);
  const workStyleFactor = getWorkStyleFactor(input, profile);
  const coverUpFactor =
    input.requestType === "cover_up"
      ? profile.coverUpImpactPreference === "high"
        ? 1.22
        : profile.coverUpImpactPreference === "medium"
          ? 1.12
          : 1.04
      : 1;
  const leadPreference = getLeadPreferenceAdjustment(profile.leadPreference);
  const rawCenter = Math.max(
    profile.minimumJobPrice,
    categoryAnchor *
      sizeFactorResult.factor *
      placementFactor *
      colorFactor *
      workStyleFactor *
      coverUpFactor *
      leadPreference.center,
  );
  const minimumTension = applyMinimumPriceTension(
    rawCenter,
    profile.minimumJobPrice,
    input.requestType,
    input.sizeCm,
    profile,
  );
  const center = minimumTension.adjustedCenter;
  const hasReferenceSignal = input.hasReferenceImage || input.hasReferenceNote;
  const mode = getMode(input.requestType, hasReferenceSignal);
  const spread = getSpread(input.requestType, mode, input, placementBucket) * leadPreference.spread;

  if (mode === "starting_from") {
    const minimum = Math.max(
      roundToFriendlyPrice(center, "up"),
      roundToFriendlyPrice(profile.minimumJobPrice, "up"),
    );

    return {
      mode,
      min: minimum,
      max: null,
      displayLabel: buildDisplayEstimateLabel(minimum, null, mode, context.locale, context.currency),
      summaryText: buildEstimateSummaryText(mode, "custom_request", context.locale),
      internalConfidence: 0.48,
      internalReasoning: [
        `requestType:${input.requestType}`,
        `sizeFactor:${sizeFactorResult.factor.toFixed(3)}`,
        `defaultSizeFactor:${sizeFactorResult.defaultFactor.toFixed(3)}`,
        `artistSizeFactor:${sizeFactorResult.artistFactor.toFixed(3)}`,
        `placement:${placementBucket}`,
        `color:${input.colorMode}`,
        `workStyle:${input.workStyle}`,
        `workStyleFactor:${workStyleFactor.toFixed(3)}`,
        `minimumTension:${minimumTension.tensionStrength.toFixed(3)}`,
      ],
    };
  }

  const minimum = Math.max(
    roundToFriendlyPrice(center * (1 - spread / (mode === "soft_range" ? 1 : 1.5)), "down"),
    roundToFriendlyPrice(profile.minimumJobPrice, "up"),
  );
  const maximum = Math.max(
    roundToFriendlyPrice(center * (1 + spread), "up"),
    minimum,
  );

  return {
    mode,
    min: minimum,
    max: maximum,
    displayLabel: buildDisplayEstimateLabel(minimum, maximum, mode, context.locale, context.currency),
    summaryText: buildEstimateSummaryText(mode, "custom_request", context.locale),
    internalConfidence: mode === "range" ? 0.74 : 0.58,
    internalReasoning: [
      `requestType:${input.requestType}`,
      `sizeFactor:${sizeFactorResult.factor.toFixed(3)}`,
      `defaultSizeFactor:${sizeFactorResult.defaultFactor.toFixed(3)}`,
      `artistSizeFactor:${sizeFactorResult.artistFactor.toFixed(3)}`,
      `placement:${placementBucket}`,
      `color:${input.colorMode}`,
      `workStyle:${input.workStyle}`,
      `workStyleFactor:${workStyleFactor.toFixed(3)}`,
      `minimumTension:${minimumTension.tensionStrength.toFixed(3)}`,
    ],
  };
}
