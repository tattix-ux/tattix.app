import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import {
  getIntentLabel,
  getPlacementDetailLocaleLabel,
  getSizeLabel,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type {
  ArtistFeaturedDesign,
  ArtistPricingRules,
  ArtistStyleOption,
  PriceRange,
  SubmissionRequest,
} from "@/lib/types";
import {
  buildNormalizedQuoteConfig,
  buildNormalizedQuoteInput,
  estimateNormalizedQuote,
} from "@/lib/pricing/normalized-engine";
import { roundToNearestFifty } from "@/lib/utils";

type PricingContext = {
  pricingRules: ArtistPricingRules;
  styleOptions: ArtistStyleOption[];
  featuredDesigns?: ArtistFeaturedDesign[];
};

function resolveStyleMultiplier(
  selectedStyle: SubmissionRequest["style"],
  options: ArtistStyleOption[],
) {
  return options.find((style) => style.styleKey === selectedStyle)?.multiplier ?? 1;
}

function resolvePlacementMultiplier(
  detail: SubmissionRequest["bodyAreaDetail"],
  rules: ArtistPricingRules,
) {
  return rules.placementMultipliers[detail] ?? 1;
}

function resolveIntentMultiplier(
  intent: SubmissionRequest["intent"],
  rules: ArtistPricingRules,
) {
  return rules.intentMultipliers[intent] ?? 1;
}

function applyMultiplier(range: PriceRange, multiplier: number, minimumSessionPrice: number) {
  const min = Math.max(roundToNearestFifty(range.min * multiplier), minimumSessionPrice);
  const max = Math.max(roundToNearestFifty(range.max * multiplier), min);
  return { min, max };
}

function formatPreferredTiming(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  locale: PublicLocale,
) {
  if (!startDate && !endDate) {
    return null;
  }

  if (startDate && endDate) {
    return locale === "tr" ? `${startDate} - ${endDate}` : `${startDate} to ${endDate}`;
  }

  return startDate ?? endDate ?? null;
}

function parseReferenceSizeCm(rawValue: string | null | undefined) {
  if (!rawValue) {
    return null;
  }

  const match = rawValue.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function scaleRange(range: PriceRange, multiplier: number) {
  return {
    min: range.min * multiplier,
    max: range.max * multiplier,
  };
}

function getPlacementSurchargeRange(
  placementDetail: SubmissionRequest["bodyAreaDetail"],
  rules: ArtistPricingRules,
) {
  const calibration = rules.calibrationExamples.placementDifficulty;
  const placementMidpoint = midpoint(rules.placementModifiers[placementDetail]);
  const easy = calibration?.easy ?? midpoint(rules.placementModifiers["forearm-outer"]) ?? rules.anchorPrice;
  const medium = calibration?.medium ?? easy;
  const hard = calibration?.hard ?? easy;

  if (placementDetail === "placement-not-sure") {
    const premium = Math.max(0, medium - easy);
    return { min: premium * 0.9, max: premium * 1.1 };
  }

  const hardPlacement = Number.isFinite(placementMidpoint) ? Number(placementMidpoint) >= 1.12 : false;
  const premium = Math.max(0, (hardPlacement ? hard : easy) - easy);
  return {
    min: premium * 0.9,
    max: premium * 1.1,
  };
}

function midpoint(range: PriceRange | undefined) {
  if (!range) {
    return null;
  }

  return (range.min + range.max) / 2;
}

function estimateFeaturedDesignPrice(
  submission: SubmissionRequest,
  context: PricingContext,
) {
  const selectedDesign = context.featuredDesigns?.find((design) => design.id === submission.selectedDesignId);

  if (!selectedDesign || !selectedDesign.referencePriceMin || !selectedDesign.referencePriceMax) {
    return null;
  }

  const config = buildNormalizedQuoteConfig(context.pricingRules);
  const requestSizeCm = buildNormalizedQuoteInput(submission).sizeCm;
  const referenceSizeCm = parseReferenceSizeCm(selectedDesign.priceNote) ?? 12;
  const requestCurve = config.sizeCurvePoints
    ? interpolateSizePrice(config.sizeCurvePoints, requestSizeCm)
    : null;
  const referenceCurve = config.sizeCurvePoints
    ? interpolateSizePrice(config.sizeCurvePoints, referenceSizeCm)
    : null;

  const sizeMultiplier =
    requestCurve && referenceCurve && referenceCurve > 0 ? requestCurve / referenceCurve : 1;

  const baseRange = scaleRange(
    {
      min: selectedDesign.referencePriceMin,
      max: selectedDesign.referencePriceMax,
    },
    sizeMultiplier,
  );
  const placementSurcharge = getPlacementSurchargeRange(
    submission.bodyAreaDetail,
    context.pricingRules,
  );
  const minimumCharge =
    context.pricingRules.minimumCharge || context.pricingRules.minimumSessionPrice || 0;

  const min = Math.max(roundToNearestFifty(baseRange.min + placementSurcharge.min), minimumCharge);
  const max = Math.max(roundToNearestFifty(baseRange.max + placementSurcharge.max), min);

  return { min, max };
}

function interpolateSizePrice(
  points: Record<"8" | "12" | "18" | "25", number>,
  sizeCm: number,
) {
  const ordered = [
    { cm: 8, value: points["8"] },
    { cm: 12, value: points["12"] },
    { cm: 18, value: points["18"] },
    { cm: 25, value: points["25"] },
  ];
  const clampedCm = Math.max(8, Math.min(25, sizeCm));
  let left = ordered[0];
  let right = ordered[ordered.length - 1];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    if (clampedCm >= ordered[index].cm && clampedCm <= ordered[index + 1].cm) {
      left = ordered[index];
      right = ordered[index + 1];
      break;
    }
  }

  const span = Math.max(1, right.cm - left.cm);
  const mix = (clampedCm - left.cm) / span;
  return left.value + (right.value - left.value) * mix;
}

export function estimateTattooPrice(
  submission: SubmissionRequest,
  context: PricingContext,
) {
  const featuredDesignQuote = submission.selectedDesignId
    ? estimateFeaturedDesignPrice(submission, context)
    : null;

  if (featuredDesignQuote) {
    return featuredDesignQuote;
  }

  try {
    const normalizedConfig = buildNormalizedQuoteConfig(context.pricingRules);
    const normalizedInput = buildNormalizedQuoteInput(submission);
    const normalizedQuote = estimateNormalizedQuote(normalizedInput, normalizedConfig);

    if (
      Number.isFinite(normalizedQuote.min) &&
      Number.isFinite(normalizedQuote.max) &&
      normalizedQuote.min > 0 &&
      normalizedQuote.max >= normalizedQuote.min
    ) {
      return normalizedQuote;
    }
  } catch {
    // Keep the legacy multiplier path as a narrow fallback while calibration data settles.
  }

  const baseRange = context.pricingRules.sizeBaseRanges[submission.sizeCategory];
  const styleMultiplier = resolveStyleMultiplier(submission.style, context.styleOptions);
  const placementMultiplier = resolvePlacementMultiplier(
    submission.bodyAreaDetail,
    context.pricingRules,
  );
  const intentMultiplier = resolveIntentMultiplier(
    submission.intent,
    context.pricingRules,
  );
  const totalMultiplier = styleMultiplier * placementMultiplier * intentMultiplier;

  return applyMultiplier(
    baseRange,
    totalMultiplier,
    context.pricingRules.minimumSessionPrice,
  );
}

export function buildEstimateSummary(
  submission: SubmissionRequest,
  locale: PublicLocale = "en",
  styleLabelOverride?: string | null,
) {
  const intentLabel = getIntentLabel(submission.intent, locale);
  const sizeLabel = getSizeLabel(submission.sizeCategory, locale);
  const localizedStyleLabel = getStyleLabel(submission.style, locale);
  const styleLabel =
    locale === "tr" && styleLabelOverride && styleLabelOverride !== submission.style
      ? localizedStyleLabel
      : styleLabelOverride ?? localizedStyleLabel;
  const placementLabel = getPlacementDetailLocaleLabel(submission.bodyAreaDetail, locale);
  const manualSize = formatApproximateSizeLabel(submission);
  const preferredTiming = formatPreferredTiming(
    submission.preferredStartDate,
    submission.preferredEndDate,
    locale,
  );

  if (locale === "tr") {
    const segments = [
      `${placementLabel} için`,
      submission.selectedDesignId ? "hazır tasarım seçildi" : `${styleLabel} stilinde`,
      `${intentLabel.toLocaleLowerCase("tr-TR")} planlandı`,
      manualSize ? `yaklaşık ${manualSize}` : `${sizeLabel.toLocaleLowerCase("tr-TR")} ölçekte`,
      submission.city?.trim() ? `şehir: ${submission.city.trim()}` : null,
      submission.referenceImage ? "referans görsel paylaşıldı" : null,
      preferredTiming ? `tercih edilen zaman: ${preferredTiming}` : null,
    ].filter(Boolean);

    return `${segments.join(", ")}.`;
  }

  const segments = [
    `${placementLabel} placement`,
    submission.selectedDesignId ? "ready-made design selected" : `${styleLabel} style`,
    intentLabel,
    manualSize ? `around ${manualSize}` : `${sizeLabel.toLocaleLowerCase("en-US")} size`,
    submission.city?.trim() ? `city: ${submission.city.trim()}` : null,
    submission.referenceImage ? "reference image uploaded" : null,
    preferredTiming ? `preferred timing: ${preferredTiming}` : null,
  ].filter(Boolean);

  return `${segments.join(", ")}.`;
}
