import type { PublicLocale } from "@/lib/i18n/public";
import type {
  AreaScopeValue,
  EstimateMode,
  LayoutStyleValue,
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
      return "Bu tür işler seçilen alan, boyut ve içeriğe göre genelde bu bantta değerlendirilir.";
    }

    return "Bu tür işler genelde bu seviyeden başlayan bir değerlendirme gerektirir.";
  }

  if (mode === "range") {
    return "Based on what you selected, the starting level usually falls within this range.";
  }

  if (mode === "soft_range") {
    return "Requests like this are usually evaluated within this band depending on area, size, and content.";
  }

  return "Requests like this usually need an evaluation that starts from this level.";
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
        return "Tek parça";
      case "multi_element":
        return "Birden fazla öğe";
      case "cover_up":
        return "Kapatma";
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
      return "Single piece";
    case "multi_element":
      return "Multiple elements";
    case "cover_up":
      return "Cover-up";
    case "unsure":
      return "Not sure";
  }
}

export function getWorkStyleLabel(
  workStyle: WorkStyleValue,
  locale: PublicLocale,
  realismLevel?: "standard" | "advanced" | null,
) {
  if (locale === "tr") {
    if (workStyle === "shaded_detailed" && realismLevel === "advanced") {
      return "Çok yoğun / gerçekçi";
    }

    switch (workStyle) {
      case "clean_line":
        return "Sade / çizgisel";
      case "shaded_detailed":
        return "Gölgeli / detaylı";
      case "precision_symmetric":
        return "Daha düzenli / simetrik";
      case "unsure":
        return "Emin değilim";
    }
  }

  if (workStyle === "shaded_detailed" && realismLevel === "advanced") {
    return "Very dense / realistic";
  }

  switch (workStyle) {
    case "clean_line":
      return "Simple / line-based";
    case "shaded_detailed":
      return "Shaded / detailed";
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
        return "Küçük / orta";
      case "large_single_area":
        return "Tek bölgede büyük";
      case "wide_area":
        return "Çok geniş";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (areaScope) {
    case "standard_piece":
      return "Small / medium area";
    case "large_single_area":
      return "Large in one area";
    case "wide_area":
      return "Very wide area";
    case "unsure":
      return "Not sure";
  }
}

export function getLayoutStyleLabel(value: LayoutStyleValue, locale: PublicLocale) {
  if (locale === "tr") {
    switch (value) {
      case "organic":
        return "Serbest / doğal akış";
      case "precision":
        return "Daha düzenli / simetrik";
      case "unsure":
        return "Emin değilim";
    }
  }

  switch (value) {
    case "organic":
      return "Free / natural flow";
    case "precision":
      return "More ordered / symmetric";
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
