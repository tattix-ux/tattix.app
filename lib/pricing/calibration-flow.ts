import type { z } from "zod";

import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import { pricingSchema } from "@/lib/forms/schemas";
import {
  buildNormalizedQuoteConfig,
  estimateNormalizedQuote,
  type NormalizedQuoteInput,
} from "@/lib/pricing/normalized-engine";
import type {
  ArtistPricingRules,
  ColorModeValue,
  DetailLevelValue,
  PriceRange,
  PricingFinalValidation,
  PricingValidationExampleId,
  PricingValidationFeedback,
  PricingValidationStatus,
} from "@/lib/types";

export type PricingPayload = z.output<typeof pricingSchema>;

export type DraftRange = {
  min: string;
  max: string;
};

export type CalibrationDraft = {
  openingPrice: string;
  validation: {
    globalScale: string;
    finalValidation: PricingFinalValidation;
  };
  size: {
    size8: DraftRange;
    size12: DraftRange;
    size18: DraftRange;
    size25: DraftRange;
  };
  detail: {
    low: DraftRange;
    medium: DraftRange;
    high: DraftRange;
    ultra: DraftRange;
  };
  placement: {
    easy: DraftRange;
    hard: DraftRange;
  };
  color: {
    black: DraftRange;
    color: DraftRange;
  };
};

export type CalibrationPreview = {
  id: string;
  range: {
    min: number;
    max: number;
  };
};

export type ValidationScenario = {
  id: PricingValidationExampleId;
  image: "minimal-linework" | "ornamental-dagger" | "realistic-eye" | "colored-butterfly";
  sizeCm: number;
  placement: BodyAreaDetailValue;
  detailLevel: DetailLevelValue;
  colorMode: ColorModeValue;
};

export type CalibrationQuestion =
  | { id: "size8" | "size12" | "size18" | "size25"; step: 1; stepIndex: number; image: "medium" }
  | { id: "placementHard"; step: 2; stepIndex: number; image: "medium" }
  | { id: "colorColor"; step: 3; stepIndex: number; image: "color" }
  | { id: "detailLow" | "detailHigh" | "detailUltra"; step: 4; stepIndex: number; image: "low" | "high" | "ultra" };

export const CALIBRATION_QUESTIONS: CalibrationQuestion[] = [
  { id: "size8", step: 1, stepIndex: 1, image: "medium" },
  { id: "size12", step: 1, stepIndex: 2, image: "medium" },
  { id: "size18", step: 1, stepIndex: 3, image: "medium" },
  { id: "size25", step: 1, stepIndex: 4, image: "medium" },
  { id: "placementHard", step: 2, stepIndex: 1, image: "medium" },
  { id: "colorColor", step: 3, stepIndex: 1, image: "color" },
  { id: "detailLow", step: 4, stepIndex: 1, image: "low" },
  { id: "detailHigh", step: 4, stepIndex: 2, image: "high" },
  { id: "detailUltra", step: 4, stepIndex: 3, image: "ultra" },
];

export const CALIBRATION_SLOT_LABELS = [
  { slotId: "size-8cm", axis: "size", key: "8cm", label: "8 cm referans slotu", assetRef: null },
  { slotId: "size-12cm", axis: "size", key: "12cm", label: "12 cm referans slotu", assetRef: null },
  { slotId: "size-18cm", axis: "size", key: "18cm", label: "18 cm referans slotu", assetRef: null },
  { slotId: "size-25cm", axis: "size", key: "25cm", label: "25 cm referans slotu", assetRef: null },
  { slotId: "detail-low", axis: "detailLevel", key: "low", label: "Az detay referans slotu", assetRef: null },
  { slotId: "detail-medium", axis: "detailLevel", key: "medium", label: "Orta detay referans slotu", assetRef: null },
  { slotId: "detail-high", axis: "detailLevel", key: "high", label: "Çok detay referans slotu", assetRef: null },
  { slotId: "detail-realism", axis: "detailLevel", key: "realism", label: "Realism referans slotu", assetRef: null },
  { slotId: "placement-easy", axis: "placement", key: "easy", label: "Kolay bölge referans slotu", assetRef: null },
  { slotId: "placement-hard", axis: "placement", key: "hard", label: "Zor bölge referans slotu", assetRef: null },
  { slotId: "color-black", axis: "colorMode", key: "black", label: "Siyah referans slotu", assetRef: null },
  { slotId: "color-color", axis: "colorMode", key: "color", label: "Renkli referans slotu", assetRef: null },
] as const;

