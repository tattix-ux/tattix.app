import type {
  ArtistPricingRules,
  ColorModeValue,
  DetailLevelValue,
  PricingCalibrationRawInputs,
  PricingFinalValidation,
  PricingProfile,
  PricingSimpleBaseline,
  PricingProfileAdjustmentKey,
  PricingProfileAdjustments,
  PricingProfileUpdateLog,
  PricingValidationExampleId,
  PricingValidationFeedback,
  PricingValidationReason,
} from "../types.ts";
import type { SizeValue } from "../constants/options.ts";
import { FINAL_CONTROL_PROBES } from "./final-control.ts";

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

const ADJUSTMENT_LIMITS: Record<PricingProfileAdjustmentKey, { min: number; max: number }> = {
  baseline: { min: 0.92, max: 1.08 },
  sizeSmall: { min: 0.9, max: 1.1 },
  detailLow: { min: 0.9, max: 1.12 },
  detailHigh: { min: 0.9, max: 1.14 },
  color: { min: 0.92, max: 1.14 },
  style: { min: 0.9, max: 1.16 },
};

const RESOLVED_FACTOR_LIMITS = {
  sizeSmall: { min: 0.55, max: 1.1 },
  detailLow: { min: 0.68, max: 1.05 },
  detailHigh: { min: 1, max: 1.95 },
  color: { min: 1, max: 1.75 },
  style: { min: 0.9, max: 1.16 },
} as const;

const MAIN_STEP = 0.04;
const SECONDARY_STEP = 0.015;
const BASE_NUDGE = 0.01;
const STYLE_MAIN_STEP = 0.045;
const STYLE_DETAIL_STEP = 0.03;
const STYLE_SECONDARY_STEP = 0.015;

type PriceInputValue = number | string | null | undefined;

export type PricingCalibrationRawInputLike = Partial<
  Record<keyof PricingCalibrationRawInputs, PriceInputValue>
>;

export type PricingProfileUpdateResult = {
  pricingProfile: PricingProfile;
  appliedUpdates: PricingProfileUpdateLog[];
  finalValidation: PricingFinalValidation;
};

export type FinalControlRoundInput = {
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>;
  reasons?: Partial<Record<PricingValidationExampleId, PricingValidationReason>>;
};

export type DerivedPricingProfile = {
  sanitizedInputs: PricingCalibrationRawInputs;
  pricingProfile: PricingProfile;
};

export type PricingProfileDebugSnapshot = {
  rawInputs: PricingCalibrationRawInputs;
  derived: PricingProfile;
};

export type FinalControlUpdateDebugSnapshot = {
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>;
  reasons: Partial<Record<PricingValidationExampleId, PricingValidationReason>>;
  appliedUpdates: PricingProfileUpdateLog[];
  before: PricingProfileAdjustments;
  after: PricingProfileAdjustments;
  validation: PricingFinalValidation;
};

