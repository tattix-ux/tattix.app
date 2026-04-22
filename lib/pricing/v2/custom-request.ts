import type { RequestTypeValue } from "@/lib/constants/options";
import type { AreaScopeValue, EstimateMode } from "@/lib/types";
import { clamp, midpoint, roundToFriendlyPrice } from "./helpers";
import { buildDisplayEstimateLabel, buildEstimateSummaryText } from "./output";
import { resolvePlacementBucket } from "./placement";
import { getArtistPricingV2Profile } from "./profile";
import { applyMinimumPriceTension, buildCustomRequestSizeFactor } from "./size";
import type { CustomRequestPricingInput, PricingV2Context, PricingV2Output } from "./types";

type PriceRangeLike = {
  min: number;
  max: number;
};

type UnsureAdjustmentConfig = {
  anchorBlend: number;
  centerBoost: number;
  spreadDelta: number;
  largeAreaExtraCaution: number;
  wideAreaExtraCaution: number;
};

function getPlacementFactor(
  bucket: ReturnType<typeof resolvePlacementBucket>,
  intensity = 1,
) {
  if (bucket === "hard") {
    return 1 + 0.16 * intensity;
  }

  if (bucket === "standard") {
    return 1 + 0.08 * intensity;
  }

  return 1;
}

function getUnsureAdjustmentConfig(
  input: Pick<CustomRequestPricingInput, "sizeCm" | "placement" | "coverUp" | "requestType">,
): UnsureAdjustmentConfig {
  const isBroadPlacement = input.sizeCm >= 18 || isTorsoOrBackPlacement(input.placement);

  if (input.coverUp || input.requestType === "cover_up") {
    return {
      anchorBlend: 0.24,
      centerBoost: 1.03,
      spreadDelta: 0.014,
      largeAreaExtraCaution: 1.02,
      wideAreaExtraCaution: 1.03,
    };
  }

  if (isBroadPlacement) {
    return {
      anchorBlend: 0.34,
      centerBoost: 1.018,
      spreadDelta: 0.014,
      largeAreaExtraCaution: 1.015,
      wideAreaExtraCaution: 1.02,
    };
  }

  return {
    anchorBlend: input.sizeCm >= 12 ? 0.3 : 0.24,
    centerBoost: input.sizeCm >= 12 ? 1.015 : 1.01,
    spreadDelta: input.sizeCm >= 12 ? 0.012 : 0.01,
    largeAreaExtraCaution: 1.012,
    wideAreaExtraCaution: 1.016,
  };
}

function getConcreteColorFactor(
  colorMode: CustomRequestPricingInput["colorMode"],
  input: Pick<CustomRequestPricingInput, "requestType">,
  context: Pick<PricingV2Context["profile"], "specialCaseAdjustments" | "reviewAdjustments">,
  intensity = 1,
) {
  const base =
    colorMode === "black-only"
      ? 1
      : colorMode === "black-grey"
        ? context.specialCaseAdjustments.blackGreyFactor
        : context.specialCaseAdjustments.fullColorFactor;
  const requestWeight =
    input.requestType === "text"
      ? 0.45
      : input.requestType === "mini_simple"
        ? 0.7
        : input.requestType === "cover_up"
          ? 0.88
          : 1;

  const factor = 1 + (base - 1) * clamp(intensity * requestWeight, 0.25, 1);

  if (colorMode === "black-only") {
    return factor;
  }

  return factor * context.reviewAdjustments.colorShadingBias;
}

function getWorkStyleWeight(
  requestType: RequestTypeValue | null,
  workStyle: CustomRequestPricingInput["workStyle"],
) {
  if (workStyle === "unsure") {
    return 0.32;
  }

  if (!requestType) {
    return 1;
  }

  if (requestType === "text") {
    return workStyle === "shaded_detailed" ? 0.34 : 0.78;
  }

  if (requestType === "mini_simple") {
    return workStyle === "shaded_detailed" ? 0.56 : 0.78;
  }

  if (requestType === "cover_up") {
    return workStyle === "clean_line" ? 0.4 : 0.7;
  }

  if (requestType === "multi_element") {
    return workStyle === "clean_line" ? 0.72 : 0.94;
  }

  return 1;
}