export const VALIDATION_SCENARIOS: ValidationScenario[] = [
  {
    id: "minimal-linework",
    image: "minimal-linework",
    sizeCm: 6,
    placement: "forearm-outer",
    detailLevel: "simple",
    colorMode: "black-only",
  },
  {
    id: "ornamental-dagger",
    image: "ornamental-dagger",
    sizeCm: 14,
    placement: "forearm-outer",
    detailLevel: "standard",
    colorMode: "black-only",
  },
  {
    id: "realistic-eye",
    image: "realistic-eye",
    sizeCm: 18,
    placement: "ribs",
    detailLevel: "detailed",
    colorMode: "black-grey",
  },
  {
    id: "colored-butterfly",
    image: "colored-butterfly",
    sizeCm: 12,
    placement: "forearm-outer",
    detailLevel: "standard",
    colorMode: "full-color",
  },
];

export const VALIDATION_UPWARD_ADJUSTMENT = 1.06;
export const VALIDATION_DOWNWARD_ADJUSTMENT = 0.94;
const VALIDATION_AXIS_NUDGE_UP = 1.03;
const VALIDATION_AXIS_NUDGE_DOWN = 0.97;

const DEFAULT_NEUTRAL_RANGE: PriceRange = { min: 1, max: 1.08 };
const DEFAULT_HARD_RANGE: PriceRange = { min: 1.14, max: 1.3 };
const DEFAULT_NOT_SURE_RANGE: PriceRange = { min: 1, max: 1.05 };
const DEFAULT_BLACK_RANGE: PriceRange = { min: 0.94, max: 1 };
const DEFAULT_COLOR_RANGE: PriceRange = { min: 1.18, max: 1.35 };
const DEFAULT_HARD_PLACEMENTS = new Set([
  "ribs",
  "spine-area",
  "neck-front",
  "neck-side",
  "hand",
  "fingers",
  "foot",
  "toes",
  "ankle",
  "wrist",
  "head",
]);

function roundPrice(value: number) {
  return Math.max(0, Math.round(value));
}

function scaleDraftRange(range: DraftRange, multiplier: number): DraftRange {
  const normalized = normalizeDraftRange(range);

  if (!normalized) {
    return range;
  }

  return {
    min: String(roundPrice(normalized.min * multiplier)),
    max: String(roundPrice(Math.max(normalized.min, normalized.max) * multiplier)),
  };
}

function midpoint(range: PriceRange | undefined) {
  if (!range) {
    return null;
  }

  return (range.min + range.max) / 2;
}

function normalizeDraftRange(range: DraftRange) {
  const min = Number(range.min);
  const max = Number(range.max);

  if (!Number.isFinite(min) || min < 0) {
    return null;
  }

  if (!Number.isFinite(max) || max <= 0) {
    return { min, max: min };
  }

  return {
    min: Math.max(0, Math.min(min, max)),
    max: Math.max(Math.max(0, min), max),
  };
}

function factorRangeFromPriceRange(range: DraftRange, anchorPrice: number, fallback: PriceRange): PriceRange {
  const normalized = normalizeDraftRange(range);

  if (!normalized || !Number.isFinite(anchorPrice) || anchorPrice <= 0) {
    return fallback;
  }

  const min = Number((normalized.min / anchorPrice).toFixed(4));
  const max = Number((normalized.max / anchorPrice).toFixed(4));

  return {
    min: Math.max(0, Math.min(min, max)),
    max: Math.max(Math.max(0, min), max),
  };
}

function stringRange(range: PriceRange): DraftRange {
  return {
    min: String(roundPrice(range.min)),
    max: String(roundPrice(Math.max(range.min, range.max))),
  };
}

