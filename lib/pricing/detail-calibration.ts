import type {
  ArtistPricingRules,
  DetailCalibrationFamily,
  DetailCalibrationLevel,
  DetailCalibrationProfile,
  DetailCalibrationRawResponse,
  DetailLevelValue,
} from "../types.ts";

export const DETAIL_CALIBRATION_PROFILE_VERSION = 1 as const;
export const DETAIL_CALIBRATION_SAMPLE_SET_VERSION = "detail-calibration-v1";
export const DETAIL_CALIBRATION_SAMPLE_IDS = [
  "snake-low",
  "floral-low",
  "geometric-low",
  "snake-medium",
  "floral-medium",
  "geometric-medium",
  "snake-high",
  "floral-high",
  "geometric-high",
] as const;

export type DetailCalibrationSampleId = (typeof DETAIL_CALIBRATION_SAMPLE_IDS)[number];

export type DetailCalibrationSample = {
  id: DetailCalibrationSampleId;
  imagePath: string;
  family: DetailCalibrationFamily;
  canonicalDetailLevel: DetailCalibrationLevel;
};

export type DetailCalibrationSubmission = {
  sampleOrder: DetailCalibrationSampleId[];
  responses: Array<{
    sampleId: DetailCalibrationSampleId;
    selectedDetailLevel: DetailCalibrationLevel;
  }>;
};

const DETAIL_LEVEL_SCORES: Record<DetailCalibrationLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const DETAIL_WEIGHT_LIMITS = {
  low: { min: 0.88, max: 1.12 },
  medium: { min: 0.94, max: 1.06 },
  high: { min: 0.88, max: 1.12 },
  ultra: { min: 0.9, max: 1.14 },
} as const;

const LOW_DETAIL_WEIGHT_FACTOR = 0.08;
const MEDIUM_DETAIL_WEIGHT_FACTOR = 0.04;
const HIGH_DETAIL_WEIGHT_FACTOR = 0.08;
const ULTRA_DETAIL_WEIGHT_FACTOR = 0.1;
const FAMILY_BIAS_BLEND = 0.35;

export const DETAIL_CALIBRATION_LEVELS = ["low", "medium", "high"] as const;
export const DETAIL_CALIBRATION_SAMPLES: DetailCalibrationSample[] = [
  {
    id: "snake-low",
    imagePath: "sample-tattoos/detail-calibration-samples/low1.png",
    family: "snake",
    canonicalDetailLevel: "low",
  },
  {
    id: "floral-low",
    imagePath: "sample-tattoos/detail-calibration-samples/low2.png",
    family: "floral",
    canonicalDetailLevel: "low",
  },
  {
    id: "geometric-low",
    imagePath: "sample-tattoos/detail-calibration-samples/low3.png",
    family: "geometric",
    canonicalDetailLevel: "low",
  },
  {
    id: "snake-medium",
    imagePath: "sample-tattoos/detail-calibration-samples/medium1.png",
    family: "snake",
    canonicalDetailLevel: "medium",
  },
  {
    id: "floral-medium",
    imagePath: "sample-tattoos/detail-calibration-samples/medium2.png",
    family: "floral",
    canonicalDetailLevel: "medium",
  },
  {
    id: "geometric-medium",
    imagePath: "sample-tattoos/detail-calibration-samples/medium3.png",
    family: "geometric",
    canonicalDetailLevel: "medium",
  },
  {
    id: "snake-high",
    imagePath: "sample-tattoos/detail-calibration-samples/high1.png",
    family: "snake",
    canonicalDetailLevel: "high",
  },
  {
    id: "floral-high",
    imagePath: "sample-tattoos/detail-calibration-samples/high2.png",
    family: "floral",
    canonicalDetailLevel: "high",
  },
  {
    id: "geometric-high",
    imagePath: "sample-tattoos/detail-calibration-samples/high3.png",
    family: "geometric",
    canonicalDetailLevel: "high",
  },
] as const;

const sampleMap = new Map<DetailCalibrationSampleId, DetailCalibrationSample>(
  DETAIL_CALIBRATION_SAMPLES.map((sample) => [sample.id, sample]),
);

export function isDetailCalibrationSampleId(value: string): value is DetailCalibrationSampleId {
  return sampleMap.has(value as DetailCalibrationSampleId);
}

