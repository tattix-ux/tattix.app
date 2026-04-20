import type { SizeValue } from "@/lib/constants/options";
import type {
  ArtistPricingV2Profile,
  PricingV2ReviewAdjustments,
  PricingV2SizeProfile,
  PricingV2SizeSeries,
  RequestTypeValue,
  SubmissionRequest,
} from "@/lib/types";
import { clamp, dampedPowerScale, safeRatio } from "./helpers";

const CATEGORY_DEFAULTS: Record<SizeValue, number> = {
  tiny: 4,
  small: 8,
  medium: 13,
  large: 20,
};

const SIZE_SERIES_CASE_IDS = {
  object6cm: "object-6cm-forearm",
  object10cm: "object-10cm-forearm",
  object16cm: "object-16cm-forearm",
} as const;

function midpoint(minimum: number, maximum: number) {
  return (minimum + maximum) / 2;
}

function getCaseMidpoint(
  onboardingCases: Array<{ id: string; min: number; max: number }>,
  caseId: string,
  fallback: number,
) {
  const found = onboardingCases.find((item) => item.id === caseId);
  if (!found) {
    return fallback;
  }

  return midpoint(found.min, found.max);
}

function getReviewBiasMultiplier(verdict: "looks-right" | "slightly-low" | "slightly-high") {
  if (verdict === "slightly-low") {
    return 1.06;
  }

  if (verdict === "slightly-high") {
    return 0.94;
  }

  return 1;
}

export function deriveReviewAdjustmentBias(input: {
  verdict: "looks-right" | "slightly-low" | "slightly-high";
  reason?: "size" | "detail" | "placement" | "color_shading" | "cover_up" | "general";
  currentBias?: number;
  iterationCount?: number;
}) {
  if (input.verdict === "looks-right") {
    return clamp(input.currentBias ?? 1, 0.78, 1.34);
  }

  const direction = input.verdict === "slightly-low" ? 1 : -1;
  const iterationBoost = Math.min(input.iterationCount ?? 0, 3) * 0.012;
  const baseStep =
    input.reason === "size" || input.reason === "cover_up"
      ? 0.09
      : input.reason === "detail"
        ? 0.075
        : input.reason === "placement" || input.reason === "color_shading"
          ? 0.065
          : 0.07;
  const step = clamp(baseStep + iterationBoost, 0.05, 0.22);
  const base = input.currentBias ?? 1;

  return clamp(base * (1 + direction * step), 0.78, 1.34);
}

function applyCaseFamilyBias(
  id: string,
  bias: number,
  current: PricingV2ReviewAdjustments,
  weight = 1,
) {
  const weightedBias = clamp(1 + (bias - 1) * weight, 0.78, 1.34);

  if (id === "review-text") {
    return { ...current, textBias: clamp(current.textBias * weightedBias, 0.78, 1.34) };
  }

  if (id === "review-mini") {
    return { ...current, miniSimpleBias: clamp(current.miniSimpleBias * weightedBias, 0.78, 1.34) };
  }

  if (id === "review-single-large") {
    return {
      ...current,
      singleObjectBias: clamp(current.singleObjectBias * clamp(1 + (bias - 1) * 0.5, 0.84, 1.22), 0.78, 1.34),
      largeSizeBias: clamp(current.largeSizeBias * weightedBias, 0.78, 1.34),
    };
  }

  if (id === "review-multi") {
    return { ...current, multiElementBias: clamp(current.multiElementBias * weightedBias, 0.78, 1.34) };
  }

  if (id === "review-cover") {
    return { ...current, coverUpBias: clamp(current.coverUpBias * weightedBias, 0.78, 1.34) };
  }

  if (id === "review-color") {
    return {
      ...current,
      singleObjectBias: clamp(current.singleObjectBias * clamp(1 + (bias - 1) * 0.34, 0.86, 1.18), 0.78, 1.34),
      colorShadingBias: clamp(current.colorShadingBias * clamp(1 + (bias - 1) * 0.72, 0.82, 1.28), 0.82, 1.28),
    };
  }

  return current;
}