function priceRangeFromFactors(anchorPrice: number, range: PriceRange | undefined, fallback: PriceRange): PriceRange {
  const source = range ?? fallback;

  return {
    min: roundPrice(anchorPrice * source.min),
    max: roundPrice(anchorPrice * source.max),
  };
}

function averageRanges(ranges: PriceRange[], fallback: PriceRange): PriceRange {
  if (!ranges.length) {
    return fallback;
  }

  const min = ranges.reduce((sum, range) => sum + range.min, 0) / ranges.length;
  const max = ranges.reduce((sum, range) => sum + range.max, 0) / ranges.length;

  return {
    min: Number(min.toFixed(4)),
    max: Number(Math.max(min, max).toFixed(4)),
  };
}

function collectUniquePlacementDetails() {
  const seen = new Set<string>();

  return bodyPlacementGroups.flatMap((group) =>
    group.details.filter((detail) => {
      if (detail.value === "placement-not-sure") {
        return false;
      }

      if (seen.has(detail.value)) {
        return false;
      }

      seen.add(detail.value);
      return true;
    }),
  );
}

function resolveHardPlacementKeys(pricingRules: ArtistPricingRules) {
  const details = collectUniquePlacementDetails();
  const currentHard = details
    .filter((detail) => midpoint(pricingRules.placementModifiers[detail.value]) !== null)
    .filter((detail) => (midpoint(pricingRules.placementModifiers[detail.value]) ?? 1) >= 1.12)
    .map((detail) => detail.value);

  if (currentHard.length > 0) {
    return new Set(currentHard);
  }

  return DEFAULT_HARD_PLACEMENTS;
}

function derivePlacementDefaults(pricingRules: ArtistPricingRules, anchorPrice: number) {
  const hardKeys = resolveHardPlacementKeys(pricingRules);
  const details = collectUniquePlacementDetails();
  const easyRanges: PriceRange[] = [];
  const hardRanges: PriceRange[] = [];

  for (const detail of details) {
    const range = pricingRules.placementModifiers[detail.value];
    if (!range) {
      continue;
    }

    if (hardKeys.has(detail.value)) {
      hardRanges.push(range);
    } else {
      easyRanges.push(range);
    }
  }

  return {
    hardKeys,
    easy: priceRangeFromFactors(anchorPrice, averageRanges(easyRanges, DEFAULT_NEUTRAL_RANGE), DEFAULT_NEUTRAL_RANGE),
    hard: priceRangeFromFactors(anchorPrice, averageRanges(hardRanges, DEFAULT_HARD_RANGE), DEFAULT_HARD_RANGE),
  };
}

function interpolateRange(left: PriceRange, right: PriceRange, mix = 0.5): PriceRange {
  const safeMix = Math.min(1, Math.max(0, mix));

  return {
    min: Number((left.min + (right.min - left.min) * safeMix).toFixed(4)),
    max: Number((left.max + (right.max - left.max) * safeMix).toFixed(4)),
  };
}

function combineDetailRange(
  anchorPrice: number,
  highRange: DraftRange,
  ultraRange: DraftRange,
) {
  const high = factorRangeFromPriceRange(highRange, anchorPrice, { min: 1.12, max: 1.28 });
  const ultra = factorRangeFromPriceRange(ultraRange, anchorPrice, { min: 1.32, max: 1.55 });

  return {
    min: Math.max(0.25, Math.min(high.min, high.max)),
    max: Math.max(Math.max(high.min, high.max), ultra.max),
  };
}