function getConcreteWorkStyleFactor(
  workStyle: CustomRequestPricingInput["workStyle"],
  input: Pick<CustomRequestPricingInput, "requestType">,
  context: Pick<PricingV2Context["profile"], "specialCaseAdjustments" | "reviewAdjustments">,
  intensity = 1,
) {
  if (workStyle === "clean_line") {
    const softening = input.requestType === "multi_element" || input.requestType === "cover_up" ? 0.025 : 0.01;
    return 1 - softening * intensity;
  }

  if (workStyle === "unsure") {
    return 1.02;
  }

  const base =
    workStyle === "precision_symmetric"
      ? context.specialCaseAdjustments.precisionSymmetricFactor
      : context.specialCaseAdjustments.shadedDetailedFactor;
  const requestWeight = getWorkStyleWeight(input.requestType, workStyle);

  return (1 + (base - 1) * clamp(intensity * requestWeight, 0.22, 1)) * context.reviewAdjustments.detailBias;
}

function getAdvancedRealismRequestWeight(requestType: RequestTypeValue | null) {
  if (requestType === "single_object" || requestType === "unsure") {
    return 1;
  }

  if (requestType === "multi_element") {
    return 0.72;
  }

  if (requestType === null) {
    return 0.8;
  }

  return 0;
}

function getLayoutStyleRequestWeight(requestType: RequestTypeValue | null) {
  if (requestType === "text") {
    return 0.3;
  }

  if (requestType === "mini_simple") {
    return 0.42;
  }

  if (requestType === "cover_up") {
    return 0.48;
  }

  if (requestType === "multi_element") {
    return 0.9;
  }

  if (requestType === null) {
    return 0.84;
  }

  return 0.76;
}

function getLayoutStyleFactor(
  input: Pick<CustomRequestPricingInput, "layoutStyle">,
  context: Pick<PricingV2Context["profile"], "specialCaseAdjustments">,
  requestType: RequestTypeValue | null,
  intensity = 1,
) {
  if (input.layoutStyle !== "precision") {
    return 1;
  }

  const requestWeight = getLayoutStyleRequestWeight(requestType);
  return (
    1 +
    (context.specialCaseAdjustments.precisionSymmetricFactor - 1) *
      clamp(requestWeight * intensity, 0.18, 0.92)
  );
}

function getAdvancedRealismFactor(
  input: Pick<CustomRequestPricingInput, "colorMode" | "workStyle" | "realismLevel" | "coverUp">,
  context: Pick<PricingV2Context["profile"], "specialCaseAdjustments">,
  requestType: RequestTypeValue | null,
  intensity = 1,
) {
  if (
    input.workStyle !== "shaded_detailed" ||
    input.colorMode !== "black-grey" ||
    input.realismLevel !== "advanced" ||
    input.coverUp
  ) {
    return 1;
  }

  const requestWeight = getAdvancedRealismRequestWeight(requestType);

  if (requestWeight <= 0) {
    return 1;
  }

  return 1 + (context.specialCaseAdjustments.advancedRealismFactor - 1) * clamp(requestWeight * intensity, 0.22, 1);
}

function getReviewCalibrationFactor(
  requestType: RequestTypeValue,
  sizeCm: number,
  profile: Pick<PricingV2Context["profile"], "reviewAdjustments">,
) {
  const review = profile.reviewAdjustments;

  if (requestType === "text") {
    return review.textBias;
  }

  if (requestType === "mini_simple") {
    return review.miniSimpleBias;
  }

  if (requestType === "cover_up") {
    return review.coverUpBias;
  }

  if (requestType === "multi_element") {
    return review.multiElementBias;
  }

  if (requestType === "single_object") {
    const singleBias = sizeCm >= 14 ? review.largeSizeBias : review.singleObjectBias;
    return clamp(singleBias, 0.82, 1.26);
  }

  return review.globalBias;
}

