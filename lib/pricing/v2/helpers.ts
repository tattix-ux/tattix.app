import type { ColorImpactPreferenceValue, ColorModeValue, EstimateMode } from "@/lib/types";

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function roundToNearestFifty(value: number) {
  return Math.round(value / 50) * 50;
}

function getFriendlyPriceStep(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 10000) {
    return 1000;
  }

  if (absolute >= 5000) {
    return 500;
  }

  if (absolute >= 2000) {
    return 250;
  }

  if (absolute >= 1000) {
    return 100;
  }

  return 50;
}

export function roundToFriendlyPrice(
  value: number,
  direction: "nearest" | "down" | "up" = "nearest",
) {
  const safeValue = Math.max(0, value);
  const step = getFriendlyPriceStep(safeValue);

  if (direction === "down") {
    return Math.floor(safeValue / step) * step;
  }

  if (direction === "up") {
    return Math.ceil(safeValue / step) * step;
  }

  return Math.round(safeValue / step) * step;
}

export function formatCurrencyValue(
  value: number,
  locale: "tr" | "en",
  currency = "TRY",
) {
  const numberFormatter = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    maximumFractionDigits: 0,
  });

  if (currency === "TRY") {
    return locale === "tr"
      ? `₺${numberFormatter.format(value)}`
      : `TRY ${numberFormatter.format(value)}`;
  }

  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatEstimateLabel(
  minimum: number,
  maximum: number | null,
  mode: EstimateMode,
  locale: "tr" | "en",
  currency = "TRY",
) {
  const roundedMinimum = roundToFriendlyPrice(
    minimum,
    mode === "starting_from" ? "up" : "down",
  );

  if (mode === "starting_from" || maximum === null) {
    return `${formatCurrencyValue(roundedMinimum, locale, currency)}+`;
  }

  const roundedMaximum = Math.max(
    roundedMinimum,
    roundToFriendlyPrice(maximum, "up"),
  );

  return `${formatCurrencyValue(roundedMinimum, locale, currency)} – ${formatCurrencyValue(roundedMaximum, locale, currency)}`;
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