export function buildInitialCalibrationDraft(pricingRules: ArtistPricingRules): CalibrationDraft {
  const anchorPrice = Math.max(pricingRules.anchorPrice || pricingRules.basePrice || 0, 100);
  const placementDefaults = derivePlacementDefaults(pricingRules, anchorPrice);

  return {
    openingPrice: String(roundPrice(anchorPrice)),
    validation: {
      globalScale: String(
        typeof pricingRules.calibrationExamples.globalScale === "number" &&
          Number.isFinite(pricingRules.calibrationExamples.globalScale)
          ? Number(pricingRules.calibrationExamples.globalScale.toFixed(2))
          : 1,
      ),
      finalValidation:
        pricingRules.calibrationExamples.finalValidation ?? {
          validationRound: 1,
          perExampleFeedback: {},
          appliedGlobalValidationAdjustment: 1,
          validationStatus: "pending",
          calibratedAndValidated: false,
        },
    },
    size: {
      size8: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["8"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["8"], max: pricingRules.calibrationExamples.sizeCurve["8"] }
          : priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.tiny, { min: 0.35, max: 0.6 }),
      ),
      size12: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["12"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["12"], max: pricingRules.calibrationExamples.sizeCurve["12"] }
          : priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.small, { min: 0.55, max: 0.85 }),
      ),
      size18: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["18"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["18"], max: pricingRules.calibrationExamples.sizeCurve["18"] }
          : priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.medium, { min: 0.95, max: 1.2 }),
      ),
      size25: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["25"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["25"], max: pricingRules.calibrationExamples.sizeCurve["25"] }
          : priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.large, { min: 1.8, max: 2.4 }),
      ),
    },
    detail: {
      low: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.detailLevelModifiers.simple, { min: 0.92, max: 1 })),
      medium: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["12"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["12"], max: pricingRules.calibrationExamples.sizeCurve["12"] }
          : pricingRules.calibrationExamples.detailLevel.standard
            ? { min: pricingRules.calibrationExamples.detailLevel.standard, max: pricingRules.calibrationExamples.detailLevel.standard }
            : priceRangeFromFactors(anchorPrice, pricingRules.detailLevelModifiers.standard, { min: 1, max: 1.12 }),
      ),
      high: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.detailLevelModifiers.detailed, { min: 1.12, max: 1.28 })),
      ultra: stringRange(
        pricingRules.calibrationExamples.detailLevel.ultra
          ? {
              min: pricingRules.calibrationExamples.detailLevel.ultra,
              max: pricingRules.calibrationExamples.detailLevel.ultra,
            }
          : {
              min: roundPrice(
                (pricingRules.calibrationExamples.detailLevel.detailed || anchorPrice) * 1.14,
              ),
              max: roundPrice(
                (pricingRules.calibrationExamples.detailLevel.detailed || anchorPrice) * 1.14,
              ),
            },
      ),
    },
    placement: {
      easy: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["12"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["12"], max: pricingRules.calibrationExamples.sizeCurve["12"] }
          : pricingRules.calibrationExamples.placementDifficulty?.easy
            ? { min: pricingRules.calibrationExamples.placementDifficulty.easy, max: pricingRules.calibrationExamples.placementDifficulty.easy }
            : placementDefaults.easy,
      ),
      hard: stringRange(
        pricingRules.calibrationExamples.placementDifficulty?.hard
          ? { min: pricingRules.calibrationExamples.placementDifficulty.hard, max: pricingRules.calibrationExamples.placementDifficulty.hard }
          : placementDefaults.hard,
      ),
    },
    color: {
      black: stringRange(
        pricingRules.calibrationExamples.sizeCurve?.["12"]
          ? { min: pricingRules.calibrationExamples.sizeCurve["12"], max: pricingRules.calibrationExamples.sizeCurve["12"] }
          : pricingRules.calibrationExamples.colorMode["black-only"]
            ? { min: pricingRules.calibrationExamples.colorMode["black-only"], max: pricingRules.calibrationExamples.colorMode["black-only"] }
            : priceRangeFromFactors(anchorPrice, pricingRules.colorModeModifiers["black-only"], DEFAULT_BLACK_RANGE),
      ),
      color: stringRange(
        pricingRules.calibrationExamples.colorMode["full-color"]
          ? { min: pricingRules.calibrationExamples.colorMode["full-color"], max: pricingRules.calibrationExamples.colorMode["full-color"] }
          : priceRangeFromFactors(anchorPrice, pricingRules.colorModeModifiers["full-color"], DEFAULT_COLOR_RANGE),
      ),
    },
  };
}

