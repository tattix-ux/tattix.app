import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import {
  getIntentLabel,
  getPlacementDetailLocaleLabel,
  getSizeLabel,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type {
  ArtistPricingRules,
  ArtistStyleOption,
  PriceRange,
  SubmissionRequest,
} from "@/lib/types";
import { roundToNearestFifty } from "@/lib/utils";

type PricingContext = {
  pricingRules: ArtistPricingRules;
  styleOptions: ArtistStyleOption[];
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

export function estimateTattooPrice(
  submission: SubmissionRequest,
  context: PricingContext,
) {
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
  const styleLabel = styleLabelOverride ?? getStyleLabel(submission.style, locale);
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
      submission.selectedDesignId ? "hazır tasarım seçildi" : `${styleLabel} tarzında`,
      `${intentLabel.toLocaleLowerCase("tr-TR")} planlandı`,
      manualSize ? `yaklaşık ${manualSize}` : `${sizeLabel.toLocaleLowerCase("tr-TR")} ölçekte`,
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
    submission.referenceImage ? "reference image uploaded" : null,
    preferredTiming ? `preferred timing: ${preferredTiming}` : null,
  ].filter(Boolean);

  return `${segments.join(", ")}.`;
}
