import {
  getPlacementDetailLocaleLabel,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public";
import {
  getAreaScopeLabel,
  getLayoutStyleLabel,
  getLargeAreaCoverageLabel,
  getWideAreaTargetLabel,
  getWorkStyleLabel,
} from "@/lib/pricing/v2/output";
import type { PricingSourceValue, RequestTypeValue, SubmissionRequest } from "@/lib/types";
import { sanitizePhoneNumber } from "@/lib/utils";

function getReferenceUploadLine(locale: PublicLocale, uploaded: boolean) {
  if (locale === "tr") {
    return uploaded ? "Evet, görsel yüklendi" : "Hayır";
  }

  return uploaded ? "Yes, an image was uploaded" : "No";
}

function formatPreferredTiming(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  locale: PublicLocale,
) {
  const formatDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  if (!startDate && !endDate) {
    return null;
  }

  if (startDate && endDate) {
    return locale === "tr"
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : `${formatDate(startDate)} to ${formatDate(endDate)}`;
  }

  return startDate ? formatDate(startDate) : endDate ? formatDate(endDate) : null;
}

function isSafeHttpUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value);
}

function getGenderLabel(
  value: SubmissionRequest["gender"],
  locale: PublicLocale,
) {
  if (!value) {
    return null;
  }

  if (locale === "tr") {
    if (value === "female") return "Kadın";
    if (value === "male") return "Erkek";
    return "Belirtmek istemiyorum";
  }

  if (value === "female") return "Female";
  if (value === "male") return "Male";
  return "Prefer not to say";
}

function getColorLabel(
  value: SubmissionRequest["colorMode"],
  locale: PublicLocale,
) {
  if (!value) {
    return null;
  }

  if (locale === "tr") {
    if (value === "black-only") return "Sadece siyah";
    if (value === "black-grey") return "Siyah-gri";
    return "Renkli";
  }

  if (value === "black-only") return "Black only";
  if (value === "black-grey") return "Black and grey";
  return "Color";
}

function getCoverUpLabel(value: SubmissionRequest["coverUp"], locale: PublicLocale) {
  if (value === null || value === undefined) {
    return null;
  }

  if (locale === "tr") {
    return value ? "Evet" : "Hayır";
  }

  return value ? "Yes" : "No";
}

function getBooleanLabel(value: boolean | null | undefined, locale: PublicLocale) {
  if (value === null || value === undefined) {
    return null;
  }

  return locale === "tr" ? (value ? "Evet" : "Hayır") : value ? "Yes" : "No";
}