export function updateCalibrationDraftRange(
  current: CalibrationDraft,
  section: keyof Omit<CalibrationDraft, "openingPrice" | "validation">,
  key: string,
  edge: keyof DraftRange,
  value: string,
): CalibrationDraft {
  return {
    ...current,
    [section]: {
      ...current[section],
      [key]: {
        ...(current[section] as Record<string, DraftRange>)[key],
        [edge]: value,
      },
    },
  } as CalibrationDraft;
}

export function updateCalibrationValidationDraft(
  current: CalibrationDraft,
  next: Partial<CalibrationDraft["validation"]>,
): CalibrationDraft {
  return {
    ...current,
    validation: {
      ...current.validation,
      ...next,
    },
  };
}

export function updateFinalValidationDraft(
  current: CalibrationDraft,
  next: Partial<PricingFinalValidation>,
): CalibrationDraft {
  return {
    ...current,
    validation: {
      ...current.validation,
      finalValidation: {
        ...current.validation.finalValidation,
        ...next,
      },
    },
  };
}

export function applyValidationFeedbackAdjustments(
  draft: CalibrationDraft,
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>,
  scaleMultiplier: number,
): CalibrationDraft {
  let nextDraft: CalibrationDraft = {
    ...draft,
    validation: {
      ...draft.validation,
      globalScale: Number(
        Math.max(0.85, Math.min(1.2, (Number(draft.validation.globalScale) || 1) * scaleMultiplier)).toFixed(2),
      ).toString(),
    },
  };

  const applyScenarioAdjustment = (
    scenarioId: PricingValidationExampleId,
    mutate: (current: CalibrationDraft, axisMultiplier: number) => CalibrationDraft,
  ) => {
    const currentFeedback = feedback[scenarioId];

    if (!currentFeedback || currentFeedback === "looks-right") {
      return;
    }

    const axisMultiplier =
      currentFeedback === "slightly-low"
        ? VALIDATION_AXIS_NUDGE_UP
        : VALIDATION_AXIS_NUDGE_DOWN;

    nextDraft = mutate(nextDraft, axisMultiplier);
  };

  applyScenarioAdjustment("minimal-linework", (current, axisMultiplier) => ({
    ...current,
    size: {
      ...current.size,
      size8: scaleDraftRange(current.size.size8, axisMultiplier),
    },
    detail: {
      ...current.detail,
      low: scaleDraftRange(current.detail.low, axisMultiplier),
    },
  }));

  applyScenarioAdjustment("ornamental-dagger", (current, axisMultiplier) => ({
    ...current,
    size: {
      ...current.size,
      size12: scaleDraftRange(current.size.size12, axisMultiplier),
      size18: scaleDraftRange(current.size.size18, axisMultiplier),
    },
    detail: {
      ...current.detail,
      high: scaleDraftRange(current.detail.high, axisMultiplier),
    },
  }));

  applyScenarioAdjustment("realistic-eye", (current, axisMultiplier) => ({
    ...current,
    size: {
      ...current.size,
      size18: scaleDraftRange(current.size.size18, axisMultiplier),
    },
    detail: {
      ...current.detail,
      high: scaleDraftRange(current.detail.high, axisMultiplier),
      ultra: scaleDraftRange(current.detail.ultra, axisMultiplier),
    },
    placement: {
      ...current.placement,
      hard: scaleDraftRange(current.placement.hard, axisMultiplier),
    },
  }));

  applyScenarioAdjustment("colored-butterfly", (current, axisMultiplier) => ({
    ...current,
    size: {
      ...current.size,
      size12: scaleDraftRange(current.size.size12, axisMultiplier),
    },
    color: {
      ...current.color,
      color: scaleDraftRange(current.color.color, axisMultiplier),
    },
  }));

  return nextDraft;
}

export function buildCalibrationSlots(existing: ArtistPricingRules["calibrationReferenceSlots"]) {
  return CALIBRATION_SLOT_LABELS.map((slot) => {
    const existingSlot = existing.find((item) => item.slotId === slot.slotId);
    return existingSlot ? { ...existingSlot, axis: slot.axis, key: slot.key, label: slot.label } : { ...slot };
  });
}

