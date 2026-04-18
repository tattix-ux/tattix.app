import assert from "node:assert/strict";
import test from "node:test";

import { buildNormalizedQuoteConfig, estimateNormalizedQuote } from "../lib/pricing/normalized-engine.ts";
import { estimateFeaturedDesignPrice } from "../lib/pricing/featured-design-pricing.ts";
import {
  applyFinalControlFeedbackToPricingProfile,
  derivePricingProfile,
} from "../lib/pricing/pricing-profile.ts";

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

test("final control low-boundary feedback nudges small simple quotes without spiking the rest", () => {
  const { sanitizedInputs, pricingProfile } = derivePricingProfile({
    minimumPrice: 2500,
    roseMedium8cm: 1700,
    roseMedium18cm: 3200,
    roseMedium25cm: 5900,
    roseLow18cm: 2700,
    roseHigh18cm: 4300,
    roseColor18cm: 3900,
    daggerAnchor18cm: 4700,
  });

  const adjustedProfile = applyFinalControlFeedbackToPricingProfile(
    pricingProfile,
    { "text-low-boundary": "slightly-low" },
    { "text-low-boundary": "detail" },
  ).pricingProfile;

  const beforeConfig = buildNormalizedQuoteConfig({
    ...baseRules,
    calibrationExamples: {
      ...baseRules.calibrationExamples,
      pricingRawInputs: sanitizedInputs,
      pricingProfile,
    },
  });
  const afterConfig = buildNormalizedQuoteConfig({
    ...baseRules,
    calibrationExamples: {
      ...baseRules.calibrationExamples,
      pricingRawInputs: sanitizedInputs,
      pricingProfile: adjustedProfile,
    },
  });

  const before = estimateNormalizedQuote(
    {
      size: "tiny",
      sizeCm: 9,
      placement: "forearm-outer",
      detailLevel: "simple",
      colorMode: "black-only",
    },
    beforeConfig,
  );
  const after = estimateNormalizedQuote(
    {
      size: "tiny",
      sizeCm: 9,
      placement: "forearm-outer",
      detailLevel: "simple",
      colorMode: "black-only",
    },
    afterConfig,
  );

  assert.ok(after.max >= before.max);
  assert.ok(after.debug);
  assert.ok(before.debug);
  assert.ok(after.debug.detailSurcharge.min > before.debug.detailSurcharge.min);
  assert.ok(after.debug.detailSurcharge.max > before.debug.detailSurcharge.max);
});

test("style and color feedback adjust only their relevant probe outputs", () => {
  const { sanitizedInputs, pricingProfile } = derivePricingProfile({
    minimumPrice: 2500,
    roseMedium8cm: 1700,
    roseMedium18cm: 3200,
    roseMedium25cm: 5900,
    roseLow18cm: 2700,
    roseHigh18cm: 4300,
    roseColor18cm: 3900,
    daggerAnchor18cm: 4700,
  });

  const adjustedProfile = applyFinalControlFeedbackToPricingProfile(
    pricingProfile,
    {
      "colored-butterfly": "slightly-high",
      "realistic-eye": "slightly-low",
    },
    {
      "colored-butterfly": "color",
      "realistic-eye": "detail",
    },
  ).pricingProfile;

  const beforeConfig = buildNormalizedQuoteConfig({
    ...baseRules,
    calibrationExamples: {
      ...baseRules.calibrationExamples,
      pricingRawInputs: sanitizedInputs,
      pricingProfile,
    },
  });
  const afterConfig = buildNormalizedQuoteConfig({
    ...baseRules,
    calibrationExamples: {
      ...baseRules.calibrationExamples,
      pricingRawInputs: sanitizedInputs,
      pricingProfile: adjustedProfile,
    },
  });

  const butterflyBefore = estimateNormalizedQuote(
    {
      size: "medium",
      sizeCm: 18,
      placement: "forearm-outer",
      detailLevel: "standard",
      colorMode: "full-color",
    },
    beforeConfig,
  );
  const butterflyAfter = estimateNormalizedQuote(
    {
      size: "medium",
      sizeCm: 18,
      placement: "forearm-outer",
      detailLevel: "standard",
      colorMode: "full-color",
    },
    afterConfig,
  );
  const styleBefore = estimateNormalizedQuote(
    {
      size: "medium",
      sizeCm: 18,
      placement: "forearm-outer",
      detailLevel: "ultra",
      colorMode: "black-only",
    },
    beforeConfig,
  );
  const styleAfter = estimateNormalizedQuote(
    {
      size: "medium",
      sizeCm: 18,
      placement: "forearm-outer",
      detailLevel: "ultra",
      colorMode: "black-only",
    },
    afterConfig,
  );

  assert.ok(butterflyAfter.min < butterflyBefore.min);
  assert.ok(styleAfter.min > styleBefore.min);
});

test("featured design keeps the artist-entered reference range at its reference size and easy placement", () => {
  const quote = estimateFeaturedDesignPrice(
    {
      artistSlug: "test-artist",
      intent: "flash-design",
      selectedDesignId: "design-standard",
      bodyAreaGroup: "arms",
      bodyAreaDetail: "forearm-outer",
      sizeMode: "approximate",
      approximateSizeCm: 10,
      sizeCategory: "tiny",
      style: "blackwork",
    },
    baseRules,
    {
      id: "design-standard",
      artistId: "test-artist",
      category: "flash-designs",
      title: "Minimal Dagger",
      shortDescription: "",
      imageUrl: null,
      imagePath: null,
      priceNote: "10 cm",
      referenceDetailLevel: "standard",
      referencePriceMin: 4000,
      referencePriceMax: 5000,
      active: true,
      sortOrder: 1,
    },
  );

  assert.deepEqual(quote, { min: 4000, max: 5000 });
});

test("featured design uses its reference detail level to scale size changes consistently with the core engine", () => {
  const featuredDesigns = [
    {
      id: "design-simple",
      artistId: "test-artist",
      category: "flash-designs",
      title: "Simple design",
      shortDescription: "",
      imageUrl: null,
      imagePath: null,
      priceNote: "10 cm",
      referenceDetailLevel: "simple",
      referencePriceMin: 4000,
      referencePriceMax: 5000,
      active: true,
      sortOrder: 1,
    },
    {
      id: "design-detailed",
      artistId: "test-artist",
      category: "flash-designs",
      title: "Detailed design",
      shortDescription: "",
      imageUrl: null,
      imagePath: null,
      priceNote: "10 cm",
      referenceDetailLevel: "detailed",
      referencePriceMin: 4000,
      referencePriceMax: 5000,
      active: true,
      sortOrder: 2,
    },
  ];

  const simpleQuote = estimateFeaturedDesignPrice(
    {
      artistSlug: "test-artist",
      intent: "flash-design",
      selectedDesignId: "design-simple",
      bodyAreaGroup: "arms",
      bodyAreaDetail: "forearm-outer",
      sizeMode: "approximate",
      approximateSizeCm: 18,
      sizeCategory: "medium",
      style: "blackwork",
    },
    baseRules,
    featuredDesigns[0],
  );
  const detailedQuote = estimateFeaturedDesignPrice(
    {
      artistSlug: "test-artist",
      intent: "flash-design",
      selectedDesignId: "design-detailed",
      bodyAreaGroup: "arms",
      bodyAreaDetail: "forearm-outer",
      sizeMode: "approximate",
      approximateSizeCm: 18,
      sizeCategory: "medium",
      style: "blackwork",
    },
    baseRules,
    featuredDesigns[1],
  );

  assert.ok(detailedQuote.min > simpleQuote.min);
  assert.ok(detailedQuote.max > simpleQuote.max);
});
