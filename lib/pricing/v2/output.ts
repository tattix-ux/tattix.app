import type { PublicLocale } from "@/lib/i18n/public";
import type { EstimateMode, PricingSourceValue, RequestTypeValue } from "@/lib/types";
import { formatEstimateLabel } from "./helpers";

export function buildEstimateSummaryText(
  mode: EstimateMode,
  source: PricingSourceValue,
  locale: PublicLocale,
) {
  if (locale === "tr") {
    if (source === "featured_design") {
      return mode === "starting_from"
        ? "Bu tasarım için başlangıç seviyesi budur. Özel bir değişiklik düşünüyorsan bunu dövmeciyle görüşebilirsin."
        : "Bu tasarım için başlangıç tahmini budur. Özel bir değişiklik düşünüyorsan bunu dövmeciyle görüşebilirsin.";
    }

    if (mode === "range") {
      return "Seçtiğin bilgilere göre yaklaşık başlangıç fiyatı budur. Net fiyat daha sonra değişebilir.";
    }

    if (mode === "soft_range") {
      return "Bu tür işler seçilen boyut, bölge ve içeriğe göre genelde bu bantta değerlendirilir.";
    }

    return "Bu tür işler genelde bu seviyeden başlayan bir değerlendirme gerektirir. Net fiyat dövmeciyle görüşüldükten sonra belirlenir.";
  }

  if (source === "featured_design") {
    return mode === "starting_from"
      ? "This is the usual starting level for this design. If you want a custom change, you can discuss it with the artist."
      : "This is the usual starting estimate for this design. If you want a custom change, you can discuss it with the artist.";
  }

  if (mode === "range") {
    return "This is the approximate starting price based on what you selected. The final price can still change later.";
  }

  if (mode === "soft_range") {
    return "Requests like this are usually evaluated within this band depending on size, placement, and content.";
  }

  return "Requests like this usually start from this level. The final price is set after the artist reviews the details.";
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