export function buildPricingPayloadFromCalibrationDraft(
  draft: CalibrationDraft,
  pricingRules: ArtistPricingRules,
): PricingPayload {
  const anchorPrice = Math.max(Number(draft.openingPrice) || 0, 1);
  const easyPlacement = factorRangeFromPriceRange(draft.placement.easy, anchorPrice, DEFAULT_NEUTRAL_RANGE);
  const hardPlacement = factorRangeFromPriceRange(draft.placement.hard, anchorPrice, DEFAULT_HARD_RANGE);
  const hardKeys = resolveHardPlacementKeys(pricingRules);
  const placementModifiers = Object.fromEntries(
    bodyPlacementGroups.flatMap((group) =>
      group.details.map((detail) => [
        detail.value,
        detail.value === "placement-not-sure"
          ? DEFAULT_NOT_SURE_RANGE
          : hardKeys.has(detail.value)
            ? hardPlacement
            : easyPlacement,
      ]),
    ),
  );

  const blackOnly = factorRangeFromPriceRange(draft.color.black, anchorPrice, DEFAULT_BLACK_RANGE);
  const fullColor = factorRangeFromPriceRange(draft.color.color, anchorPrice, DEFAULT_COLOR_RANGE);
  const blackGrey = interpolateRange(blackOnly, fullColor, 0.45);
  const detailedRange = combineDetailRange(anchorPrice, draft.detail.high, draft.detail.ultra);

  return {
    basePrice: anchorPrice,
    minimumCharge: anchorPrice,
    sizeModifiers: {
      tiny: factorRangeFromPriceRange(draft.size.size8, anchorPrice, { min: 0.35, max: 0.6 }),
      small: factorRangeFromPriceRange(draft.size.size12, anchorPrice, { min: 0.55, max: 0.85 }),
      medium: factorRangeFromPriceRange(draft.size.size18, anchorPrice, { min: 0.95, max: 1.2 }),
      large: factorRangeFromPriceRange(draft.size.size25, anchorPrice, { min: 1.8, max: 2.4 }),
    },
    placementModifiers,
    detailLevelModifiers: {
      simple: factorRangeFromPriceRange(draft.detail.low, anchorPrice, { min: 0.92, max: 1 }),
      standard: factorRangeFromPriceRange(draft.size.size12, anchorPrice, { min: 1, max: 1 }),
      detailed: detailedRange,
    },
    colorModeModifiers: {
      "black-only": factorRangeFromPriceRange(draft.size.size12, anchorPrice, DEFAULT_BLACK_RANGE),
      "black-grey": blackGrey,
      "full-color": fullColor,
    },
    addonFees: pricingRules.addonFees,
    calibrationAnswers: {
      sizeCurve: {
        "8": normalizeDraftRange(draft.size.size8) ?? { min: 0, max: 0 },
        "12": normalizeDraftRange(draft.size.size12) ?? { min: 0, max: 0 },
        "18": normalizeDraftRange(draft.size.size18) ?? { min: 0, max: 0 },
        "25": normalizeDraftRange(draft.size.size25) ?? { min: 0, max: 0 },
      },
      detailLevel: {
        low: normalizeDraftRange(draft.detail.low) ?? { min: 0, max: 0 },
        medium: normalizeDraftRange(draft.size.size12) ?? { min: 0, max: 0 },
        high: normalizeDraftRange(draft.detail.high) ?? { min: 0, max: 0 },
        ultra: normalizeDraftRange(draft.detail.ultra) ?? { min: 0, max: 0 },
      },
      placementDifficulty: {
        easy: normalizeDraftRange(draft.size.size12) ?? { min: 0, max: 0 },
        hard: normalizeDraftRange(draft.placement.hard) ?? { min: 0, max: 0 },
      },
      colorMode: {
        black: normalizeDraftRange(draft.size.size12) ?? { min: 0, max: 0 },
        color: normalizeDraftRange(draft.color.color) ?? { min: 0, max: 0 },
      },
      validation: {
        feedback: "looks-right",
        globalScale: Number(draft.validation.globalScale) || 1,
      },
      finalValidation: draft.validation.finalValidation,
    },
  };
}