function getStandardPieceMode(
  requestType: RequestTypeValue,
  hasReferenceSignal: boolean,
  isCautious: boolean,
): EstimateMode {
  if (requestType === "cover_up") {
    return "starting_from";
  }

  if (isCautious) {
    return "soft_range";
  }

  if (requestType === "multi_element" || requestType === "unsure") {
    return "soft_range";
  }

  if (requestType === "single_object" && !hasReferenceSignal) {
    return "soft_range";
  }

  return "range";
}

function getStandardPieceSpread(
  requestType: RequestTypeValue,
  input: CustomRequestPricingInput,
  bucket: ReturnType<typeof resolvePlacementBucket>,
  mode: EstimateMode,
  cautionSpreadDelta: number,
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
              ? 0.14
              : 0.15;

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

  if (cautionSpreadDelta > 0) {
    spread += cautionSpreadDelta;
  }

  return clamp(spread, 0.09, 0.3);
}

function buildRangeOutput(
  center: number,
  spread: number,
  mode: "range" | "soft_range",
  context: PricingV2Context,
  minimumFloor: number,
  confidence: number,
  internalReasoning: string[],
): PricingV2Output {
  const lowerWeight = mode === "soft_range" ? 0.72 : 0.58;
  const minimum = Math.max(
    roundToFriendlyPrice(center * (1 - spread * lowerWeight), "down"),
    roundToFriendlyPrice(minimumFloor, "up"),
  );
  const maximum = Math.max(
    minimum,
    roundToFriendlyPrice(center * (1 + spread), "up"),
  );

  return {
    mode,
    min: minimum,
    max: maximum,
    displayLabel: buildDisplayEstimateLabel(minimum, maximum, mode, context.locale, context.currency),
    summaryText: buildEstimateSummaryText(mode, "custom_request", context.locale),
    internalConfidence: confidence,
    internalReasoning,
  };
}

function buildStartingFromOutput(
  startingFrom: number,
  context: PricingV2Context,
  minimumFloor: number,
  confidence: number,
  internalReasoning: string[],
): PricingV2Output {
  const minimum = Math.max(
    roundToFriendlyPrice(startingFrom, "up"),
    roundToFriendlyPrice(minimumFloor, "up"),
  );

  return {
    mode: "starting_from",
    min: minimum,
    max: null,
    displayLabel: buildDisplayEstimateLabel(minimum, null, "starting_from", context.locale, context.currency),
    summaryText: buildEstimateSummaryText("starting_from", "custom_request", context.locale),
    internalConfidence: confidence,
    internalReasoning,
  };
}

function getCaseRange(
  cases: Array<{ id: string; min: number; max: number }>,
  id: string,
  fallback: PriceRangeLike,
) {
  const found = cases.find((item) => item.id === id);

  if (!found) {
    return fallback;
  }

  return {
    min: Math.min(found.min, found.max),
    max: Math.max(found.min, found.max),
  };
}

function getWideAreaStartingPoint(
  cases: Array<{ id: string; startingFrom: number }>,
  id: string,
  fallback: number,
) {
  const found = cases.find((item) => item.id === id);
  return found?.startingFrom ?? fallback;
}

function resolveStandardRequestType(input: CustomRequestPricingInput) {
  if (input.requestType) {
    return input.requestType;
  }

  if (input.coverUp) {
    return "cover_up";
  }

  return "single_object";
}

function resolveLargeAreaCaseId(placement: CustomRequestPricingInput["placement"]) {
  if (
    placement.includes("forearm") ||
    placement.includes("upper-arm") ||
    placement.includes("wrist") ||
    placement.includes("hand") ||
    placement.includes("elbow")
  ) {
    return "forearm-large-coverage";
  }

  if (
    placement.includes("calf") ||
    placement.includes("thigh") ||
    placement.includes("ankle") ||
    placement.includes("shin") ||
    placement.includes("knee") ||
    placement.includes("foot")
  ) {
    return "calf-large-coverage";
  }

  return "chest-large-coverage";
}