export function buildSubmissionMessage(
  submission: SubmissionRequest,
  options: {
    locale: PublicLocale;
    pricingSource: PricingSourceValue;
    requestTypeLabel?: string | null;
    selectedDesignTitle?: string | null;
    displayEstimateLabel?: string | null;
  },
) {
  const { locale, pricingSource, requestTypeLabel, selectedDesignTitle, displayEstimateLabel } = options;
  const copy = getPublicCopy(locale);
  const labels = copy.summaryLabels;
  const displayedSize =
    typeof submission.selectedSizeCm === "number" && Number.isFinite(submission.selectedSizeCm)
      ? `${Math.round(submission.selectedSizeCm)} cm`
      : null;
  const areaScopeLine =
    pricingSource === "custom_request" && submission.areaScope
      ? `${locale === "tr" ? "Alan" : "Area"}: ${getAreaScopeLabel(submission.areaScope, locale)}`
      : null;
  const requestTypeLine =
    pricingSource === "featured_design"
      ? selectedDesignTitle
        ? `${labels.selectedDesign}: ${selectedDesignTitle}`
        : null
      : requestTypeLabel
        ? `${labels.intent}: ${requestTypeLabel}`
        : null;
  const lines = [
    locale === "tr"
      ? "Merhaba, dövme talebim için bilgi almak istiyorum."
      : "Hi! I want to discuss a tattoo.",
    "",
    requestTypeLine,
    areaScopeLine,
  ];

  lines.push(
    `${labels.placement}: ${
      submission.wideAreaTarget
        ? getWideAreaTargetLabel(submission.wideAreaTarget, locale)
        : getPlacementDetailLocaleLabel(submission.bodyAreaDetail, locale)
    }`,
  );

  if (submission.areaScope !== "wide_area" && displayedSize) {
    lines.push(`${labels.size}: ${displayedSize}`);
  }

  if (submission.largeAreaCoverage) {
    lines.push(
      `${locale === "tr" ? "Kaplayacağı alan" : "Coverage"}: ${getLargeAreaCoverageLabel(submission.largeAreaCoverage, locale)}`,
    );
  }

  const colorLabel =
    pricingSource === "custom_request" ? getColorLabel(submission.colorMode, locale) : null;
  if (colorLabel) {
    lines.push(`${labels.color}: ${colorLabel}`);
  }

  if (pricingSource === "custom_request" && submission.workStyle) {
    lines.push(
      `${locale === "tr" ? "Detay seviyesi" : "Detail level"}: ${getWorkStyleLabel(submission.workStyle, locale, submission.realismLevel)}`,
    );
  }

  if (pricingSource === "custom_request" && submission.layoutStyle) {
    lines.push(
      `${locale === "tr" ? "Yerleşim tarzı" : "Placement style"}: ${getLayoutStyleLabel(submission.layoutStyle, locale)}`,
    );
  }

  const coverUpLabel = getCoverUpLabel(submission.coverUp, locale);
  const shouldShowCoverUp =
    submission.coverUp === true ||
    submission.areaScope === "large_single_area" ||
    submission.areaScope === "wide_area";
  if (coverUpLabel && shouldShowCoverUp) {
    lines.push(`${locale === "tr" ? "Kapatma durumu" : "Cover-up"}: ${coverUpLabel}`);
  }

  if (submission.referenceImage) {
    lines.push(`${labels.referenceImage}: ${getReferenceUploadLine(locale, true)}`);
    if (isSafeHttpUrl(submission.referenceImage)) {
      lines.push(`${labels.referenceImageUrl}: ${submission.referenceImage}`);
    }
  }

  const combinedNote = [submission.referenceDescription?.trim(), submission.notes?.trim()]
    .filter(Boolean)
    .join(" | ");

  if (submission.city?.trim()) {
    lines.push(`${labels.city}: ${submission.city.trim()}`);
  }

  const allergyLabel = getBooleanLabel(submission.hasAllergy, locale);
  if (allergyLabel) {
    lines.push(`${locale === "tr" ? "Alerji" : "Allergy"}: ${allergyLabel}`);
  }

  const chronicConditionLabel = getBooleanLabel(submission.hasChronicCondition, locale);
  if (chronicConditionLabel) {
    lines.push(`${locale === "tr" ? "Kronik rahatsızlık" : "Chronic condition"}: ${chronicConditionLabel}`);
  }

  if (submission.hasChronicCondition && submission.chronicConditionDetails?.trim()) {
    lines.push(
      `${locale === "tr" ? "Rahatsızlık detayı" : "Condition details"}: ${submission.chronicConditionDetails.trim()}`,
    );
  }

  const preferredTiming = formatPreferredTiming(
    submission.preferredStartDate,
    submission.preferredEndDate,
    locale,
  );

  if (preferredTiming) {
    lines.push(`${locale === "tr" ? "Tarih" : labels.preferredTiming}: ${preferredTiming}`);
  }

  lines.push(`${locale === "tr" ? "Not" : labels.notes}: ${combinedNote || labels.noNotes}`);

  if (submission.gender) {
    lines.push(`${labels.gender}: ${getGenderLabel(submission.gender, locale)}`);
  }

  if (submission.ageRange) {
    lines.push(`${labels.ageRange}: ${submission.ageRange}`);
  }

  if (displayEstimateLabel) {
    lines.push("", `${labels.estimatedPriceShown}: ${displayEstimateLabel}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, message: string) {
  return `https://wa.me/${sanitizePhoneNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