export function buildPricingRulesFromCalibrationDraft(
  draft: CalibrationDraft,
  pricingRules: ArtistPricingRules,
): ArtistPricingRules {
  const payload = buildPricingPayloadFromCalibrationDraft(draft, pricingRules);
  const easyPlacementPrice = midpoint(payload.calibrationAnswers?.placementDifficulty.easy) ?? payload.basePrice;
  const hardPlacementPrice = midpoint(payload.calibrationAnswers?.placementDifficulty.hard) ?? easyPlacementPrice;
  const blackPrice = midpoint(payload.calibrationAnswers?.colorMode.black) ?? payload.basePrice;
  const colorPrice = midpoint(payload.calibrationAnswers?.colorMode.color) ?? blackPrice;

  return {
    ...pricingRules,
    anchorPrice: Math.round(payload.basePrice),
    basePrice: Math.round(payload.basePrice),
    minimumCharge: Math.round(payload.minimumCharge),
    calibrationExamples: {
      size: {
        tiny: roundPrice(payload.basePrice * midpoint(payload.sizeModifiers.tiny)!),
        small: roundPrice(payload.basePrice * midpoint(payload.sizeModifiers.small)!),
        medium: roundPrice(payload.basePrice * midpoint(payload.sizeModifiers.medium)!),
        large: roundPrice(payload.basePrice * midpoint(payload.sizeModifiers.large)!),
      },
      sizeCurve: {
        "8": roundPrice(midpoint(payload.calibrationAnswers?.sizeCurve["8"]) ?? payload.basePrice),
        "12": roundPrice(midpoint(payload.calibrationAnswers?.sizeCurve["12"]) ?? payload.basePrice),
        "18": roundPrice(midpoint(payload.calibrationAnswers?.sizeCurve["18"]) ?? payload.basePrice),
        "25": roundPrice(midpoint(payload.calibrationAnswers?.sizeCurve["25"]) ?? payload.basePrice),
      },
      detailLevel: {
        simple: roundPrice(midpoint(payload.calibrationAnswers?.detailLevel.low) ?? payload.basePrice),
        standard: roundPrice(midpoint(payload.calibrationAnswers?.detailLevel.medium) ?? payload.basePrice),
        detailed: roundPrice(midpoint(payload.calibrationAnswers?.detailLevel.high) ?? payload.basePrice),
        ultra: roundPrice(midpoint(payload.calibrationAnswers?.detailLevel.ultra) ?? payload.basePrice),
      },
      placement: Object.fromEntries(
        Object.entries(payload.placementModifiers).map(([key, value]) => [
          key,
          roundPrice(payload.basePrice * midpoint(value)!),
        ]),
      ),
      placementDifficulty: {
        easy: roundPrice(easyPlacementPrice),
        hard: roundPrice(hardPlacementPrice),
      },
      colorMode: {
        "black-only": roundPrice(blackPrice),
        "black-grey": roundPrice(payload.basePrice * midpoint(payload.colorModeModifiers["black-grey"])!),
        "full-color": roundPrice(colorPrice),
      },
      globalScale: payload.calibrationAnswers?.validation?.globalScale ?? 1,
      finalValidation: payload.calibrationAnswers?.finalValidation,
    },
    sizeModifiers: payload.sizeModifiers,
    placementModifiers: payload.placementModifiers,
    detailLevelModifiers: payload.detailLevelModifiers,
    colorModeModifiers: payload.colorModeModifiers,
    addonFees: payload.addonFees,
    minimumSessionPrice: Math.round(payload.minimumCharge),
    sizeBaseRanges: {
      tiny: {
        min: roundPrice(payload.basePrice * payload.sizeModifiers.tiny.min),
        max: roundPrice(payload.basePrice * payload.sizeModifiers.tiny.max),
      },
      small: {
        min: roundPrice(payload.basePrice * payload.sizeModifiers.small.min),
        max: roundPrice(payload.basePrice * payload.sizeModifiers.small.max),
      },
      medium: {
        min: roundPrice(payload.basePrice * payload.sizeModifiers.medium.min),
        max: roundPrice(payload.basePrice * payload.sizeModifiers.medium.max),
      },
      large: {
        min: roundPrice(payload.basePrice * payload.sizeModifiers.large.min),
        max: roundPrice(payload.basePrice * payload.sizeModifiers.large.max),
      },
    },
  };
}