function roundNumber(value: number, precision = 3) {
  return Number(value.toFixed(precision));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildNormalizedDetailMapping(detailBiasScore: number) {
  const bias = clamp(detailBiasScore, -1, 1);

  return {
    low: roundNumber(
      clamp(1 - bias * LOW_DETAIL_WEIGHT_FACTOR, DETAIL_WEIGHT_LIMITS.low.min, DETAIL_WEIGHT_LIMITS.low.max),
    ),
    medium: roundNumber(
      clamp(1 + bias * MEDIUM_DETAIL_WEIGHT_FACTOR, DETAIL_WEIGHT_LIMITS.medium.min, DETAIL_WEIGHT_LIMITS.medium.max),
    ),
    high: roundNumber(
      clamp(1 + bias * HIGH_DETAIL_WEIGHT_FACTOR, DETAIL_WEIGHT_LIMITS.high.min, DETAIL_WEIGHT_LIMITS.high.max),
    ),
  } satisfies Record<DetailCalibrationLevel, number>;
}

function resolveEffectiveBias(
  profile: DetailCalibrationProfile,
  family?: DetailCalibrationFamily | null,
) {
  if (!family) {
    return profile.detailBiasScore;
  }

  const familyBias = profile.familyBiasScores[family];
  return roundNumber(
    clamp(
      profile.detailBiasScore + (familyBias - profile.detailBiasScore) * FAMILY_BIAS_BLEND,
      -1,
      1,
    ),
  );
}

export function createRandomizedDetailCalibrationOrder(random = Math.random) {
  const order = [...DETAIL_CALIBRATION_SAMPLE_IDS];

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
}

export function deriveDetailCalibrationProfile(
  submission: DetailCalibrationSubmission,
  completedAt = new Date().toISOString(),
): DetailCalibrationProfile {
  if (submission.sampleOrder.length !== DETAIL_CALIBRATION_SAMPLES.length) {
    throw new Error("Detail calibration requires all sample ids in the display order.");
  }

  const uniqueOrder = new Set(submission.sampleOrder);
  if (uniqueOrder.size !== DETAIL_CALIBRATION_SAMPLES.length) {
    throw new Error("Detail calibration sample order must contain unique sample ids.");
  }

  const responseMap = new Map(submission.responses.map((response) => [response.sampleId, response.selectedDetailLevel]));
  if (responseMap.size !== DETAIL_CALIBRATION_SAMPLES.length) {
    throw new Error("Detail calibration requires one response per sample.");
  }

  const rawResponses: DetailCalibrationRawResponse[] = submission.sampleOrder.map((sampleId) => {
    const sample = sampleMap.get(sampleId);
    const selectedDetailLevel = responseMap.get(sampleId);

    if (!sample || !selectedDetailLevel) {
      throw new Error("Detail calibration contains an unknown sample or missing response.");
    }

    return {
      sampleId,
      family: sample.family,
      canonicalDetailLevel: sample.canonicalDetailLevel,
      selectedDetailLevel,
      delta:
        DETAIL_LEVEL_SCORES[selectedDetailLevel] -
        DETAIL_LEVEL_SCORES[sample.canonicalDetailLevel],
    };
  });

  const detailBiasScore = roundNumber(average(rawResponses.map((response) => response.delta)));
  const familyBiasScores = {
    floral: roundNumber(
      average(rawResponses.filter((response) => response.family === "floral").map((response) => response.delta)),
    ),
    geometric: roundNumber(
      average(rawResponses.filter((response) => response.family === "geometric").map((response) => response.delta)),
    ),
    snake: roundNumber(
      average(rawResponses.filter((response) => response.family === "snake").map((response) => response.delta)),
    ),
  } satisfies Record<DetailCalibrationFamily, number>;

  return {
    version: DETAIL_CALIBRATION_PROFILE_VERSION,
    sampleSetVersion: DETAIL_CALIBRATION_SAMPLE_SET_VERSION,
    sampleOrder: [...submission.sampleOrder],
    rawResponses,
    detailBiasScore,
    familyBiasScores,
    normalizedDetailMapping: buildNormalizedDetailMapping(detailBiasScore),
    calibrationCompletedAt: completedAt,
    completed: true,
  };
}

export function getArtistDetailCalibration(rules: ArtistPricingRules) {
  const profile = rules.calibrationExamples.detailCalibration;

  if (
    !profile?.completed ||
    profile.version !== DETAIL_CALIBRATION_PROFILE_VERSION ||
    profile.sampleSetVersion !== DETAIL_CALIBRATION_SAMPLE_SET_VERSION ||
    profile.rawResponses.length !== DETAIL_CALIBRATION_SAMPLES.length
  ) {
    return null;
  }

  return profile;
}

export function resolvePersonalizedDetailWeight(
  profile: DetailCalibrationProfile | null | undefined,
  detailLevel: DetailLevelValue | "ultra",
  family?: DetailCalibrationFamily | null,
) {
  if (!profile) {
    return 1;
  }

  const effectiveBias = resolveEffectiveBias(profile, family);
  const normalizedMapping =
    family ? buildNormalizedDetailMapping(effectiveBias) : profile.normalizedDetailMapping;

  switch (detailLevel) {
    case "simple":
      return normalizedMapping.low;
    case "standard":
      return normalizedMapping.medium;
    case "detailed":
      return normalizedMapping.high;
    case "ultra":
      return roundNumber(
        clamp(
          1 + effectiveBias * ULTRA_DETAIL_WEIGHT_FACTOR,
          DETAIL_WEIGHT_LIMITS.ultra.min,
          DETAIL_WEIGHT_LIMITS.ultra.max,
        ),
      );
  }
}

export function buildDetailCalibrationDebugSnapshot(
  profile: DetailCalibrationProfile,
) {
  return {
    rawSelections: profile.rawResponses.map((response) => ({
      sampleId: response.sampleId,
      family: response.family,
      canonical: response.canonicalDetailLevel,
      selected: response.selectedDetailLevel,
      delta: response.delta,
    })),
    globalBias: profile.detailBiasScore,
    familyBias: profile.familyBiasScores,
    normalizedDetailMapping: profile.normalizedDetailMapping,
    completedAt: profile.calibrationCompletedAt,
  };
}
