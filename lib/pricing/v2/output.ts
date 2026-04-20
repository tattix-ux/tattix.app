import type { PublicLocale } from "@/lib/i18n/public";
import type {
  AreaScopeValue,
  EstimateMode,
  LargeAreaCoverageValue,
  PricingSourceValue,
  RequestTypeValue,
  WideAreaTargetValue,
  WorkStyleValue,
} from "@/lib/types";
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
        return "Daha sade çizgili";
      case "shaded_detailed":
        return "Daha dolu / gölgeli";
      case "precision_symmetric":
        return "Daha düzenli / simetrik";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (workStyle) {
    case "clean_line":
      return "More line-based";
    case "shaded_detailed":
      return "More filled / shaded";
    case "precision_symmetric":
      return "More orderly / symmetric";
    case "unsure":
      return "Not sure";
  }
}

export function getAreaScopeLabel(areaScope: AreaScopeValue, locale: PublicLocale) {
  if (locale === "tr") {
    switch (areaScope) {
      case "standard_piece":
        return "Küçük / orta bir alan";
      case "large_single_area":
        return "Tek bölgede büyük bir alan";
      case "wide_area":
        return "Çok geniş bir alan";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (areaScope) {
    case "standard_piece":
      return "Small / medium area";
    case "large_single_area":
      return "Large single area";
    case "wide_area":
      return "Very wide area";
    case "unsure":
      return "Not sure";
  }
}

export function getLargeAreaCoverageLabel(value: LargeAreaCoverageValue, locale: PublicLocale) {
  if (locale === "tr") {
    switch (value) {
      case "partial":
        return "Bir kısmını";
      case "mostly":
        return "Büyük kısmını";
      case "almost_full":
        return "Neredeyse tamamını";
    }
  }

  switch (value) {
    case "partial":
      return "Part of it";
    case "mostly":
      return "Most of it";
    case "almost_full":
      return "Almost all of it";
  }
}

export function getWideAreaTargetLabel(value: WideAreaTargetValue, locale: PublicLocale) {
  if (locale === "tr") {
    switch (value) {
      case "half_arm":
        return "Kolun yarısı";
      case "full_arm":
        return "Tüm kol";
      case "wide_chest":
        return "Göğüste geniş alan";
      case "wide_back":
        return "Sırtta geniş alan";
      case "half_leg":
        return "Bacağın yarısı";
      case "mostly_leg":
        return "Bacağın büyük kısmı";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (value) {
    case "half_arm":
      return "Half arm";
    case "full_arm":
      return "Full arm";
    case "wide_chest":
      return "Wide chest area";
    case "wide_back":
      return "Wide back area";
    case "half_leg":
      return "Half leg";
    case "mostly_leg":
      return "Most of the leg";
    case "unsure":
      return "Not sure";
  }
}