function resolveWideAreaCaseId(target: NonNullable<CustomRequestPricingInput["wideAreaTarget"]>) {
  switch (target) {
    case "half_arm":
      return "half-sleeve";
    case "full_arm":
      return "full-sleeve";
    case "wide_back":
      return "back-large-coverage";
    case "wide_chest":
      return "back-large-coverage";
    case "half_leg":
      return "half-sleeve";
    case "mostly_leg":
      return "full-sleeve";
    case "unsure":
      return "half-sleeve";
  }
}

function getLargeAreaCoverageFactor(value: CustomRequestPricingInput["largeAreaCoverage"]) {
  switch (value) {
    case "partial":
      return 0.88;
    case "almost_full":
      return 1.14;
    case "mostly":
    default:
      return 1;
  }
}

function getWideAreaTargetFactor(target: NonNullable<CustomRequestPricingInput["wideAreaTarget"]>) {
  switch (target) {
    case "wide_chest":
      return 0.88;
    case "half_leg":
      return 1.04;
    case "mostly_leg":
      return 1.08;
    case "unsure":
      return 1.03;
    default:
      return 1;
  }
}

function isTorsoOrBackPlacement(placement: CustomRequestPricingInput["placement"]) {
  return (
    placement.includes("chest") ||
    placement.includes("rib") ||
    placement.includes("abdomen") ||
    placement.includes("stomach") ||
    placement.includes("back") ||
    placement.includes("spine") ||
    placement.includes("shoulder")
  );
}

function isLegPlacement(placement: CustomRequestPricingInput["placement"]) {
  return (
    placement.includes("thigh") ||
    placement.includes("calf") ||
    placement.includes("shin") ||
    placement.includes("knee") ||
    placement.includes("ankle") ||
    placement.includes("foot")
  );
}

function resolveWideAreaTargetFromPlacement(placement: CustomRequestPricingInput["placement"]) {
  if (placement.includes("back") || placement.includes("spine")) {
    return "wide_back";
  }

  if (isTorsoOrBackPlacement(placement)) {
    return "wide_chest";
  }

  if (isLegPlacement(placement)) {
    return "half_leg";
  }

  return "half_arm";
}

function getMinimumFloorForAreaScope(
  areaScope: AreaScopeValue,
  profile: PricingV2Context["profile"],
) {
  if (areaScope === "wide_area") {
    return profile.minimumJobPrice * 2.8;
  }

  if (areaScope === "large_single_area") {
    return profile.minimumJobPrice * 1.6;
  }

  return profile.minimumJobPrice;
}

