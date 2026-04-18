import assert from "node:assert/strict";
import test from "node:test";

import {
  createRandomizedDetailCalibrationOrder,
  deriveDetailCalibrationProfile,
  DETAIL_CALIBRATION_SAMPLE_IDS,
  DETAIL_CALIBRATION_SAMPLES,
  resolvePersonalizedDetailWeight,
} from "../lib/pricing/detail-calibration.ts";

const canonicalSelections = DETAIL_CALIBRATION_SAMPLE_IDS.map((sampleId) => {
  if (sampleId.endsWith("low")) {
    return { sampleId, selectedDetailLevel: "low" };
  }

  if (sampleId.endsWith("medium")) {
    return { sampleId, selectedDetailLevel: "medium" };
  }

  return { sampleId, selectedDetailLevel: "high" };
});

test("detail calibration keeps zero bias when artist matches canonical detail levels", () => {
  const profile = deriveDetailCalibrationProfile({
    sampleOrder: [...DETAIL_CALIBRATION_SAMPLE_IDS],
    responses: canonicalSelections,
  });

  assert.equal(profile.detailBiasScore, 0);
  assert.deepEqual(profile.familyBiasScores, {
    floral: 0,
    geometric: 0,
    snake: 0,
  });
  assert.deepEqual(profile.normalizedDetailMapping, {
    low: 1,
    medium: 1,
    high: 1,
  });
});

test("detail calibration produces positive bias when every sample is marked one level denser", () => {
  const responses = DETAIL_CALIBRATION_SAMPLE_IDS.map((sampleId) => ({
    sampleId,
    selectedDetailLevel: sampleId.endsWith("low")
      ? "medium"
      : sampleId.endsWith("medium")
        ? "high"
        : "high",
  }));

  const profile = deriveDetailCalibrationProfile({
    sampleOrder: [...DETAIL_CALIBRATION_SAMPLE_IDS],
    responses,
  });

  assert.equal(profile.detailBiasScore, 0.667);
  assert.ok(profile.normalizedDetailMapping.high > 1);
  assert.ok(profile.normalizedDetailMapping.low < 1);
  assert.ok(resolvePersonalizedDetailWeight(profile, "detailed") > 1);
  assert.ok(resolvePersonalizedDetailWeight(profile, "simple") < 1);
  assert.ok(resolvePersonalizedDetailWeight(profile, "ultra") > resolvePersonalizedDetailWeight(profile, "detailed"));
});

test("detail calibration shuffle returns the same ids without duplicates", () => {
  const order = createRandomizedDetailCalibrationOrder(() => 0.42);

  assert.equal(order.length, DETAIL_CALIBRATION_SAMPLE_IDS.length);
  assert.equal(new Set(order).size, DETAIL_CALIBRATION_SAMPLE_IDS.length);
  assert.deepEqual([...order].sort(), [...DETAIL_CALIBRATION_SAMPLE_IDS].sort());

  const sampleMap = new Map(DETAIL_CALIBRATION_SAMPLES.map((sample) => [sample.id, sample]));
  for (let index = 1; index < order.length; index += 1) {
    const previous = sampleMap.get(order[index - 1]);
    const current = sampleMap.get(order[index]);

    assert.ok(previous);
    assert.ok(current);
    assert.notEqual(previous.family, current.family);
  }
});