export function buildValidationPreviewExamples(
  draft: CalibrationDraft,
  pricingRules: ArtistPricingRules,
): CalibrationPreview[] {
  const rules = buildPricingRulesFromCalibrationDraft(draft, pricingRules);
  const config = buildNormalizedQuoteConfig(rules);

  return VALIDATION_SCENARIOS.map((scenario) => {
    const input: NormalizedQuoteInput = {
      size: scenario.sizeCm <= 8 ? "tiny" : scenario.sizeCm <= 12 ? "small" : scenario.sizeCm <= 18 ? "medium" : "large",
      sizeCm: scenario.sizeCm,
      placement: scenario.placement,
      detailLevel: scenario.detailLevel,
      colorMode: scenario.colorMode,
      coverUp: false,
      customDesign: false,
      designType: null,
    };
    const range = estimateNormalizedQuote(input, config);

    return {
      id: scenario.id,
      range,
    };
  });
}

function countFeedback(feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>) {
  const values = Object.values(feedback);
  const correct = values.filter((value) => value === "looks-right").length;
  const low = values.filter((value) => value === "slightly-low").length;
  const high = values.filter((value) => value === "slightly-high").length;

  return { correct, low, high };
}

function resolveValidationStatus(
  round: 1 | 2,
  counts: ReturnType<typeof countFeedback>,
): {
  status: PricingValidationStatus;
  calibratedAndValidated: boolean;
  adjustment: number;
  needsSecondRound: boolean;
} {
  if (counts.correct > counts.low && counts.correct > counts.high) {
    return {
      status: "confirmed",
      calibratedAndValidated: true,
      adjustment: 1,
      needsSecondRound: false,
    };
  }

  if (counts.low > counts.correct && counts.low > counts.high) {
    if (round === 1) {
      return {
        status: "adjusted",
        calibratedAndValidated: false,
        adjustment: VALIDATION_UPWARD_ADJUSTMENT,
        needsSecondRound: true,
      };
    }

    return {
      status: "needs-review",
      calibratedAndValidated: false,
      adjustment: 1,
      needsSecondRound: false,
    };
  }

  if (counts.high > counts.correct && counts.high > counts.low) {
    if (round === 1) {
      return {
        status: "adjusted",
        calibratedAndValidated: false,
        adjustment: VALIDATION_DOWNWARD_ADJUSTMENT,
        needsSecondRound: true,
      };
    }

    return {
      status: "needs-review",
      calibratedAndValidated: false,
      adjustment: 1,
      needsSecondRound: false,
    };
  }

  return {
    status: round === 2 ? "completed-no-majority" : "confirmed",
    calibratedAndValidated: true,
    adjustment: 1,
    needsSecondRound: false,
  };
}

export function summarizeFinalValidationReview(
  feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>,
  round: 1 | 2,
): {
  review: PricingFinalValidation;
  nextScaleMultiplier: number;
  needsSecondRound: boolean;
} {
  const counts = countFeedback(feedback);
  const outcome = resolveValidationStatus(round, counts);

  return {
    review: {
      validationRound: round,
      perExampleFeedback: feedback,
      appliedGlobalValidationAdjustment: outcome.adjustment,
      validationStatus: outcome.status,
      calibratedAndValidated: outcome.calibratedAndValidated,
    },
    nextScaleMultiplier: outcome.adjustment,
    needsSecondRound: outcome.needsSecondRound,
  };
}

export function isCalibrationReady(pricingRules: ArtistPricingRules) {
  return Boolean(
    pricingRules.calibrationExamples.sizeCurve &&
      pricingRules.calibrationExamples.detailLevel.standard &&
      pricingRules.calibrationExamples.placementDifficulty?.easy &&
      pricingRules.calibrationExamples.colorMode["black-only"],
  );
}