function estimateStandardPiecePrice(
  input: CustomRequestPricingInput,
  context: PricingV2Context,
  profile: PricingV2Context["profile"],
  options?: {
    cautious?: boolean;
    reasoningPrefix?: string;
    unsureAdjustment?: UnsureAdjustmentConfig;
  },
): PricingV2Output {
  const requestType = resolveStandardRequestType(input);
  const defaultCategoryAnchor =
    requestType === "text"
      ? profile.categoryAnchors.text
      : requestType === "mini_simple"
        ? profile.categoryAnchors.miniSimple
        : requestType === "single_object"
          ? profile.categoryAnchors.singleObject
          : requestType === "multi_element"
            ? profile.categoryAnchors.multiElement
            : requestType === "cover_up"
              ? profile.categoryAnchors.coverUp
              : profile.categoryAnchors.unsure;
  const categoryAnchor =
    requestType === "unsure" && options?.unsureAdjustment
      ? profile.categoryAnchors.singleObject * (1 - options.unsureAdjustment.anchorBlend) +
        profile.categoryAnchors.unsure * options.unsureAdjustment.anchorBlend
      : defaultCategoryAnchor;
  const sizeFactorResult = buildCustomRequestSizeFactor(requestType, input.sizeCm, profile);
  const placementBucket = resolvePlacementBucket(input.placement);
  const placementFactor = getPlacementFactor(placementBucket) * profile.reviewAdjustments.placementBias;
  const colorFactor = getConcreteColorFactor(input.colorMode, { requestType }, profile);
  const workStyleFactor = getConcreteWorkStyleFactor(input.workStyle, { requestType }, profile);
  const layoutStyleFactor = getLayoutStyleFactor(input, profile, requestType);
  const advancedRealismFactor = getAdvancedRealismFactor(input, profile, requestType);
  const rawCenter = Math.max(
    profile.minimumJobPrice,
    categoryAnchor *
      sizeFactorResult.factor *
      placementFactor *
      colorFactor *
      workStyleFactor *
      layoutStyleFactor *
      advancedRealismFactor,
  );
  const minimumTension = applyMinimumPriceTension(
    rawCenter,
    profile.minimumJobPrice,
    requestType,
    input.sizeCm,
    profile,
  );
  const reviewCalibrationFactor = getReviewCalibrationFactor(requestType, input.sizeCm, profile);
  const center =
    minimumTension.adjustedCenter *
    reviewCalibrationFactor *
    (options?.cautious ? options.unsureAdjustment?.centerBoost ?? 1.02 : 1);
  const hasReferenceSignal = input.hasReferenceImage || input.hasReferenceNote;
  const mode = getStandardPieceMode(requestType, hasReferenceSignal, options?.cautious ?? false);
  const spread = getStandardPieceSpread(
    requestType,
    input,
    placementBucket,
    mode,
    options?.cautious ? options?.unsureAdjustment?.spreadDelta ?? 0.012 : 0,
  );
  const internalReasoning = [
    options?.reasoningPrefix ?? `areaScope:${input.areaScope}`,
    `requestType:${requestType}`,
    `sizeFactor:${sizeFactorResult.factor.toFixed(3)}`,
    `defaultSizeFactor:${sizeFactorResult.defaultFactor.toFixed(3)}`,
    `artistSizeFactor:${sizeFactorResult.artistFactor.toFixed(3)}`,
    `placement:${placementBucket}`,
    `color:${input.colorMode}`,
    `workStyle:${input.workStyle}`,
    `realismLevel:${input.realismLevel ?? "standard"}`,
    `layoutStyle:${input.layoutStyle ?? "organic"}`,
    `colorFactor:${colorFactor.toFixed(3)}`,
    `workStyleFactor:${workStyleFactor.toFixed(3)}`,
    `layoutStyleFactor:${layoutStyleFactor.toFixed(3)}`,
    `advancedRealismFactor:${advancedRealismFactor.toFixed(3)}`,
    `reviewCalibration:${reviewCalibrationFactor.toFixed(3)}`,
    `minimumTension:${minimumTension.tensionStrength.toFixed(3)}`,
  ];

  if (options?.unsureAdjustment) {
    internalReasoning.push(
      `unsureAnchorBlend:${options.unsureAdjustment.anchorBlend.toFixed(3)}`,
      `unsureCenterBoost:${options.unsureAdjustment.centerBoost.toFixed(3)}`,
      `unsureSpreadDelta:${options.unsureAdjustment.spreadDelta.toFixed(3)}`,
    );
  }

  if (mode === "starting_from") {
    return buildStartingFromOutput(
      center,
      context,
      getMinimumFloorForAreaScope(input.areaScope, profile),
      options?.cautious ? 0.46 : 0.52,
      internalReasoning,
    );
  }

  return buildRangeOutput(
    center,
    spread,
    mode,
    context,
    getMinimumFloorForAreaScope(input.areaScope, profile),
    mode === "range" ? 0.74 : 0.6,
    internalReasoning,
  );
}

