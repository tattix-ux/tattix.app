import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import {
  getIntentLabel,
  getPlacementDetailLocaleLabel,
  getPublicCopy,
  getSizeLabel,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type { ArtistProfile, SubmissionRequest } from "@/lib/types";
import { sanitizePhoneNumber } from "@/lib/utils";

function formatRawRange(minimum: number, maximum: number, currency: string) {
  return `${minimum} - ${maximum} ${currency}`;
}

export function buildSubmissionMessage(
  submission: SubmissionRequest,
  profile: ArtistProfile,
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
    locale === "tr" ? "Merhaba! Bir dövme hakkında konuşmak istiyorum." : "Hi! I want to discuss a tattoo.",
    "",
    `${labels.intent}: ${getIntentLabel(submission.intent, locale)}`,
  ];

  if (selectedDesignTitle) {
    lines.push(`${labels.selectedDesign}: ${selectedDesignTitle}`);
  }

  lines.push(
    `${labels.placement}: ${getPlacementDetailLocaleLabel(submission.bodyAreaDetail, locale)}`,
    `${labels.size}: ${sizeLabel}`,
    `${labels.approximateSize}: ${manualSize}`,
  );

  if (!selectedDesignTitle) {
    lines.push(`${labels.style}: ${selectedStyleLabel ?? getStyleLabel(submission.style, locale)}`);
  }

  if (submission.referenceImage) {
    lines.push(`${labels.referenceImage}: ${submission.referenceImage}`);
  }

  if (submission.referenceDescription?.trim()) {
    lines.push(`${labels.referenceDescription}: ${submission.referenceDescription.trim()}`);
  }

  lines.push(
    `${labels.notes}: ${submission.notes?.trim() ? submission.notes.trim() : labels.noNotes}`,
    `${labels.estimatedPriceShown}: ${formatRawRange(
      estimatedMin,
      estimatedMax,
      profile.currency,
    )}`,
  );

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, message: string) {
  return `https://wa.me/${sanitizePhoneNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
