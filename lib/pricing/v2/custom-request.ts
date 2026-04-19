import type { RequestTypeValue } from "@/lib/constants/options";
import type { EstimateMode } from "@/lib/types";
import { clamp, roundToNearestFifty } from "./helpers";
import { buildDisplayEstimateLabel, buildEstimateSummaryText } from "./output";
import { resolvePlacementBucket } from "./placement";
import { getArtistPricingV2Profile, getLeadPreferenceAdjustment, getOnboardingCaseMidpoint } from "./profile";
import type { CustomRequestPricingInput, PricingV2Context, PricingV2Output } from "./types";

function getReferenceCaseId(requestType: RequestTypeValue) {
  switch (requestType) {
    case "text":
      return "text-4cm-wrist";
    case "mini_simple":
      return "symbol-4cm-ankle";
    case "single_object":
      return "figure-12cm-upper-arm";
    case "multi_element":
      return "multi-15cm-calf";
    case "cover_up":
      return "small-cover-up";
    case "unsure":
      return "object-8cm-forearm";
  }
}

function getReferenceSizeCm(requestType: RequestTypeValue) {
  switch (requestType) {
    case "text":
      return 4;
    case "mini_simple":
      return 4;
    case "single_object":
      return 12;
    case "multi_element":
      return 15;
    case "cover_up":
      return 7;
    case "unsure":
      return 10;
  }
}

function getSizeExponent(requestType: RequestTypeValue) {
  switch (requestType) {
    case "text":
      return 0.34;
    case "mini_simple":
      return 0.42;
    case "single_object":
      return 0.58;
    case "multi_element":
      return 0.72;
    case "cover_up":
      return 0.54;
    case "unsure":
      return 0.5;
  }
}

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
  const fallbackBase = Math.max(profile.minimumJobPrice, context.pricingRules.minimumCharge);
  const caseMidpoint = getOnboardingCaseMidpoint(profile, getReferenceCaseId(input.requestType), fallbackBase);
  const referenceSizeCm = getReferenceSizeCm(input.requestType);
  const sizeFactor = clamp(
    Math.pow(Math.max(input.sizeCm, 2) / referenceSizeCm, getSizeExponent(input.requestType)),
    0.82,
    input.requestType === "multi_element" ? 1.9 : 1.65,
  );
  const placementBucket = resolvePlacementBucket(input.placement);
  const placementFactor = getPlacementFactor(placementBucket);
  const colorFactor = getColorFactor(input.requestType, input.colorMode, profile.colorImpactPreference);
  const coverUpFactor =
    input.requestType === "cover_up"
      ? profile.coverUpImpactPreference === "high"
        ? 1.22
        : 1.12
      : 1;
  const leadPreference = getLeadPreferenceAdjustment(profile.leadPreference);
  const center = Math.max(
    profile.minimumJobPrice,
    caseMidpoint * sizeFactor * placementFactor * colorFactor * coverUpFactor * leadPreference.center,
  );
  const hasReferenceSignal = input.hasReferenceImage || input.hasReferenceNote;
  const mode = getMode(input.requestType, hasReferenceSignal);
  const spread = getSpread(input.requestType, mode, input, placementBucket) * leadPreference.spread;

  if (mode === "starting_from") {
    const minimum = Math.max(roundToNearestFifty(center), profile.minimumJobPrice);

    return {
      mode,
      min: minimum,
      max: null,
      displayLabel: buildDisplayEstimateLabel(minimum, null, mode, context.locale, context.currency),
      summaryText: buildEstimateSummaryText(mode, "custom_request", context.locale),
      internalConfidence: 0.48,
      internalReasoning: [
        `requestType:${input.requestType}`,
        `sizeFactor:${sizeFactor.toFixed(3)}`,
        `placement:${placementBucket}`,
        `color:${input.colorMode}`,
      ],
    };
  }

  const minimum = Math.max(
    roundToNearestFifty(center * (1 - spread / (mode === "soft_range" ? 1 : 1.5))),
    profile.minimumJobPrice,
  );
  const maximum = Math.max(
    roundToNearestFifty(center * (1 + spread)),
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
      `sizeFactor:${sizeFactor.toFixed(3)}`,
      `placement:${placementBucket}`,
      `color:${input.colorMode}`,
    ],
  };
}