function estimateLargeSingleAreaPrice(
  input: CustomRequestPricingInput,
  context: PricingV2Context,
  profile: PricingV2Context["profile"],
  options?: {
    reasoningPrefix?: string;
    extraCaution?: number;
  },
): PricingV2Output {
  const caseId = resolveLargeAreaCaseId(input.placement);
  const fallbackCenter = profile.minimumJobPrice * 3;
  const baseRange = getCaseRange(profile.largeAreaCases, caseId, {
    min: fallbackCenter * 0.88,
    max: fallbackCenter * 1.18,
  });
  const placementBucket = resolvePlacementBucket(input.placement);
  const coverageFactor = getLargeAreaCoverageFactor(input.largeAreaCoverage);
  const placementFactor = getPlacementFactor(placementBucket, 0.55);
  const colorFactor = getConcreteColorFactor(input.colorMode, { requestType: null }, profile, 0.82);
  const workStyleFactor = getConcreteWorkStyleFactor(input.workStyle, { requestType: null }, profile, 0.9);
  const layoutStyleFactor = getLayoutStyleFactor(input, profile, null, 0.9);
  const advancedRealismFactor = getAdvancedRealismFactor(input, profile, null, 0.86);
  const coverUpFactor = input.coverUp
    ? 1 + (profile.specialCaseAdjustments.coverUpPremiumFactor - 1) * 0.55
    : 1;
  const center =
    midpoint(baseRange.min, baseRange.max) *
    coverageFactor *
    placementFactor *
    colorFactor *
    workStyleFactor *
    layoutStyleFactor *
    advancedRealismFactor *
    coverUpFactor *
    (options?.extraCaution ?? 1);
  const spread = clamp(
    0.18 +
      (!input.hasReferenceImage && !input.hasReferenceNote ? 0.03 : 0) +
      (placementBucket === "hard" ? 0.02 : 0) +
      (input.largeAreaCoverage === "almost_full" ? 0.02 : 0),
    0.16,
    0.32,
  );

  return buildRangeOutput(
    center,
    spread,
    "soft_range",
    context,
    getMinimumFloorForAreaScope("large_single_area", profile),
    0.54,
    [
      options?.reasoningPrefix ?? "areaScope:large_single_area",
      `largeAreaCase:${caseId}`,
      `coverage:${input.largeAreaCoverage ?? "mostly"}`,
      `placement:${placementBucket}`,
      `color:${input.colorMode}`,
      `workStyle:${input.workStyle}`,
      `realismLevel:${input.realismLevel ?? "standard"}`,
      `layoutStyle:${input.layoutStyle ?? "organic"}`,
      `coverageFactor:${coverageFactor.toFixed(3)}`,
      `colorFactor:${colorFactor.toFixed(3)}`,
      `workStyleFactor:${workStyleFactor.toFixed(3)}`,
      `layoutStyleFactor:${layoutStyleFactor.toFixed(3)}`,
      `advancedRealismFactor:${advancedRealismFactor.toFixed(3)}`,
      `coverUpFactor:${coverUpFactor.toFixed(3)}`,
    ],
  );
}