type TargetDelta = {
  key: PricingProfileAdjustmentKey;
  step: number;
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

function sanitizeOptionalPositivePrice(value: PriceInputValue) {
  const numeric = toFiniteNumber(value);

  if (numeric === null || numeric <= 0) {
    return null;
  }

  return roundPrice(numeric);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeDivide(numerator: number, denominator: number, fallback = 1) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
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

export function buildNeutralPricingProfileAdjustments(): PricingProfileAdjustments {
  return {
    baseline: 1,
    sizeSmall: 1,
    detailLow: 1,
    detailHigh: 1,
    color: 1,
    style: 1,
  };
}

export function getPricingProfileAdjustments(profile: PricingProfile | null | undefined) {
  return {
    ...buildNeutralPricingProfileAdjustments(),
    ...(profile?.adjustments ?? {}),
  } satisfies PricingProfileAdjustments;
}

function clampAdjustment(key: PricingProfileAdjustmentKey, value: number) {
  const limits = ADJUSTMENT_LIMITS[key];
  return roundRatio(clamp(value, limits.min, limits.max));
}

function applyAdjustmentDelta(
  current: PricingProfileAdjustments,
  key: PricingProfileAdjustmentKey,
  signedStep: number,
) {
  const before = current[key];
  const after = clampAdjustment(key, before + signedStep);

  current[key] = after;

  return {
    key,
    delta: roundRatio(after - before),
    before,
    after,
  };
}

function countValidationFeedback(
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>,
) {
  const values = Object.values(feedback);
  return {
    correct: values.filter((value) => value === "looks-right").length,
    low: values.filter((value) => value === "slightly-low").length,
    high: values.filter((value) => value === "slightly-high").length,
    answered: values.length,
  };
}

function summarizeValidationStatus(
  counts: ReturnType<typeof countValidationFeedback>,
  total: number,
  hasUpdates: boolean,
): Pick<
  PricingFinalValidation,
  "validationStatus" | "calibratedAndValidated" | "appliedGlobalValidationAdjustment"
> {
  if (!counts.answered) {
    return {
      validationStatus: "pending",
      calibratedAndValidated: false,
      appliedGlobalValidationAdjustment: 1,
    };
  }

  if (counts.correct === counts.answered && counts.answered === total) {
    return {
      validationStatus: "confirmed",
      calibratedAndValidated: true,
      appliedGlobalValidationAdjustment: 1,
    };
  }

  if (counts.answered < total) {
    return {
      validationStatus: hasUpdates ? "adjusted" : "pending",
      calibratedAndValidated: false,
      appliedGlobalValidationAdjustment: 1,
    };
  }

  if (hasUpdates) {
    return {
      validationStatus: "adjusted",
      calibratedAndValidated: true,
      appliedGlobalValidationAdjustment: 1,
    };
  }

  return {
    validationStatus: "completed-no-majority",
    calibratedAndValidated: true,
    appliedGlobalValidationAdjustment: 1,
  };
}

function getSignedDirection(verdict: PricingValidationFeedback) {
  if (verdict === "slightly-low") {
    return 1;
  }

  if (verdict === "slightly-high") {
    return -1;
  }

  return 0;
}

function buildTargetDeltas(
  probeType: typeof FINAL_CONTROL_PROBES[number]["probeType"],
  reason: PricingValidationReason | null,
): TargetDelta[] {
  const resolvedReason = reason ?? "general";

  switch (probeType) {
    case "low_boundary":
      if (resolvedReason === "size") {
        return [
          { key: "sizeSmall", step: MAIN_STEP },
          { key: "detailLow", step: SECONDARY_STEP },
        ];
      }

      if (resolvedReason === "detail") {
        return [
          { key: "detailLow", step: MAIN_STEP },
          { key: "sizeSmall", step: SECONDARY_STEP },
        ];
      }

      return [
        { key: "detailLow", step: 0.03 },
        { key: "sizeSmall", step: 0.02 },
        { key: "baseline", step: BASE_NUDGE },
      ];

    case "color":
      if (resolvedReason === "color") {
        return [{ key: "color", step: MAIN_STEP }];
      }

      return [
        { key: "color", step: MAIN_STEP },
        { key: "baseline", step: BASE_NUDGE },
      ];

    case "baseline":
      return [{ key: "baseline", step: 0.035 }];

    case "high_detail":
      if (resolvedReason === "detail") {
        return [{ key: "detailHigh", step: MAIN_STEP }];
      }

      return [
        { key: "detailHigh", step: MAIN_STEP },
        { key: "baseline", step: BASE_NUDGE },
      ];

    case "style":
      if (resolvedReason === "detail") {
        return [
          { key: "style", step: STYLE_DETAIL_STEP },
          { key: "detailHigh", step: STYLE_SECONDARY_STEP },
        ];
      }

      return [{ key: "style", step: STYLE_MAIN_STEP }];
  }
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
    textAnchorPrice: sanitizeOptionalPositivePrice(rawInputs.textAnchorPrice),
    minimalSymbolAnchorPrice: sanitizeOptionalPositivePrice(rawInputs.minimalSymbolAnchorPrice),
  };
}

function deriveSimpleBaseline(
  sanitizedInputs: PricingCalibrationRawInputs,
): PricingSimpleBaseline | null {
  if (
    !sanitizedInputs.textAnchorPrice ||
    !sanitizedInputs.minimalSymbolAnchorPrice
  ) {
    return null;
  }

  const blendedPrice = roundPrice(
    (sanitizedInputs.textAnchorPrice + sanitizedInputs.minimalSymbolAnchorPrice) / 2,
  );

  return {
    textAnchorPrice: sanitizedInputs.textAnchorPrice,
    minimalSymbolAnchorPrice: sanitizedInputs.minimalSymbolAnchorPrice,
    blendedPrice,
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
  const simpleBaseline = deriveSimpleBaseline(sanitizedInputs);

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
      simpleBaseline,
      adjustments: buildNeutralPricingProfileAdjustments(),
      finalControl: null,
    },
  };
}

export function getArtistPricingProfile(rules: ArtistPricingRules) {
  return rules.calibrationExamples.pricingProfile ?? null;
}