function getLowerSlope(object6cm: number, object10cm: number) {
  return Math.log(Math.max(object10cm, 1) / Math.max(object6cm, 1)) / Math.log(10 / 6);
}

function getUpperSlope(object10cm: number, object16cm: number) {
  return Math.log(Math.max(object16cm, 1) / Math.max(object10cm, 1)) / Math.log(16 / 10);
}

function interpolateLog(startSize: number, startFactor: number, endSize: number, endFactor: number, sizeCm: number) {
  const progress = clamp((sizeCm - startSize) / (endSize - startSize), 0, 1);
  return Math.exp(Math.log(startFactor) + (Math.log(endFactor) - Math.log(startFactor)) * progress);
}

function getRequestTypeDefaultExponent(requestType: RequestTypeValue) {
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

function getRequestTypeReferenceSizeCm(requestType: RequestTypeValue) {
  switch (requestType) {
    case "text":
      return 4;
    case "mini_simple":
      return 4;
    case "single_object":
      return 10;
    case "multi_element":
      return 15;
    case "cover_up":
      return 7;
    case "unsure":
      return 10;
  }
}

function getRequestTypeFactorLimits(requestType: RequestTypeValue) {
  if (requestType === "multi_element") {
    return { min: 0.82, max: 1.95 };
  }

  if (requestType === "text") {
    return { min: 0.84, max: 1.38 };
  }

  if (requestType === "mini_simple") {
    return { min: 0.82, max: 1.48 };
  }

  if (requestType === "cover_up") {
    return { min: 0.84, max: 1.72 };
  }

  return { min: 0.82, max: 1.68 };
}

function getRequestTypeArtistBlendWeight(requestType: RequestTypeValue) {
  switch (requestType) {
    case "text":
      return 0.22;
    case "mini_simple":
      return 0.3;
    case "single_object":
      return 0.7;
    case "multi_element":
      return 0.56;
    case "cover_up":
      return 0.42;
    case "unsure":
      return 0.46;
  }
}

function getRequestTypeMinimumTension(requestType: RequestTypeValue) {
  switch (requestType) {
    case "text":
      return 0.42;
    case "mini_simple":
      return 0.34;
    case "single_object":
      return 0.2;
    case "multi_element":
      return 0.08;
    case "cover_up":
      return 0.14;
    case "unsure":
      return 0.18;
  }
}

function buildDefaultSizeFactor(requestType: RequestTypeValue, sizeCm: number) {
  const referenceSizeCm = getRequestTypeReferenceSizeCm(requestType);
  const limits = getRequestTypeFactorLimits(requestType);

  return {
    factor: clamp(
      Math.pow(Math.max(sizeCm, 2) / referenceSizeCm, getRequestTypeDefaultExponent(requestType)),
      limits.min,
      limits.max,
    ),
    referenceSizeCm,
    limits,
  };
}

export function resolveRepresentativeSizeCm(submission: SubmissionRequest) {
  if (
    typeof submission.approximateSizeCm === "number" &&
    Number.isFinite(submission.approximateSizeCm) &&
    submission.approximateSizeCm > 0
  ) {
    return submission.approximateSizeCm;
  }

  const width =
    typeof submission.widthCm === "number" && Number.isFinite(submission.widthCm)
      ? submission.widthCm
      : null;
  const height =
    typeof submission.heightCm === "number" && Number.isFinite(submission.heightCm)
      ? submission.heightCm
      : null;

  if (width && height) {
    return Math.max(width, height);
  }

  if (width) {
    return width;
  }

  return CATEGORY_DEFAULTS[submission.sizeCategory] ?? 8;
}

export function deriveSizeCategoryFromCm(sizeCm: number): SizeValue {
  if (sizeCm <= 5) {
    return "tiny";
  }

  if (sizeCm <= 10) {
    return "small";
  }

  if (sizeCm <= 18) {
    return "medium";
  }

  return "large";
}

export function deriveReviewAdjustments(
  reviewCases: Array<{
    id: string;
    verdict: "looks-right" | "slightly-low" | "slightly-high";
    reason?: "size" | "detail" | "placement" | "color_shading" | "cover_up" | "general";
    adjustmentBias?: number;
  }>,
): PricingV2ReviewAdjustments {
  const initial: PricingV2ReviewAdjustments = {
    globalBias: 1,
    textBias: 1,
    miniSimpleBias: 1,
    singleObjectBias: 1,
    largeSizeBias: 1,
    multiElementBias: 1,
    coverUpBias: 1,
    placementBias: 1,
    detailBias: 1,
    colorShadingBias: 1,
  };

  return reviewCases.reduce((current, item) => {
    const bias = clamp(item.adjustmentBias ?? getReviewBiasMultiplier(item.verdict), 0.78, 1.34);
    const reason = item.reason ?? "general";

    if (reason === "placement") {
      return applyCaseFamilyBias(
        item.id,
        bias,
        {
          ...current,
          placementBias: clamp(current.placementBias * bias, 0.82, 1.26),
        },
        0.35,
      );
    }

    if (reason === "detail") {
      return applyCaseFamilyBias(
        item.id,
        bias,
        {
          ...current,
          detailBias: clamp(current.detailBias * bias, 0.82, 1.28),
        },
        0.28,
      );
    }

    if (reason === "color_shading") {
      return applyCaseFamilyBias(
        item.id,
        bias,
        {
          ...current,
          colorShadingBias: clamp(current.colorShadingBias * bias, 0.82, 1.28),
        },
        0.24,
      );
    }

    if (reason === "cover_up") {
      return applyCaseFamilyBias(
        item.id,
        bias,
        {
          ...current,
          coverUpBias: clamp(current.coverUpBias * bias, 0.78, 1.34),
        },
        0.2,
      );
    }

    return applyCaseFamilyBias(item.id, bias, current, 1);
  }, initial);
}

export function deriveSizeSeriesFromOnboarding(
  onboardingCases: Array<{ id: string; min: number; max: number }>,
  minimumJobPrice: number,
  reviewAdjustments?: PricingV2ReviewAdjustments,
): PricingV2SizeSeries {
  const fallback6 = minimumJobPrice * 1.16;
  const fallback10 = minimumJobPrice * 1.34;
  const fallback16 = minimumJobPrice * 1.76;
  const review = reviewAdjustments ?? {
    globalBias: 1,
    textBias: 1,
    miniSimpleBias: 1,
    singleObjectBias: 1,
    largeSizeBias: 1,
    multiElementBias: 1,
    coverUpBias: 1,
    placementBias: 1,
    detailBias: 1,
    colorShadingBias: 1,
  };

  const base6 = getCaseMidpoint(onboardingCases, SIZE_SERIES_CASE_IDS.object6cm, fallback6);
  const base10 = getCaseMidpoint(onboardingCases, SIZE_SERIES_CASE_IDS.object10cm, fallback10);
  const base16 = getCaseMidpoint(onboardingCases, SIZE_SERIES_CASE_IDS.object16cm, fallback16);

  return {
    object6cm: Math.max(minimumJobPrice, Math.round(base6)),
    object10cm: Math.max(minimumJobPrice, Math.round(base10)),
    object16cm: Math.max(
      minimumJobPrice,
      Math.round(base16),
    ),
  };
}

export function deriveSizeProfileFromOnboarding(
  onboardingCases: Array<{ id: string; min: number; max: number }>,
  minimumJobPrice: number,
  reviewAdjustments?: PricingV2ReviewAdjustments,
): PricingV2SizeProfile {
  // We learn one clean black single-object series (6/10/16 cm) and treat 10 cm as the anchor.
  // Other request types can then borrow this curve without losing their own default behavior.
  const series = deriveSizeSeriesFromOnboarding(onboardingCases, minimumJobPrice, reviewAdjustments);
  const object6To10 = safeRatio(series.object6cm, series.object10cm, 0.82);
  const object10To16 = safeRatio(series.object16cm, series.object10cm, 1.22);
  const object6To16 = safeRatio(series.object16cm, series.object6cm, 1.48);
  const lowerSlope = getLowerSlope(series.object6cm, series.object10cm);
  const upperSlope = getUpperSlope(series.object10cm, series.object16cm);
  const overallSlope = (lowerSlope + upperSlope * 1.15) / 2.15;
  const inferredExponentOffset = clamp(overallSlope - getRequestTypeDefaultExponent("single_object"), -0.18, 0.22);
  const minimumTension = clamp(
    1 - safeRatio(series.object6cm - minimumJobPrice, series.object10cm - minimumJobPrice, 0.55),
    0.08,
    0.52,
  );
  const expectedLargeRatio = Math.pow(16 / 10, getRequestTypeDefaultExponent("single_object"));
  const artistBlendWeight = clamp(
    0.34 +
      Math.abs(inferredExponentOffset) * 1.1 +
      Math.abs(object10To16 - expectedLargeRatio) * 0.55 +
      minimumTension * 0.38,
    0.28,
    0.8,
  );

  return {
    anchorSizeCm: 10,
    anchorPrice: series.object10cm,
    series,
    normalizedRatios: {
      object6To10,
      object10To16,
      object6To16,
    },
    growth: {
      lowerSlope,
      upperSlope,
      overallSlope,
    },
    inferredExponentOffset,
    minimumTension,
    artistBlendWeight,
  };
}

function buildRelativeSingleObjectCurve(sizeCm: number, sizeProfile: PricingV2SizeProfile) {
  const lowerFactor = safeRatio(sizeProfile.series.object6cm, sizeProfile.anchorPrice, 0.82);
  const upperFactor = safeRatio(sizeProfile.series.object16cm, sizeProfile.anchorPrice, 1.24);

  if (sizeCm <= 10) {
    if (sizeCm >= 6) {
      return interpolateLog(6, lowerFactor, 10, 1, sizeCm);
    }

    const extrapolated = lowerFactor * Math.pow(Math.max(sizeCm, 2) / 6, sizeProfile.growth.lowerSlope * 0.78);
    return clamp(extrapolated, 0.72, 1);
  }

  if (sizeCm <= 16) {
    return interpolateLog(10, 1, 16, upperFactor, sizeCm);
  }

  const extrapolated = upperFactor * Math.pow(sizeCm / 16, sizeProfile.growth.upperSlope * 0.86);
  return clamp(extrapolated, 1, 2.2);
}

export function buildCategoryAnchors(
  onboardingCases: Array<{ id: string; min: number; max: number }>,
  minimumJobPrice: number,
  textStartingPrice: number,
  reviewAdjustments: PricingV2ReviewAdjustments,
) {
  const sizeProfile = deriveSizeProfileFromOnboarding(onboardingCases, minimumJobPrice, reviewAdjustments);
  const textAnchor = Math.max(
    minimumJobPrice,
    getCaseMidpoint(onboardingCases, "text-4cm-wrist", textStartingPrice) *
      reviewAdjustments.textBias *
      reviewAdjustments.globalBias,
  );
  const miniAnchor = Math.max(
    minimumJobPrice,
    getCaseMidpoint(onboardingCases, "symbol-4cm-ankle", Math.max(minimumJobPrice * 1.04, textStartingPrice * 1.06)) *
      reviewAdjustments.miniSimpleBias *
      reviewAdjustments.globalBias,
  );
  const coverUpAnchor = Math.max(
    minimumJobPrice,
    getCaseMidpoint(onboardingCases, "small-cover-up", minimumJobPrice * 1.28) *
      reviewAdjustments.coverUpBias *
      reviewAdjustments.globalBias,
  );
  const singleObject = sizeProfile.anchorPrice;
  const multiElement = Math.max(
    singleObject,
    sizeProfile.series.object16cm * 1.16 * reviewAdjustments.multiElementBias,
  );

  return {
    text: Math.round(textAnchor),
    miniSimple: Math.round(miniAnchor),
    singleObject: Math.round(singleObject),
    multiElement: Math.round(multiElement),
    coverUp: Math.round(coverUpAnchor),
    unsure: Math.round((singleObject + multiElement) / 2),
  };
}

export function buildCustomRequestSizeFactor(
  requestType: RequestTypeValue,
  sizeCm: number,
  profile: Pick<ArtistPricingV2Profile, "inferredSizeProfile">,
) {
  // Default job-type behavior stays in place, but the artist's learned size curve
  // gently pulls the final factor toward their own pricing character.
  const defaultSize = buildDefaultSizeFactor(requestType, sizeCm);
  const artistAtTarget = buildRelativeSingleObjectCurve(sizeCm, profile.inferredSizeProfile);
  const artistAtReference = buildRelativeSingleObjectCurve(defaultSize.referenceSizeCm, profile.inferredSizeProfile);
  const artistFactor = clamp(
    safeRatio(artistAtTarget, artistAtReference, defaultSize.factor),
    defaultSize.limits.min * 0.96,
    defaultSize.limits.max * 1.06,
  );
  const blendWeight = clamp(
    getRequestTypeArtistBlendWeight(requestType) * profile.inferredSizeProfile.artistBlendWeight,
    0.14,
    0.78,
  );
  const finalFactor = clamp(
    Math.exp(
      Math.log(Math.max(defaultSize.factor, 0.01)) * (1 - blendWeight) +
        Math.log(Math.max(artistFactor, 0.01)) * blendWeight,
    ),
    defaultSize.limits.min,
    defaultSize.limits.max,
  );

  return {
    factor: finalFactor,
    defaultFactor: defaultSize.factor,
    artistFactor,
    blendWeight,
    referenceSizeCm: defaultSize.referenceSizeCm,
  };
}

export function buildFeaturedDesignSizeFactor(
  sizeCm: number,
  referenceSizeCm: number,
  profile: Pick<ArtistPricingV2Profile, "inferredSizeProfile">,
  mode: "size_adjusted" | "size_and_placement_adjusted" | "starting_from",
) {
  const ratio = safeRatio(sizeCm, Math.max(referenceSizeCm, 2), 1);
  const defaultFactor = dampedPowerScale(
    ratio,
    0.45 + profile.inferredSizeProfile.inferredExponentOffset * 0.28,
    0.9,
    mode === "size_and_placement_adjusted" ? 1.48 : 1.42,
  );
  const artistAtTarget = buildRelativeSingleObjectCurve(sizeCm, profile.inferredSizeProfile);
  const artistAtReference = buildRelativeSingleObjectCurve(referenceSizeCm, profile.inferredSizeProfile);
  const artistFactor = clamp(
    safeRatio(artistAtTarget, artistAtReference, defaultFactor),
    0.92,
    mode === "size_and_placement_adjusted" ? 1.54 : 1.46,
  );
  const blendWeight = clamp(
    profile.inferredSizeProfile.artistBlendWeight *
      (mode === "size_and_placement_adjusted" ? 0.34 : 0.26),
    0.1,
    0.32,
  );
  const factor = clamp(
    Math.exp(
      Math.log(Math.max(defaultFactor, 0.01)) * (1 - blendWeight) +
        Math.log(Math.max(artistFactor, 0.01)) * blendWeight,
    ),
    0.9,
    mode === "size_and_placement_adjusted" ? 1.56 : 1.46,
  );

  return {
    factor,
    defaultFactor,
    artistFactor,
    blendWeight,
  };
}

export function applyMinimumPriceTension(
  rawCenter: number,
  minimumJobPrice: number,
  requestType: RequestTypeValue,
  sizeCm: number,
  profile: Pick<ArtistPricingV2Profile, "inferredSizeProfile">,
) {
  // Small jobs should feel the artist's minimum price more strongly,
  // then release that pressure as size grows.
  const baseTension = getRequestTypeMinimumTension(requestType);
  const sizeRelease = clamp((sizeCm - 4) / 14, 0, 1);
  const tensionStrength = clamp(
    baseTension * profile.inferredSizeProfile.minimumTension * (1 - sizeRelease),
    0,
    0.42,
  );
  const adjustedCenter =
    minimumJobPrice + Math.max(rawCenter - minimumJobPrice, 0) * (1 - tensionStrength);

  return {
    adjustedCenter: Math.max(minimumJobPrice, adjustedCenter),
    tensionStrength,
  };
}