function estimateWideAreaPrice(
  input: CustomRequestPricingInput,
  context: PricingV2Context,
  profile: PricingV2Context["profile"],
  options?: {
    reasoningPrefix?: string;
    extraCaution?: number;
  },
): PricingV2Output {
  const target = input.wideAreaTarget ?? "unsure";
  const caseId = resolveWideAreaCaseId(target);
  const halfSleeve = getWideAreaStartingPoint(profile.wideAreaCases, "half-sleeve", profile.minimumJobPrice * 4.8);
  const fullSleeve = getWideAreaStartingPoint(profile.wideAreaCases, "full-sleeve", profile.minimumJobPrice * 8.4);
  const backLarge = getWideAreaStartingPoint(
    profile.wideAreaCases,
    "back-large-coverage",
    profile.minimumJobPrice * 7.2,
  );
  const baseStartingFrom = getWideAreaStartingPoint(
    profile.wideAreaCases,
    caseId,
    caseId === "full-sleeve" ? fullSleeve : caseId === "back-large-coverage" ? backLarge : halfSleeve,
  );
  const targetFactor =
    target === "unsure"
      ? roundToFriendlyPrice((halfSleeve + backLarge) / 2, "up") / Math.max(baseStartingFrom, 1)
      : getWideAreaTargetFactor(target);
  const colorFactor = getConcreteColorFactor(input.colorMode, { requestType: null }, profile, 0.72);
  const workStyleFactor = getConcreteWorkStyleFactor(input.workStyle, { requestType: null }, profile, 0.78);
  const layoutStyleFactor = getLayoutStyleFactor(input, profile, null, 0.76);
  const advancedRealismFactor = getAdvancedRealismFactor(input, profile, null, 0.78);
  const coverUpFactor = input.coverUp
    ? 1 + (profile.specialCaseAdjustments.coverUpPremiumFactor - 1) * 0.68
    : 1;
  const startingFrom =
    baseStartingFrom *
    targetFactor *
    colorFactor *
    workStyleFactor *
    layoutStyleFactor *
    advancedRealismFactor *
    coverUpFactor *
    (options?.extraCaution ?? 1);

  return buildStartingFromOutput(
    startingFrom,
    context,
    getMinimumFloorForAreaScope("wide_area", profile),
    0.44,
    [
      options?.reasoningPrefix ?? "areaScope:wide_area",
      `wideAreaCase:${caseId}`,
      `wideAreaTarget:${target}`,
      `color:${input.colorMode}`,
      `workStyle:${input.workStyle}`,
      `realismLevel:${input.realismLevel ?? "standard"}`,
      `layoutStyle:${input.layoutStyle ?? "organic"}`,
      `targetFactor:${targetFactor.toFixed(3)}`,
      `colorFactor:${colorFactor.toFixed(3)}`,
      `workStyleFactor:${workStyleFactor.toFixed(3)}`,
      `layoutStyleFactor:${layoutStyleFactor.toFixed(3)}`,
      `advancedRealismFactor:${advancedRealismFactor.toFixed(3)}`,
      `coverUpFactor:${coverUpFactor.toFixed(3)}`,
    ],
  );
}

function estimateUnsurePrice(
  input: CustomRequestPricingInput,
  context: PricingV2Context,
  profile: PricingV2Context["profile"],
): PricingV2Output {
  if (input.coverUp || input.requestType === "cover_up") {
    return estimateStandardPiecePrice(
      { ...input, requestType: "cover_up" },
      context,
      profile,
      {
        cautious: true,
        reasoningPrefix: "areaScope:unsure->cover_up",
        unsureAdjustment: getUnsureAdjustmentConfig(input),
      },
    );
  }

  const unsureAdjustment = getUnsureAdjustmentConfig(input);

  if (input.sizeCm >= 24) {
    return estimateWideAreaPrice(
      {
        ...input,
        areaScope: "wide_area",
        requestType: null,
        wideAreaTarget: resolveWideAreaTargetFromPlacement(input.placement),
      },
      context,
      profile,
      { reasoningPrefix: "areaScope:unsure->wide_area", extraCaution: unsureAdjustment.wideAreaExtraCaution },
    );
  }

  if (input.sizeCm >= 18 || isTorsoOrBackPlacement(input.placement)) {
    return estimateLargeSingleAreaPrice(
      {
        ...input,
        areaScope: "large_single_area",
        requestType: null,
        largeAreaCoverage: input.largeAreaCoverage ?? "mostly",
      },
      context,
      profile,
      {
        reasoningPrefix: "areaScope:unsure->large_single_area",
        extraCaution: unsureAdjustment.largeAreaExtraCaution,
      },
    );
  }

  return estimateStandardPiecePrice(
    {
      ...input,
      requestType: input.requestType ?? "unsure",
    },
    context,
    profile,
    {
      cautious: true,
      reasoningPrefix: "areaScope:unsure->standard_piece",
      unsureAdjustment,
    },
  );
}

export function estimateCustomRequestPrice(
  input: CustomRequestPricingInput,
  context: PricingV2Context,
): PricingV2Output {
  const profile = context.profile ?? getArtistPricingV2Profile(context.pricingRules);

  switch (input.areaScope) {
    case "large_single_area":
      return estimateLargeSingleAreaPrice(input, context, profile);
    case "wide_area":
      return estimateWideAreaPrice(input, context, profile);
    case "unsure":
      return estimateUnsurePrice(input, context, profile);
    case "standard_piece":
    default:
      return estimateStandardPiecePrice(input, context, profile);
  }
}
