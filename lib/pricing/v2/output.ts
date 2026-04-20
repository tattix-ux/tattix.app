import type { PublicLocale } from "@/lib/i18n/public";
import type { EstimateMode, PricingSourceValue, RequestTypeValue, WorkStyleValue } from "@/lib/types";
import { formatEstimateLabel } from "./helpers";

export function buildEstimateSummaryText(
  mode: EstimateMode,
  source: PricingSourceValue,
  locale: PublicLocale,
) {
  if (locale === "tr") {
    if (mode === "range") {
      return "Seçtiklerine göre çoğu durumda başlangıç seviyesi bu aralıkta olur.";
    }

    if (mode === "soft_range") {
      return "Bu tür işler seçilen boyut, bölge ve içeriğe göre genelde bu bantta değerlendirilir.";
    }

    return "Bu tür işler genelde bu seviyeden başlayan bir değerlendirme gerektirir. Net fiyat, tasarım ve detaylar netleştikten sonra belirlenir.";
  }

  if (mode === "range") {
    return "Based on what you selected, the starting level usually falls within this range.";
  }

  if (mode === "soft_range") {
    return "Requests like this are usually evaluated within this band depending on size, placement, and content.";
  }

  return "Requests like this usually need an evaluation that starts from this level. The final price is set after the design and details are clarified.";
}

export function buildDisplayEstimateLabel(
  minimum: number,
  maximum: number | null,
  mode: EstimateMode,
  locale: PublicLocale,
  currency = "TRY",
) {
  return formatEstimateLabel(minimum, maximum, mode, locale, currency);
}

export function getRequestTypeLabel(
  requestType: RequestTypeValue,
  locale: PublicLocale,
) {
  if (locale === "tr") {
    switch (requestType) {
      case "text":
        return "Yazı";
      case "mini_simple":
        return "Küçük basit dövme";
      case "single_object":
        return "Tek figür / tek obje";
      case "multi_element":
        return "Birden fazla öğeli tasarım";
      case "cover_up":
        return "Kapatma / eski dövme üstü";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (requestType) {
    case "text":
      return "Text";
    case "mini_simple":
      return "Small simple tattoo";
    case "single_object":
      return "Single figure / single object";
    case "multi_element":
      return "Multi-element design";
    case "cover_up":
      return "Cover-up";
    case "unsure":
      return "Not sure";
  }
}

export function getWorkStyleLabel(
  workStyle: WorkStyleValue,
  locale: PublicLocale,
) {
  if (locale === "tr") {
    switch (workStyle) {
      case "clean_line":
        return "Sade çizgisel";
      case "shaded_detailed":
        return "Daha işçilikli / gölgeli";
      case "precision_symmetric":
        return "Hassas / simetrik";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (workStyle) {
    case "clean_line":
      return "Clean line";
    case "shaded_detailed":
      return "More worked / shaded";
    case "precision_symmetric":
      return "Precise / symmetric";
    case "unsure":
      return "Not sure";
  }
}
