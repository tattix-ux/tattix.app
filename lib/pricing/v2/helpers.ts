import type { ColorImpactPreferenceValue, ColorModeValue, EstimateMode } from "@/lib/types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundToNearestFifty(value: number) {
  return Math.round(value / 50) * 50;
}

export function formatEstimateLabel(
  minimum: number,
  maximum: number | null,
  mode: EstimateMode,
  locale: "tr" | "en",
  currency = "TRY",
) {
  const formatter = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (mode === "starting_from" || maximum === null) {
    return `${formatter.format(minimum)}+`;
  }

  return `${formatter.format(minimum)} – ${formatter.format(maximum)}`;
}

export function midpoint(minimum: number, maximum: number) {
  return (minimum + maximum) / 2;
}

export function safeRatio(numerator: number, denominator: number, fallback = 1) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return fallback;
  }

  return numerator / denominator;
}

export function dampedPowerScale(
  ratio: number,
  exponent: number,
  min = 0.72,
  max = 1.6,
) {
  return clamp(Math.pow(Math.max(ratio, 0.2), exponent), min, max);
}

export function colorRank(colorMode: ColorModeValue) {
  switch (colorMode) {
    case "black-only":
      return 0;
    case "black-grey":
      return 1;
    case "full-color":
      return 2;
  }
}

export function getColorImpactFactor(
  fromColorMode: ColorModeValue,
  toColorMode: ColorModeValue,
  preference: ColorImpactPreferenceValue,
) {
  const delta = colorRank(toColorMode) - colorRank(fromColorMode);

  if (delta === 0) {
    return 1;
  }

  const positiveFactors =
    preference === "low"
      ? [1.04, 1.08]
      : preference === "medium"
        ? [1.08, 1.16]
        : [1.12, 1.24];
  const negativeFactors =
    preference === "low"
      ? [0.98, 0.95]
      : preference === "medium"
        ? [0.96, 0.92]
        : [0.94, 0.88];

  if (delta > 0) {
    return positiveFactors[Math.min(delta - 1, positiveFactors.length - 1)] ?? positiveFactors[0];
  }

  return negativeFactors[Math.min(Math.abs(delta) - 1, negativeFactors.length - 1)] ?? negativeFactors[0];
}