export function getArtistPricingRawInputs(rules: ArtistPricingRules) {
  return rules.calibrationExamples.pricingRawInputs ?? null;
}

export function resolveBaselineAdjustment(profile: PricingProfile | null) {
  return getPricingProfileAdjustments(profile).baseline;
}

export function resolveSizeFactor(profile: PricingProfile | null, size: SizeValue) {
  if (!profile) {
    return 1;
  }

  const adjustments = getPricingProfileAdjustments(profile);
  const tinyFactor = clamp(
    profile.size.small * adjustments.sizeSmall,
    RESOLVED_FACTOR_LIMITS.sizeSmall.min,
    RESOLVED_FACTOR_LIMITS.sizeSmall.max,
  );
  const smallFactor = roundRatio(tinyFactor + (profile.size.medium - tinyFactor) * 0.4);

  switch (size) {
    case "tiny":
      return tinyFactor;
    case "small":
      return smallFactor;
    case "medium":
      return profile.size.medium;
    case "large":
      return profile.size.large;
  }
}

export function resolveDetailFactor(
  profile: PricingProfile | null,
  detailLevel: DetailLevelValue | "ultra",
) {
  if (!profile) {
    return 1;
  }

  const adjustments = getPricingProfileAdjustments(profile);
  const lowFactor = clamp(
    profile.detail.low * adjustments.detailLow,
    RESOLVED_FACTOR_LIMITS.detailLow.min,
    RESOLVED_FACTOR_LIMITS.detailLow.max,
  );
  const highFactor = clamp(
    profile.detail.high * adjustments.detailHigh,
    RESOLVED_FACTOR_LIMITS.detailHigh.min,
    RESOLVED_FACTOR_LIMITS.detailHigh.max,
  );

  switch (detailLevel) {
    case "simple":
      return roundRatio(lowFactor);
    case "standard":
      return profile.detail.medium;
    case "ultra":
      return Math.max(
        roundRatio(highFactor),
        smoothRatio(highFactor * 1.08, {
          center: 1,
          strength: 0.6,
          min: 1,
          max: RESOLVED_FACTOR_LIMITS.detailHigh.max,
        }),
      );
    case "detailed":
      return roundRatio(highFactor);
  }
}

export function resolveColorFactor(profile: PricingProfile | null, colorMode: ColorModeValue) {
  if (!profile) {
    return 1;
  }

  const adjustments = getPricingProfileAdjustments(profile);
  const fullColorFactor = clamp(
    profile.color.factor * adjustments.color,
    RESOLVED_FACTOR_LIMITS.color.min,
    RESOLVED_FACTOR_LIMITS.color.max,
  );

  switch (colorMode) {
    case "black-only":
      return 1;
    case "black-grey":
      return roundRatio(1 + (fullColorFactor - 1) * 0.5);
    case "full-color":
      return roundRatio(fullColorFactor);
  }
}

export function resolveStyleFactor(profile: PricingProfile | null) {
  return clamp(
    getPricingProfileAdjustments(profile).style,
    RESOLVED_FACTOR_LIMITS.style.min,
    RESOLVED_FACTOR_LIMITS.style.max,
  );
}

export function resolveSimpleBaseline(profile: PricingProfile | null) {
  return profile?.simpleBaseline ?? null;
}

export function applyFinalControlFeedbackToPricingProfile(
  pricingProfile: PricingProfile,
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>,
  reasons: Partial<Record<PricingValidationExampleId, PricingValidationReason>>,
  options?: {
    validationRound?: number;
    updatedAt?: string;
  },
): PricingProfileUpdateResult {
  const nextAdjustments = getPricingProfileAdjustments(pricingProfile);
  const beforeAdjustments = { ...nextAdjustments };
  const appliedUpdates: PricingProfileUpdateLog[] = [];
  const responses: NonNullable<PricingProfile["finalControl"]>["responses"] = {};

  for (const probe of FINAL_CONTROL_PROBES) {
    const verdict = feedback[probe.id];

    if (!verdict) {
      continue;
    }

    const reason = verdict === "looks-right" ? null : (reasons[probe.id] ?? "general");
    const direction = getSignedDirection(verdict);
    const changes =
      direction === 0
        ? []
        : buildTargetDeltas(probe.probeType, reason).map((target) =>
            applyAdjustmentDelta(nextAdjustments, target.key, target.step * direction),
          );

    responses[probe.id] = {
      verdict,
      reason,
    };
    appliedUpdates.push({
      probeId: probe.id,
      probeType: probe.probeType,
      verdict,
      reason,
      changes: changes.filter((change) => change.delta !== 0),
    });
  }

  const counts = countValidationFeedback(feedback);
  const hasUpdates = appliedUpdates.some((update) => update.changes.length > 0);
  const validationSummary = summarizeValidationStatus(counts, FINAL_CONTROL_PROBES.length, hasUpdates);
  const validationRound = options?.validationRound ?? 1;
  const updatedAt = options?.updatedAt ?? new Date().toISOString();

  const finalValidation: PricingFinalValidation = {
    validationRound,
    perExampleFeedback: feedback,
    perExampleReason: reasons,
    appliedGlobalValidationAdjustment: validationSummary.appliedGlobalValidationAdjustment,
    validationStatus: validationSummary.validationStatus,
    calibratedAndValidated: validationSummary.calibratedAndValidated,
    appliedUpdates,
  };

  return {
    pricingProfile: {
      ...pricingProfile,
      adjustments: nextAdjustments,
      finalControl: {
        version: 1,
        responses,
        appliedUpdates,
        updatedAt,
      },
    },
    appliedUpdates,
    finalValidation,
  };
}

