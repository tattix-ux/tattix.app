import assert from "node:assert/strict";
import test from "node:test";

import {
  clamp,
  derivePricingProfile,
  enforceMonotonic,
  safeDivide,
  sanitizePricingCalibrationInputs,
  smoothRatio,
} from "../lib/pricing/pricing-profile.ts";

test("sanitizePricingCalibrationInputs falls back deterministically for invalid values", () => {
  const sanitized = sanitizePricingCalibrationInputs({
    minimumPrice: -100,
    roseMedium18cm: 0,
    roseMedium8cm: null,
    roseMedium25cm: undefined,
    roseLow18cm: "bad",
    roseHigh18cm: -20,
    roseColor18cm: "",
    daggerAnchor18cm: 2500,
  });

  assert.deepEqual(sanitized, {
    minimumPrice: 1,
    roseMedium8cm: 1,
    roseMedium18cm: 1,
    roseMedium25cm: 1,
    roseLow18cm: 1,
    roseHigh18cm: 1,
    roseColor18cm: 1,
    daggerAnchor18cm: 2500,
  });
});

test("derivePricingProfile creates a stable profile from sane inputs", () => {
  const { pricingProfile } = derivePricingProfile({
    minimumPrice: 2500,
    roseMedium8cm: 1800,
    roseMedium18cm: 3200,
    roseMedium25cm: 6200,
    roseLow18cm: 2800,
    roseHigh18cm: 4300,
    roseColor18cm: 3900,
    daggerAnchor18cm: 4500,
  });

  assert.equal(pricingProfile.basePrice, 2500);
  assert.equal(pricingProfile.size.medium, 1);
  assert.equal(pricingProfile.detail.medium, 1);
  assert.ok(pricingProfile.size.small >= 0.6 && pricingProfile.size.small <= 1);
  assert.ok(pricingProfile.size.large >= 1 && pricingProfile.size.large <= 2.5);
  assert.ok(pricingProfile.detail.low <= 1);
  assert.ok(pricingProfile.detail.high >= 1);
  assert.ok(pricingProfile.color.factor >= 1);
  assert.ok(pricingProfile.anchor.ratio >= 0.7);
});

test("derivePricingProfile fixes broken ordering without spikes", () => {
  const { pricingProfile } = derivePricingProfile({
    minimumPrice: 3000,
    roseMedium8cm: 4200,
    roseMedium18cm: 3000,
    roseMedium25cm: 2000,
    roseLow18cm: 3800,
    roseHigh18cm: 2600,
    roseColor18cm: 2800,
    daggerAnchor18cm: 3000,
  });

  assert.equal(pricingProfile.size.small, 1);
  assert.equal(pricingProfile.size.large, 1);
  assert.equal(pricingProfile.detail.low, 1);
  assert.equal(pricingProfile.detail.high, 1);
  assert.equal(pricingProfile.color.factor, 1);
});

test("helper functions stay deterministic", () => {
  assert.equal(clamp(12, 0, 5), 5);
  assert.equal(safeDivide(10, 0, 1), 1);
  assert.equal(smoothRatio(2, { center: 1, strength: 0.5 }), 1.5);
  assert.deepEqual(enforceMonotonic([0.8, 1, 0.9, 1.4]), [0.8, 1, 1, 1.4]);
});
