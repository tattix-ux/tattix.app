import assert from "node:assert/strict";
import test from "node:test";

import { buildNormalizedQuoteConfig, estimateNormalizedQuote } from "../lib/pricing/normalized-engine.ts";

const baseRules = {
  artistId: "test-artist",
  anchorPrice: 3000,
  basePrice: 3000,
  minimumCharge: 2500,
  calibrationExamples: {
    size: {
      tiny: 2200,
      small: 3000,
      medium: 4200,
      large: 5800,
    },
    sizeCurve: {
      "8": 2200,
      "12": 3000,
      "18": 4200,
      "25": 5800,
    },
    detailLevel: {
      simple: 2700,
      standard: 3000,
      detailed: 3800,
      ultra: 4600,
    },
    placement: {},
    placementDifficulty: {
      easy: 3000,
      hard: 3600,
    },
    colorMode: {
      "black-only": 3000,
      "black-grey": 3350,
      "full-color": 3900,
    },
    globalScale: 1,
    finalValidation: {
      validationRound: 1,
      perExampleFeedback: {},
      appliedGlobalValidationAdjustment: 1,
      validationStatus: "confirmed",
      calibratedAndValidated: true,
    },
  },
  calibrationReferenceSlots: [],
  sizeModifiers: {
    tiny: { min: 0.7, max: 0.75 },
    small: { min: 0.98, max: 1.02 },
    medium: { min: 1.35, max: 1.45 },
    large: { min: 1.9, max: 2.05 },
  },
  placementModifiers: {
    "forearm-outer": { min: 1, max: 1.02 },
    ribs: { min: 1.18, max: 1.22 },
  },
  detailLevelModifiers: {
    simple: { min: 0.92, max: 0.98 },
    standard: { min: 1, max: 1 },
    detailed: { min: 1.22, max: 1.28 },
  },
  colorModeModifiers: {
    "black-only": { min: 1, max: 1 },
    "black-grey": { min: 1.08, max: 1.12 },
    "full-color": { min: 1.28, max: 1.34 },
  },
  addonFees: {
    coverUp: { min: 500, max: 1000 },
    customDesign: { min: 300, max: 800 },
  },
  minimumSessionPrice: 2500,
  sizeBaseRanges: {
    tiny: { min: 2200, max: 2300 },
    small: { min: 2950, max: 3050 },
    medium: { min: 4150, max: 4250 },
    large: { min: 5750, max: 5850 },
  },
  sizeTimeRanges: {
    tiny: { minHours: 0.5, maxHours: 1 },
    small: { minHours: 1, maxHours: 2 },
    medium: { minHours: 2, maxHours: 4 },
    large: { minHours: 4, maxHours: 6 },
  },
  placementMultipliers: {
    "forearm-outer": 1,
    ribs: 1.2,
  },
  intentMultipliers: {
    "custom-tattoo": 1,
    "design-in-mind": 1,
    "flash-design": 1,
    "discounted-design": 1,
    "not-sure": 1,
  },
};

function quote(input) {
  const config = buildNormalizedQuoteConfig(baseRules);
  return estimateNormalizedQuote(input, config);
}

test("hybrid pricing keeps baseline scenario centered around 12 cm medium black easy", () => {
  const result = quote({
    size: "small",
    sizeCm: 12,
    placement: "forearm-outer",
    detailLevel: "standard",
    colorMode: "black-only",
  });

  const center = (result.min + result.max) / 2;

  assert.ok(result.min >= 2800);
  assert.ok(result.max <= 3200);
  assert.equal(center, 3000);
  assert.ok(result.debug);
  assert.equal(result.debug.baseSizePrice, 3000);
  assert.deepEqual(result.debug.detailSurcharge, { min: 0, max: 0 });
  assert.deepEqual(result.debug.placementSurcharge, { min: 0, max: 0 });
  assert.deepEqual(result.debug.colorSurcharge, { min: 0, max: 0 });
  assert.equal(result.debug.validationAdjustment, 1);
});

test("hybrid pricing grows smoothly from simple small to larger hard scenarios", () => {
  const tinySimple = quote({
    size: "tiny",
    sizeCm: 8,
    placement: "forearm-outer",
    detailLevel: "simple",
    colorMode: "black-only",
  });
  const baseline = quote({
    size: "small",
    sizeCm: 12,
    placement: "forearm-outer",
    detailLevel: "standard",
    colorMode: "black-only",
  });
  const mediumHard = quote({
    size: "medium",
    sizeCm: 18,
    placement: "ribs",
    detailLevel: "detailed",
    colorMode: "black-only",
  });
  const largeColorHard = quote({
    size: "large",
    sizeCm: 25,
    placement: "ribs",
    detailLevel: "detailed",
    colorMode: "full-color",
  });

  assert.ok(tinySimple.min < baseline.min);
  assert.ok(baseline.min < mediumHard.min);
  assert.ok(mediumHard.min < largeColorHard.min);
  assert.ok(tinySimple.max < baseline.max);
  assert.ok(baseline.max < mediumHard.max);
  assert.ok(mediumHard.max < largeColorHard.max);

  const baselineCenter = (baseline.min + baseline.max) / 2;
  const mediumCenter = (mediumHard.min + mediumHard.max) / 2;
  const largeCenter = (largeColorHard.min + largeColorHard.max) / 2;

  assert.ok(mediumCenter / baselineCenter < 1.9);
  assert.ok(largeCenter / mediumCenter < 1.6);
});

test("validation adjustment remains safely clamped", () => {
  const config = buildNormalizedQuoteConfig({
    ...baseRules,
    calibrationExamples: {
      ...baseRules.calibrationExamples,
      globalScale: 1.5,
    },
  });

  assert.equal(config.validationAdjustment, 1.08);
});