export function applyFinalControlRoundsToPricingProfile(
  pricingProfile: PricingProfile,
  rounds: FinalControlRoundInput[],
  options?: {
    updatedAt?: string;
  },
): PricingProfileUpdateResult {
  if (!rounds.length) {
    return {
      pricingProfile,
      appliedUpdates: [],
      finalValidation: {
        validationRound: 0,
        perExampleFeedback: {},
        perExampleReason: {},
        appliedGlobalValidationAdjustment: 1,
        validationStatus: "pending",
        calibratedAndValidated: false,
        appliedUpdates: [],
      },
    };
  }

  let nextProfile = pricingProfile;
  let latestFeedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>> = {};
  let latestReasons: Partial<Record<PricingValidationExampleId, PricingValidationReason>> = {};
  const allAppliedUpdates: PricingProfileUpdateLog[] = [];

  rounds.forEach((round, index) => {
    const roundResult = applyFinalControlFeedbackToPricingProfile(
      nextProfile,
      round.feedback,
      round.reasons ?? {},
      {
        validationRound: index + 1,
        updatedAt: options?.updatedAt,
      },
    );

    nextProfile = roundResult.pricingProfile;
    latestFeedback = {
      ...latestFeedback,
      ...round.feedback,
    };
    latestReasons = {
      ...latestReasons,
      ...(round.reasons ?? {}),
    };
    allAppliedUpdates.push(...roundResult.appliedUpdates);
  });

  const finalValidation: PricingFinalValidation = {
    validationRound: rounds.length,
    perExampleFeedback: latestFeedback,
    perExampleReason: latestReasons,
    appliedGlobalValidationAdjustment: 1,
    validationStatus: FINAL_CONTROL_PROBES.every((probe) => latestFeedback[probe.id] === "looks-right")
      ? "confirmed"
      : "adjusted",
    calibratedAndValidated: FINAL_CONTROL_PROBES.every((probe) => latestFeedback[probe.id] === "looks-right"),
    appliedUpdates: allAppliedUpdates,
  };

  return {
    pricingProfile: {
      ...nextProfile,
      finalControl: {
        version: 1,
        responses: Object.fromEntries(
          Object.entries(latestFeedback).map(([probeId, verdict]) => [
            probeId,
            {
              verdict,
              reason: verdict === "looks-right" ? null : (latestReasons[probeId as PricingValidationExampleId] ?? "general"),
            },
          ]),
        ) as NonNullable<PricingProfile["finalControl"]>["responses"],
        appliedUpdates: allAppliedUpdates,
        updatedAt: options?.updatedAt ?? new Date().toISOString(),
      },
    },
    appliedUpdates: allAppliedUpdates,
    finalValidation,
  };
}

export function buildPricingProfileDebugSnapshot(
  rawInputs: PricingCalibrationRawInputs,
  pricingProfile: PricingProfile,
): PricingProfileDebugSnapshot {
  return {
    rawInputs,
    derived: pricingProfile,
  };
}

export function buildFinalControlUpdateDebugSnapshot(
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>,
  reasons: Partial<Record<PricingValidationExampleId, PricingValidationReason>>,
  before: PricingProfile,
  result: PricingProfileUpdateResult,
): FinalControlUpdateDebugSnapshot {
  return {
    feedback,
    reasons,
    appliedUpdates: result.appliedUpdates,
    before: getPricingProfileAdjustments(before),
    after: getPricingProfileAdjustments(result.pricingProfile),
    validation: result.finalValidation,
  };
}
