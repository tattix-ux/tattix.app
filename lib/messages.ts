import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import {
  getIntentLabel,
  getPlacementDetailLocaleLabel,
  getPublicCopy,
  getSizeLabel,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type { SubmissionRequest } from "@/lib/types";
import { sanitizePhoneNumber } from "@/lib/utils";

function formatCurrencyRange(minimum: number, maximum: number, locale: PublicLocale) {
  const formatter = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US");
  const prefix = locale === "tr" ? "₺" : "TRY ";

  return `${prefix}${formatter.format(minimum)} – ${prefix}${formatter.format(maximum)}`;
}

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

export function buildSubmissionMessage(
  submission: SubmissionRequest,
  _profile: { currency?: string },
  estimatedMin: number,
  estimatedMax: number,
  locale: PublicLocale = "en",
  selectedDesignTitle?: string | null,
  selectedStyleLabel?: string | null,
) {
  const copy = getPublicCopy(locale);
  const labels = copy.summaryLabels;
  const sizeLabel = getSizeLabel(submission.sizeCategory, locale);
  const manualSize = formatApproximateSizeLabel(submission) ?? sizeLabel;
  const lines = [
    locale === "tr"
      ? "Merhaba, dövme talebim için bilgi almak istiyorum."
      : "Hi! I want to discuss a tattoo.",
    "",
    `${labels.intent}: ${getIntentLabel(submission.intent, locale)}`,
  ];

  if (selectedDesignTitle) {
    lines.push(`${labels.selectedDesign}: ${selectedDesignTitle}`);
  }

  lines.push(
    `${labels.placement}: ${getPlacementDetailLocaleLabel(submission.bodyAreaDetail, locale)}`,
    `${labels.size}: ${sizeLabel}${manualSize && manualSize !== sizeLabel ? ` (${manualSize})` : ""}`,
  );

  if (!selectedDesignTitle) {
    lines.push(`${labels.style}: ${selectedStyleLabel ?? getStyleLabel(submission.style, locale)}`);
  }

  if (submission.referenceImage) {
    lines.push(`${labels.referenceImage}: ${getReferenceUploadLine(locale, true)}`);
    if (isSafeHttpUrl(submission.referenceImage)) {
      lines.push(`${labels.referenceImageUrl}: ${submission.referenceImage}`);
    }
  }

  if (submission.referenceDescription?.trim()) {
    lines.push(`${labels.referenceDescription}: ${submission.referenceDescription.trim()}`);
  }

  if (submission.city?.trim()) {
    lines.push(`${labels.city}: ${submission.city.trim()}`);
  }

  const preferredTiming = formatPreferredTiming(
    submission.preferredStartDate,
    submission.preferredEndDate,
    locale,
  );

  if (preferredTiming) {
    lines.push(`${locale === "tr" ? "Tarih" : labels.preferredTiming}: ${preferredTiming}`);
  }

  lines.push(`${locale === "tr" ? "Not" : labels.notes}: ${submission.notes?.trim() ? submission.notes.trim() : labels.noNotes}`);

  if (submission.gender) {
    lines.push(`${labels.gender}: ${getGenderLabel(submission.gender, locale)}`);
  }

  if (submission.ageRange) {
    lines.push(`${labels.ageRange}: ${submission.ageRange}`);
  }

  lines.push("", `${labels.estimatedPriceShown}: ${formatCurrencyRange(estimatedMin, estimatedMax, locale)}`);

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, message: string) {
  return `https://wa.me/${sanitizePhoneNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
