"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, ImagePlus, LoaderCircle, MessageCircle, Sparkles } from "lucide-react";

import { IntentSelectionStep } from "@/components/funnel/intent-selection-step";
import { RequestTypeSelectionStep } from "@/components/funnel/request-type-selection-step";
import { BodyPlacementSelector } from "@/components/funnel/body-placement-selector";
import { SizeEstimationSelector } from "@/components/funnel/size-estimation-selector";
import { AvatarTile } from "@/components/shared/avatar-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateCalendarPopover } from "@/components/ui/date-calendar-popover";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  isPlacementDetailAllowedForAreaScope,
  isPlacementGroupAllowedForAreaScope,
  type BodyAreaDetailValue,
  type BodyAreaGroupValue,
} from "@/lib/constants/body-placement";
import { deriveSizeCategoryFromCm, getPlacementSizeConstraint } from "@/lib/constants/size-estimation";
import { getPlacementDetailLocaleLabel, type PublicLocale } from "@/lib/i18n/public";
import {
  getAreaScopeLabel,
  getLayoutStyleLabel,
  getLargeAreaCoverageLabel,
  getWideAreaTargetLabel,
  getWorkStyleLabel,
} from "@/lib/pricing/v2/output";
import { uploadPublicReferenceImage } from "@/lib/supabase/storage";
import { buildThemeStyles } from "@/lib/theme";
import type {
  AreaScopeValue,
  ArtistPageData,
  ColorModeValue,
  LargeAreaCoverageValue,
  PricingSourceValue,
  RealismLevelValue,
  LayoutStyleValue,
  WideAreaTargetValue,
  WorkStyleValue,
} from "@/lib/types";
import { useFunnelStore } from "@/store/funnel-store";

type SubmissionResponse = {
  estimateAvailable: boolean;
  estimatedMin: number | null;
  estimatedMax: number | null;
  estimateMode: "range" | "soft_range" | "starting_from" | null;
  displayLabel: string | null;
  summary: string;
  disclaimer: string;
  whatsappLink: string;
  message: string;
};

type FunnelFlowStep =
  | "start"
  | "request_type"
  | "placement"
  | "size"
  | "large_coverage"
  | "wide_area_target"
  | "color_character"
  | "color_only"
  | "extras";

function getCopy(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      stepLabel: "Adım",
      heroCta: "Fiyat tahmini al",
      introTitle: "Aklındaki dövmeyi birkaç adımda netleştirelim",
      introDescription: "Seçtiklerine göre sana yaklaşık bir başlangıç fiyatı göstereceğiz.",
      startTitle: "Nasıl ilerlemek istersin?",
      startDescription: "İstersen fikrini anlat, istersen hazır tasarımlardan seç.",
      featuredFlowTitle: "Tasarımlardan birini seç, kalanını birlikte netleştirelim",
      featuredFlowDescription: "Seçtiğin tasarıma göre yaklaşık başlangıç fiyatını gösterelim.",
      areaScopeTitle: "Yaklaşık boyut ne kadar olsun?",
      areaScopeDescription: "Sana en yakın seçeneği seç.",
      areaScopes: {
        standard_piece: "Küçük / orta",
        large_single_area: "Tek bölgede büyük",
        wide_area: "Büyük proje",
        unsure: "Emin değilim",
      },
      areaScopeDescriptions: {
        standard_piece: "Yazı, sembol, tarih gibi tek parça işler",
        large_single_area: "Ön kol, baldır, göğüs gibi tek bölgede geniş yer kaplayan işler",
        wide_area: "Yarım kol, tüm kol, sırt gibi daha geniş kompozisyonlar",
        unsure: "Karar veremiyorsan bunu seçebilirsin",
      },
      requestTypeTitle: "Ne yaptırmak istiyorsun?",
      requestTypeDescription: "Sana en yakın olanı seç.",
      placementTitle: "Nereye yaptırmak istiyorsun?",
      placementDescription: "En yakın bölgeyi seç.",
      sizeTitle: "Yaklaşık boyut kaç cm olsun?",
      sizeDescription: "En geniş noktayı düşünerek yaklaşık seçim yapabilirsin.",
      largeAreaCoverageTitle: "Seçtiğin bölgenin ne kadarını kaplayacak?",
      largeAreaCoverageDescription: "",
      largeAreaCoverageHelp: "En yakın seçeneği seç.",
      largeAreaCoverageOptions: {
        partial: "Bir kısmını",
        mostly: "Büyük kısmını",
        almost_full: "Neredeyse tamamını",
      },
      wideAreaTargetTitle: "En çok hangisine yakın?",
      wideAreaTargetDescription: "Sana en yakın seçeneği seç.",
      wideAreaTargets: {
        half_arm: "Kolun yarısı",
        full_arm: "Tüm kol",
        wide_chest: "Göğüste geniş alan",
        wide_back: "Sırtta geniş alan",
        half_leg: "Bacağın yarısı",
        mostly_leg: "Bacağın büyük kısmı",
        unsure: "Emin değilim",
      },
      stepTitles: {
        1: "Aklındaki dövmeyi birkaç adımda netleştirelim",
        2: "Nereye yaptırmak istiyorsun?",
        3: "Yaklaşık boyut kaç cm olsun?",
        4: "Renk olacak mı?",
        5: "Referans görselin veya kısa notun var mı?",
        6: "Tahmini fiyat aralığı",
      },
      stepDescriptions: {
        1: "Seçtiklerine göre sana yaklaşık bir başlangıç fiyatı göstereceğiz.",
        2: "En yakın bölgeyi seç.",
        3: "En geniş noktayı düşünerek yaklaşık seçim yapabilirsin.",
        4: "Dövmenin genel görünümüne en yakın seçeneği seç.",
        5: "Varsa ekleyebilirsin. Yoksa bu adımı geçebilirsin.",
        6: "",
      },
      colorTitleCustom: "Nasıl bir görünüm istiyorsun?",
      colorTitleFeatured: "Renk aynı mı kalsın?",
      colorDescriptionCustom: "Renk ve detay seviyesini seç.",
      colorDescriptionFeatured: "Renk ve detay seviyesini seç.",
      intensityTitle: "Detay seviyesi",
      intensityDescription: "En yakın seçeneği seç.",
      intensityStyles: {
        clean_line: "Daha sade",
        shaded_detailed: "Orta detaylı",
        advanced: "Çok detaylı",
        unsure: "Emin değilim",
      },
      intensityDescriptions: {
        clean_line: "Az detay, basit ve ince çizgiler",
        shaded_detailed: "Gölgelendirmeler ve daha detaylı görünümler",
        advanced: "Yoğun detay, gölge ya da daha gerçekçi görünümler",
        unsure: "Karar veremiyorsan bunu seçebilirsin",
      },
      layoutTitle: "Yerleşim tarzı",
      layoutDescription: "Tasarımın daha çok nasıl dursun?",
      layoutStyles: {
        organic: "Akışkan",
        precision: "Düzenli/Simetrik",
        unsure: "Emin değilim",
      },
      layoutDescriptions: {
        organic: "Daha serbest yerleşim, yumuşak geçişler",
        precision: "Daha net, dengeli ve simetrik görünüm",
        unsure: "Karar veremiyorsan bunu seçebilirsin",
      },
      colorModes: {
        "black-only": "Sadece siyah",
        "black-grey": "Siyah-gri",
        "full-color": "Renkli",
        same: "Aynı kalsın",
      },
      colorModeTitle: "Renk",
      colorModeHelp: "En yakın seçeneği seç.",
      featuredColorModes: {
        same: "Aynı kalsın",
        "black-only": "Sadece siyah olsun",
        "black-grey": "Siyah-gri olsun",
        "full-color": "Renkli olsun",
      },
      continue: "Devam",
      back: "Geri",
      submit: "Tahmini gör",
      uploading: "Yükleniyor",
      referenceTitle: "Birkaç bilgi daha ekleyelim",
      referenceDescription: "İstersen aklındaki tasarımı yükleyebilir, kısa bir not bırakabilir ve randevu bilgilerini buradan seçebilirsin.",
      referenceUpload: "Referans görsel ekle",
      referenceNote: "Kısa not",
      referencePlaceholder: "Aklındaki fikir, önemli detaylar veya istediğin değişiklikler",
      featuredNoteTitle: "Birkaç bilgi daha ekleyelim",
      featuredNoteDescription: "İstersen aklındaki tasarımı yükleyebilir, kısa bir not bırakabilir ve randevu bilgilerini buradan seçebilirsin.",
      featuredNotePlaceholder: "Randevu, yerleşim veya önemli bir not yazabilirsin",
      coverUpTitle: "Mevcut bir dövmenin üstüne mi yapılacak?",
      coverUpDescription: "Bu bilgi fiyatı etkileyebilir.",
      coverUpYes: "Evet, mevcut bir dövmenin üstüne",
      coverUpNo: "Hayır, yeni bir alan",
      referenceSectionTitle: "Referans görsel veya kısa notun var mı?",
      referenceSectionDescription: "Varsa ekleyebilirsin. Yoksa bu adımı geçebilirsin.",
      customerInfo: "Birkaç bilgi daha",
      allergy: "Alerjin var mı?",
      chronicCondition: "Kronik bir rahatsızlığın var mı?",
      chronicConditionDetails: "Rahatsızlığını kısaca yaz",
      chronicConditionPlaceholder: "Varsa kısaca yazabilirsin",
      yes: "Evet",
      no: "Hayır",
      cityTitle: "Hangi şehirden randevu almak istersin?",
      cityDescription: "Dövmecinin uygun olduğu şehirlerden birini seç.",
      cityPlaceholder: "Şehir seç",
      timingTitle: "Ne zaman düşünüyorsun?",
      timingDescription: "Sana en uygun zamanı seç.",
      timingRangeTitle: "Hangi tarih aralığı sana daha uygun?",
      timingRangeDescription: "Yaklaşık bir aralık seçmen yeterli.",
      timingSingle: "Tek gün",
      timingRange: "Tarih aralığı",
      startDate: "Başlangıç tarihi",
      endDate: "Bitiş tarihi",
      noDates: "Bu şehir için seçilebilir tarih görünmüyor.",
      gender: "Cinsiyet",
      genderPlaceholder: "Belirtmek istemiyorum",
      ageRange: "Yaş aralığı",
      ageRangePlaceholder: "Belirtmek istemiyorum",
      genders: {
        female: "Kadın",
        male: "Erkek",
        prefer_not_to_say: "Belirtmek istemiyorum",
      },
      ageRanges: {
        "18-24": "18-24",
        "25-34": "25-34",
        "35-44": "35-44",
        "45+": "45+",
      },
      calculatingTitle: "Tahmin hazırlanıyor",
      calculatingBody: "Bu sadece birkaç saniye sürer.",
      resultTitles: {
        range: "Tahmini fiyat aralığı",
        soft_range: "Tahmini fiyat aralığı",
        starting_from: "Tahmini fiyat aralığı",
      },
      noEstimateTitle: "Talebini sanatçıya ilet",
      noEstimateBody: "Talebin doğrudan sanatçıya iletilir. Sanatçı, detaylara göre sana net bir dönüş yapar.",
      summaryTitle: "Seçim özeti",
      pricingBreakdownNote: "Bu aralık, seçtiğin bölge, kaplayacağı alan, renk ve detay seviyesine göre hesaplandı.",
      resultDisclaimerPrimary: "Bu aralık, seçilen alan, dövmenin kaplayacağı bölge ve içerik türüne göre genel bir ilk hesaplamadır.",
      resultDisclaimerSecondary: "Bu sadece başlangıç için bir tahmindir. Kesin fiyat, sanatçı ile birlikte boyut ve tasarım detayları netleştirildiğinde büyük ölçüde değişiklik gösterebilir.",
      startingFromExtra: "Net fiyat, detaylar netleştikten sonra belirlenir.",
      wideAreaExtraInfo: "Bu tür işler çoğu zaman görüşme sonrası netleşir.",
      summaryLabels: {
        selectedDesign: "Seçilen tasarım",
        areaScope: "Alan",
        areaCoverage: "Kaplayacağı alan",
        wideAreaTarget: "Kaplayacağı alan",
        placement: "Bölge",
        size: "Boyut",
        color: "Renk",
        workStyle: "Detay seviyesi",
        layoutStyle: "Yerleşim tarzı",
        coverUp: "Kapatma durumu",
      },
      sendWhatsapp: "WhatsApp'tan gönder",
      copyMessage: "Mesajı kopyala",
      copied: "Mesaj kopyalandı",
      restart: "Baştan başla",
      featuredDisclaimer: "Özel bir değişiklik düşünüyorsan bunu dövmeciyle görüşebilirsin.",
      invalidBooking: "Şehir ve tarih seçimini tamamla.",
    };
  }

  return {
    stepLabel: "Step",
    heroCta: "Get estimate",
    introTitle: "Let’s clarify the tattoo you have in mind in a few steps",
    introDescription: "Based on your choices, we’ll show you an approximate starting price.",
    startTitle: "How would you like to continue?",
    startDescription: "Describe your idea or choose from ready-made designs.",
    featuredFlowTitle: "Pick one of the designs and let’s clarify the rest together",
    featuredFlowDescription: "We’ll show you an approximate starting price based on the design you choose.",
    areaScopeTitle: "About how much area?",
    areaScopeDescription: "Choose the option that feels closest.",
    areaScopes: {
      standard_piece: "Small / medium",
      large_single_area: "Large in one area",
      wide_area: "Very wide area",
      unsure: "Not sure",
    },
    areaScopeDescriptions: {
      standard_piece: "Like text, symbols, or a single piece",
      large_single_area: "Like forearm, calf, or chest",
      wide_area: "Like half arm, full arm, or back",
      unsure: "Choose this if you’re not sure yet",
    },
    requestTypeTitle: "What do you want to get?",
    requestTypeDescription: "Choose the closest option.",
    placementTitle: "Where do you want to get it?",
    placementDescription: "Choose the closest area.",
    sizeTitle: "About how many cm should it be?",
    sizeDescription: "Think about the widest point and choose approximately.",
    largeAreaCoverageTitle: "How much of that area will it cover?",
    largeAreaCoverageDescription: "",
    largeAreaCoverageHelp: "Choose the option that feels closest.",
    largeAreaCoverageOptions: {
      partial: "Part of it",
      mostly: "Most of it",
      almost_full: "Almost all of it",
    },
    wideAreaTargetTitle: "Which one is it closest to?",
    wideAreaTargetDescription: "Choose the option that feels closest.",
    wideAreaTargets: {
      half_arm: "Half arm",
      full_arm: "Full arm",
      wide_chest: "Wide chest area",
      wide_back: "Wide back area",
      half_leg: "Half leg",
      mostly_leg: "Most of the leg",
      unsure: "Not sure",
    },
    stepTitles: {
      1: "Let’s clarify the tattoo you have in mind in a few steps",
      2: "Where do you want it?",
      3: "About how many cm should it be?",
      4: "Will there be color?",
      5: "Do you have a reference image or a short note?",
      6: "Your estimated starting range",
    },
    stepDescriptions: {
      1: "Based on your choices, we’ll show you an approximate starting price.",
      2: "Choose the closest area.",
      3: "Think about the widest point and choose approximately.",
      4: "Choose the option closest to the overall look.",
      5: "You can add it if you want. If not, you can skip this step.",
      6: "",
    },
      colorTitleCustom: "What kind of look do you want?",
    colorTitleFeatured: "Will the color stay the same?",
    colorDescriptionCustom: "Choose the color and detail level.",
    colorDescriptionFeatured: "Choose the color and detail level.",
    intensityTitle: "How detailed should it be?",
    intensityDescription: "Choose the closest option.",
    intensityStyles: {
      clean_line: "Simple / fine line",
      shaded_detailed: "Medium detail",
      advanced: "Very detailed / realistic",
      unsure: "Not sure",
    },
    intensityDescriptions: {
      clean_line: "Low detail, more minimal look",
      shaded_detailed: "Includes some shading and detail",
      advanced: "Dense detail, more realistic look",
      unsure: "Choose this if you’re not sure yet",
    },
    layoutTitle: "How should it look?",
    layoutDescription: "Choose the closest option.",
    layoutStyles: {
      organic: "Flowing design",
      precision: "Geometric / orderly",
      unsure: "Not sure",
    },
    layoutDescriptions: {
      organic: "Freer placement with softer transitions",
      precision: "Ordered, balanced, and cleaner lines",
      unsure: "Choose this if you’re not sure yet",
    },
    colorModes: {
      "black-only": "Black only",
      "black-grey": "Black and grey",
      "full-color": "Color",
      same: "Keep it the same",
    },
    colorModeTitle: "Color",
    colorModeHelp: "Choose the closest option.",
    featuredColorModes: {
      same: "Keep it the same",
      "black-only": "Make it black only",
      "black-grey": "Make it black and grey",
      "full-color": "Make it color",
    },
    continue: "Continue",
    back: "Back",
    submit: "See estimate",
    uploading: "Uploading",
    referenceTitle: "Do you have a reference image or a short note?",
    referenceDescription: "You can add it if you want. If not, you can skip this step.",
    referenceUpload: "Add reference image",
    referenceNote: "Short note",
    referencePlaceholder: "The idea you have in mind, important details, or any change you want",
    featuredNoteTitle: "Would you like to add a short note?",
    featuredNoteDescription: "You can write it if you want. If not, you can skip it.",
    featuredNotePlaceholder: "You can write a note about placement, timing, or anything important",
    coverUpTitle: "Will it go over an existing tattoo?",
    coverUpDescription: "This can affect the estimate.",
    coverUpYes: "Yes, over an existing tattoo",
    coverUpNo: "No, it will be on a new area",
    referenceSectionTitle: "Do you have a reference image or a short note?",
    referenceSectionDescription: "You can add it if you want. If not, you can skip this step.",
    cityTitle: "Which city are you thinking about for the appointment?",
    cityDescription: "Choose one of the cities where the artist is available.",
    cityPlaceholder: "Choose city",
    timingTitle: "When are you thinking about it?",
    timingDescription: "Choose the timing that suits you best.",
    timingRangeTitle: "Which date range works better for you?",
    timingRangeDescription: "An approximate range is enough.",
    timingSingle: "Single day",
    timingRange: "Date range",
    startDate: "Start date",
    endDate: "End date",
    noDates: "There are no selectable dates for this city right now.",
    customerInfo: "A few extra details",
    allergy: "Do you have any allergies?",
    chronicCondition: "Do you have any chronic condition?",
    chronicConditionDetails: "Briefly describe your condition",
    chronicConditionPlaceholder: "You can briefly write it here",
    yes: "Yes",
    no: "No",
    gender: "Gender",
    genderPlaceholder: "If you want",
    ageRange: "Age range",
    ageRangePlaceholder: "If you want",
    genders: {
      female: "Female",
      male: "Male",
      prefer_not_to_say: "Prefer not to say",
    },
    ageRanges: {
      "18-24": "18-24",
      "25-34": "25-34",
      "35-44": "35-44",
      "45+": "45+",
    },
    calculatingTitle: "Preparing your estimate",
    calculatingBody: "This only takes a few seconds.",
    resultTitles: {
      range: "Estimated starting range",
      soft_range: "Typical range",
      starting_from: "Starting price",
    },
    noEstimateTitle: "Send your request to the artist",
    noEstimateBody: "Your request goes straight to the artist. The artist will send you a clear reply after reviewing the details.",
    summaryTitle: "Summary",
    pricingBreakdownNote: "This range was calculated based on the area, coverage, color, and detail level you selected.",
    resultDisclaimerPrimary: "This range is a first estimate based on the selected area, how much of it the tattoo will cover, and the type of content involved.",
    resultDisclaimerSecondary: "This is only a starting estimate. The final price can change significantly once the size and design details are clarified with the artist.",
    startingFromExtra: "The final price is set after the details are clarified.",
    wideAreaExtraInfo: "Requests like this are often clarified after a conversation.",
    estimateChangeNote: "This is only an estimate. The final price may change significantly after you speak with the artist and clarify the details.",
    summaryLabels: {
      requestType: "Job type",
      areaScope: "Area",
      areaCoverage: "Coverage",
      wideAreaTarget: "Closest area",
      selectedDesign: "Design",
      placement: "Placement",
      size: "Size",
      color: "Color",
      workStyle: "Character of the piece",
      layoutStyle: "Layout",
      coverUp: "Cover-up",
    },
    sizeNotSelected: "Not specified",
    sizeFallbackNote: "Because no size was selected, this estimate should be read more cautiously.",
    sendWhatsapp: "Send on WhatsApp",
    copyMessage: "Copy message",
    copied: "Message copied",
    restart: "Start over",
    featuredDisclaimer: "If you want a custom change, you can discuss it with the artist.",
    invalidBooking: "Complete the city and date selection.",
  };
}

function getDelayMs() {
  return 1800 + Math.round(Math.random() * 900);
}

function getIntentForSubmission(pricingSource: PricingSourceValue, requestType: string, category?: string | null) {
  if (pricingSource === "featured_design") {
    return category === "discounted-designs" ? "discounted-design" : "flash-design";
  }

  return requestType === "unsure" ? "not-sure" : "design-in-mind";
}

function getFlowSteps(
  pricingSource: PricingSourceValue | "",
  areaScope: AreaScopeValue | "",
): FunnelFlowStep[] {
  if (pricingSource === "featured_design") {
    return ["start", "placement", "size", "extras"];
  }

  if (areaScope === "large_single_area") {
    return ["start", "placement", "large_coverage", "color_character", "extras"];
  }

  if (areaScope === "wide_area") {
    return ["start", "wide_area_target", "color_character", "extras"];
  }

  return ["start", "request_type", "placement", "size", "color_character", "extras"];
}

function getWideAreaPlacementTarget(
  value: WideAreaTargetValue,
): { group: BodyAreaGroupValue; detail: BodyAreaDetailValue; sizeCm: number } {
  switch (value) {
    case "half_arm":
      return { group: "arm", detail: "forearm-outer", sizeCm: 22 };
    case "full_arm":
      return { group: "arm", detail: "upper-arm-outer", sizeCm: 30 };
    case "wide_chest":
      return { group: "torso", detail: "chest-center", sizeCm: 26 };
    case "wide_back":
      return { group: "back", detail: "upper-back", sizeCm: 30 };
    case "half_leg":
      return { group: "leg", detail: "thigh-front", sizeCm: 24 };
    case "mostly_leg":
      return { group: "leg", detail: "thigh-front", sizeCm: 32 };
    case "unsure":
      return { group: "not-sure", detail: "placement-not-sure", sizeCm: 24 };
  }
}

function getLargeAreaSize(detail: BodyAreaDetailValue, coverage: LargeAreaCoverageValue) {
  const constraint = getPlacementSizeConstraint(detail);
  const target =
    coverage === "partial"
      ? constraint.maxCm * 0.62
      : coverage === "mostly"
        ? constraint.maxCm * 0.82
        : constraint.maxCm * 0.94;

  return Math.max(constraint.minCm, Math.round(target));
}

export function PublicFunnel({ artist, locale }: { artist: ArtistPageData; locale: PublicLocale }) {
  const {
    step,
    draft,
    result,
    submitting,
    setField,
    setStep,
    setSubmitting,
    setResult,
    reset,
  } = useFunnelStore();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingMode, setBookingMode] = useState<"single" | "range">("single");
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const flowCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    reset();
    setBookingMode("single");
  }, [reset, artist.profile.slug]);

  useEffect(() => {
    flowCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  useEffect(() => {
    if (draft.pricingSource !== "custom_request") {
      return;
    }

    if (!draft.areaScope || draft.areaScope === "wide_area" || draft.areaScope === "unsure") {
      return;
    }

    const invalidGroup = !isPlacementGroupAllowedForAreaScope(draft.bodyAreaGroup, draft.areaScope);
    const invalidDetail = !isPlacementDetailAllowedForAreaScope(draft.bodyAreaDetail, draft.areaScope);

    if (!invalidGroup && !invalidDetail) {
      return;
    }

    setField("bodyAreaGroup", "");
    setField("bodyAreaDetail", "");
    setField("largeAreaCoverage", "");
    setField("selectedSizeCm", null);
    setField("inferredSizeCm", null);
    setField("isSizeExplicit", false);
    setField("approximateSizeCm", null);
    setField("sizeCategory", "");
  }, [
    draft.areaScope,
    draft.bodyAreaDetail,
    draft.bodyAreaGroup,
    draft.pricingSource,
    draft.selectedSizeCm,
    draft.inferredSizeCm,
    setField,
  ]);

  const copy = getCopy(locale);
  const activeDesigns = artist.featuredDesigns.filter((design) => design.active);
  const selectedDesign =
    draft.selectedDesignId
      ? activeDesigns.find((design) => design.id === draft.selectedDesignId) ?? null
      : null;
  const bookingCities = artist.funnelSettings.bookingCities;
  const selectedBookingCity = bookingCities.find((city) => city.cityName === draft.city) ?? null;
  const availableDatesForSelectedCity = selectedBookingCity?.availableDates ?? [];
  const requiresBookingSelection = bookingCities.length > 0;
  const introTitle =
    artist.pageTheme.customWelcomeTitle?.trim() ||
    artist.profile.welcomeHeadline?.trim() ||
    "";
  const introText =
    artist.pageTheme.customIntroText?.trim() ||
    artist.profile.shortBio?.trim() ||
    "";
  const primaryActionLabel = artist.pageTheme.customCtaLabel || copy.heroCta;
  const { tokens } = buildThemeStyles(artist.pageTheme);
  const flowSteps = useMemo(() => getFlowSteps(draft.pricingSource, draft.areaScope), [draft.areaScope, draft.pricingSource]);
  const lastInteractiveStep = flowSteps.length;
  const resultStep = lastInteractiveStep + 1;
  const currentFlowStep = step < resultStep ? flowSteps[step - 1] : null;
  const currentTitle =
    currentFlowStep === "start"
      ? copy.startTitle
      : currentFlowStep === "request_type"
        ? copy.requestTypeTitle
        : currentFlowStep === "placement"
          ? copy.placementTitle
          : currentFlowStep === "size"
            ? copy.sizeTitle
            : currentFlowStep === "large_coverage"
              ? copy.largeAreaCoverageTitle
              : currentFlowStep === "wide_area_target"
                ? copy.wideAreaTargetTitle
                : currentFlowStep === "color_only" || currentFlowStep === "color_character"
                  ? draft.pricingSource === "featured_design"
                    ? copy.colorTitleFeatured
                    : copy.colorTitleCustom
                  : currentFlowStep === "extras"
                    ? draft.pricingSource === "featured_design"
                      ? copy.featuredNoteTitle
                      : copy.referenceTitle
                    : copy.stepTitles[6];
  const currentDescription =
    currentFlowStep === "start"
      ? copy.startDescription
      : currentFlowStep === "request_type"
        ? copy.requestTypeDescription
        : currentFlowStep === "placement"
          ? copy.placementDescription
          : currentFlowStep === "size"
            ? copy.sizeDescription
            : currentFlowStep === "large_coverage"
              ? copy.largeAreaCoverageDescription
              : currentFlowStep === "wide_area_target"
                ? copy.wideAreaTargetDescription
                : currentFlowStep === "color_only" || currentFlowStep === "color_character"
                  ? draft.pricingSource === "featured_design"
                    ? copy.colorDescriptionFeatured
                    : copy.colorDescriptionCustom
                  : currentFlowStep === "extras"
                    ? draft.pricingSource === "featured_design"
                      ? copy.featuredNoteDescription
                      : copy.referenceDescription
                    : copy.stepDescriptions[6];
  const displayProgress = (Math.min(step, lastInteractiveStep) / lastInteractiveStep) * 100;
  const colorChoices = [
    { key: "black-only", value: "black-only" as ColorModeValue, labelKey: "black-only" as const },
    { key: "black-grey", value: "black-grey" as ColorModeValue, labelKey: "black-grey" as const },
    { key: "full-color", value: "full-color" as ColorModeValue, labelKey: "full-color" as const },
  ];
  const intensityChoices: Array<{
    value: "clean_line" | "shaded_detailed" | "advanced" | "unsure";
    label: string;
  }> = [
    { value: "clean_line", label: copy.intensityStyles.clean_line },
    { value: "shaded_detailed", label: copy.intensityStyles.shaded_detailed },
    { value: "advanced", label: copy.intensityStyles.advanced },
    { value: "unsure", label: copy.intensityStyles.unsure },
  ];
  const layoutChoices: Array<{ value: LayoutStyleValue; label: string }> = [
    { value: "organic", label: copy.layoutStyles.organic },
    { value: "precision", label: copy.layoutStyles.precision },
    { value: "unsure", label: copy.layoutStyles.unsure },
  ];
  const largeAreaCoverageChoices: Array<{ value: LargeAreaCoverageValue; label: string }> = [
    { value: "partial", label: copy.largeAreaCoverageOptions.partial },
    { value: "mostly", label: copy.largeAreaCoverageOptions.mostly },
    { value: "almost_full", label: copy.largeAreaCoverageOptions.almost_full },
  ];
  const wideAreaChoices: Array<{ value: WideAreaTargetValue; label: string }> = [
    { value: "half_arm", label: copy.wideAreaTargets.half_arm },
    { value: "full_arm", label: copy.wideAreaTargets.full_arm },
    { value: "wide_chest", label: copy.wideAreaTargets.wide_chest },
    { value: "wide_back", label: copy.wideAreaTargets.wide_back },
    { value: "half_leg", label: copy.wideAreaTargets.half_leg },
    { value: "mostly_leg", label: copy.wideAreaTargets.mostly_leg },
    { value: "unsure", label: copy.wideAreaTargets.unsure },
  ];

  const canAdvance =
    currentFlowStep === "start"
      ? Boolean(
          draft.pricingSource &&
            (draft.pricingSource === "featured_design" ? draft.selectedDesignId : draft.areaScope),
        )
      : currentFlowStep === "request_type"
        ? Boolean(draft.requestType)
        : currentFlowStep === "placement"
          ? Boolean(draft.bodyAreaGroup && draft.bodyAreaDetail)
          : currentFlowStep === "size"
            ? Boolean(draft.selectedSizeCm && draft.sizeCategory)
            : currentFlowStep === "large_coverage"
              ? Boolean(draft.largeAreaCoverage)
              : currentFlowStep === "wide_area_target"
                ? Boolean(draft.wideAreaTarget)
                : currentFlowStep === "color_only"
                  ? Boolean(draft.colorMode)
                : currentFlowStep === "color_character"
                  ? Boolean(
                        draft.colorMode &&
                          draft.workStyle,
                      )
                    : true;
  const canSubmit =
    draft.pricingSource === "custom_request" && (draft.areaScope === "large_single_area" || draft.areaScope === "wide_area")
      ? draft.coverUp !== null
      : true;

  const resultSummaryItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];

    if (draft.pricingSource === "custom_request" && draft.areaScope) {
      items.push({ label: copy.summaryLabels.areaScope, value: getAreaScopeLabel(draft.areaScope, locale) });
    }

    if (draft.pricingSource === "custom_request" && draft.largeAreaCoverage) {
      items.push({
        label: copy.summaryLabels.areaCoverage,
        value: getLargeAreaCoverageLabel(draft.largeAreaCoverage, locale),
      });
    }

    if (draft.pricingSource === "custom_request" && draft.wideAreaTarget) {
      items.push({
        label: copy.summaryLabels.wideAreaTarget,
        value: getWideAreaTargetLabel(draft.wideAreaTarget, locale),
      });
    }

    if (draft.bodyAreaDetail && draft.areaScope !== "wide_area") {
      items.push({
        label: copy.summaryLabels.placement,
        value: getPlacementDetailLocaleLabel(draft.bodyAreaDetail, locale),
      });
    }

    if (draft.selectedSizeCm) {
      items.push({
        label: copy.summaryLabels.size,
        value: `${draft.selectedSizeCm} cm`,
      });
    }

    if (draft.colorMode && draft.pricingSource !== "featured_design") {
      items.push({ label: copy.summaryLabels.color, value: copy.colorModes[draft.colorMode] });
    }

    if (draft.pricingSource === "custom_request" && draft.workStyle) {
      items.push({
        label: copy.summaryLabels.workStyle,
        value: getWorkStyleLabel(draft.workStyle, locale, draft.realismLevel || null),
      });
    }

    if (draft.pricingSource === "custom_request" && draft.layoutStyle) {
      items.push({
        label: copy.summaryLabels.layoutStyle,
        value: getLayoutStyleLabel(draft.layoutStyle, locale),
      });
    }

    const shouldShowCoverUp =
      draft.pricingSource === "custom_request" &&
      (draft.coverUp === true || draft.areaScope === "large_single_area" || draft.areaScope === "wide_area");

    if (shouldShowCoverUp && draft.coverUp !== null && draft.coverUp !== undefined) {
      items.push({
        label: copy.summaryLabels.coverUp,
        value: draft.coverUp ? (locale === "tr" ? "Evet" : "Yes") : (locale === "tr" ? "Hayır" : "No"),
      });
    }

    return items;
  }, [copy.colorModes, copy.summaryLabels.areaCoverage, copy.summaryLabels.areaScope, copy.summaryLabels.color, copy.summaryLabels.coverUp, copy.summaryLabels.layoutStyle, copy.summaryLabels.placement, copy.summaryLabels.size, copy.summaryLabels.wideAreaTarget, copy.summaryLabels.workStyle, draft.areaScope, draft.bodyAreaDetail, draft.colorMode, draft.coverUp, draft.largeAreaCoverage, draft.layoutStyle, draft.pricingSource, draft.realismLevel, draft.selectedSizeCm, draft.wideAreaTarget, draft.workStyle, locale]);

  function resetCustomPathState(nextAreaScope?: AreaScopeValue | "") {
    setField("requestType", "");
    setField("largeAreaCoverage", "");
    setField("wideAreaTarget", "");
    setField("bodyAreaGroup", "");
    setField("bodyAreaDetail", "");
    setField("selectedSizeCm", null);
    setField("inferredSizeCm", null);
    setField("isSizeExplicit", false);
    setField("approximateSizeCm", null);
    setField("sizeCategory", "");
    setField("colorMode", "");
    setField("workStyle", "");
    setField("realismLevel", "");
    setField("layoutStyle", "");
    setField("coverUp", nextAreaScope === "wide_area" || nextAreaScope === "large_single_area" ? null : false);
  }

  function applyWideAreaTarget(value: WideAreaTargetValue) {
    const mapped = getWideAreaPlacementTarget(value);
    setField("wideAreaTarget", value);
    setField("bodyAreaGroup", mapped.group);
    setField("bodyAreaDetail", mapped.detail);
    setField("selectedSizeCm", null);
    setField("inferredSizeCm", mapped.sizeCm);
    setField("isSizeExplicit", false);
    setField("approximateSizeCm", mapped.sizeCm);
    setField("sizeCategory", deriveSizeCategoryFromCm(mapped.sizeCm));
  }

  async function handleReferenceUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      return;
    }

    setIsUploadingReference(true);

    try {
      const uploaded = await uploadPublicReferenceImage(file, artist.profile.id);
      setField("referenceImage", uploaded.publicUrl);
      setField("referenceImagePath", uploaded.path);
    } finally {
      setIsUploadingReference(false);
    }
  }

  async function handleFinalSubmit() {
    if (requiresBookingSelection) {
      if (!draft.city || !selectedBookingCity || !draft.preferredStartDate) {
        setBookingError(copy.invalidBooking);
        return;
      }

      if (!availableDatesForSelectedCity.includes(draft.preferredStartDate)) {
        setBookingError(copy.invalidBooking);
        return;
      }

      if (bookingMode === "range" && draft.preferredEndDate) {
        if (!availableDatesForSelectedCity.includes(draft.preferredEndDate)) {
          setBookingError(copy.invalidBooking);
          return;
        }
      }
    }

    setBookingError(null);
    setSubmitting(true);
    setResult(null);
    setStep(resultStep);

    const payload = {
      artistSlug: artist.profile.slug,
      locale,
      pricingSource: draft.pricingSource || (draft.selectedDesignId ? "featured_design" : "custom_request"),
      areaScope: draft.pricingSource === "custom_request" ? draft.areaScope || undefined : undefined,
      largeAreaCoverage:
        draft.pricingSource === "custom_request" && draft.areaScope === "large_single_area"
          ? draft.largeAreaCoverage || undefined
          : undefined,
      wideAreaTarget:
        draft.pricingSource === "custom_request" && draft.areaScope === "wide_area"
          ? draft.wideAreaTarget || undefined
          : undefined,
      requestType: draft.requestType || undefined,
      intent: getIntentForSubmission(
        (draft.pricingSource || "custom_request") as PricingSourceValue,
        draft.requestType,
        selectedDesign?.category,
      ),
      selectedDesignId: draft.selectedDesignId || null,
      bodyAreaGroup: draft.bodyAreaGroup,
      bodyAreaDetail: draft.bodyAreaDetail,
      sizeMode: "quick" as const,
      selectedSizeCm: draft.selectedSizeCm,
      inferredSizeCm: draft.inferredSizeCm,
      isSizeExplicit: draft.isSizeExplicit,
      approximateSizeCm: draft.approximateSizeCm ?? null,
      sizeCategory: draft.sizeCategory,
      widthCm: null,
      heightCm: null,
      colorMode: draft.pricingSource === "custom_request" ? draft.colorMode || undefined : undefined,
      referenceImage: draft.referenceImage || null,
      referenceImagePath: draft.referenceImagePath || null,
      referenceDescription: draft.referenceDescription || undefined,
      city: draft.city || undefined,
      preferredStartDate: draft.preferredStartDate || undefined,
      preferredEndDate: bookingMode === "range" ? draft.preferredEndDate || undefined : undefined,
      gender: draft.gender || undefined,
      ageRange: draft.ageRange || undefined,
      hasAllergy: draft.hasAllergy,
      hasChronicCondition: draft.hasChronicCondition,
      chronicConditionDetails:
        draft.hasChronicCondition === true ? draft.chronicConditionDetails || undefined : undefined,
      workStyle:
        draft.pricingSource === "custom_request"
          ? draft.workStyle || undefined
          : undefined,
      realismLevel:
        draft.pricingSource === "custom_request" && draft.realismLevel === "advanced"
          ? draft.realismLevel || undefined
          : undefined,
      layoutStyle: draft.pricingSource === "custom_request" ? draft.layoutStyle || undefined : undefined,
      notes: draft.notes || undefined,
      coverUp:
        draft.pricingSource === "custom_request" && (draft.areaScope === "large_single_area" || draft.areaScope === "wide_area")
          ? draft.coverUp ?? undefined
          : draft.requestType === "cover_up",
      customDesign: draft.pricingSource !== "featured_design",
      designType: draft.requestType || null,
    };

    try {
      const requestPromise = fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const [response] = await Promise.all([
        requestPromise,
        new Promise((resolve) => window.setTimeout(resolve, getDelayMs())),
      ]);

      const responsePayload = (await response.json()) as SubmissionResponse;
      setSubmitting(false);

      if (!response.ok) {
        setBookingError(copy.calculatingBody);
        setStep(lastInteractiveStep);
        return;
      }

      setResult({
        estimateAvailable: responsePayload.estimateAvailable,
        estimatedMin: responsePayload.estimatedMin,
        estimatedMax: responsePayload.estimatedMax,
        estimateMode: responsePayload.estimateMode,
        displayLabel: responsePayload.displayLabel,
        summary: responsePayload.summary,
        disclaimer: responsePayload.disclaimer,
        whatsappLink: responsePayload.whatsappLink,
        message: responsePayload.message,
      });
    } catch {
      setSubmitting(false);
      setBookingError(copy.calculatingBody);
      setStep(lastInteractiveStep);
    }
  }

  async function copyMessage() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.message);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip space-y-2 sm:space-y-4">
      <Card
        className="overflow-hidden w-full min-w-0 max-w-full overflow-x-clip"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "var(--artist-rail-surface)",
          borderRadius: "var(--artist-card-radius, var(--artist-radius))",
          boxShadow: "var(--artist-card-shadow)",
        }}
      >
        <div
          className="h-32 w-full border-b bg-grid sm:h-36"
          style={
            artist.profile.coverImageUrl
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.15), rgba(9,9,11,0.88)), url(${artist.profile.coverImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderColor: "var(--artist-border)",
                }
              : { borderColor: "var(--artist-border)" }
          }
        />
        <CardContent className="-mt-10 min-w-0 space-y-3 p-4 sm:p-5">
          <AvatarTile
            name={artist.profile.artistName}
            imageUrl={artist.profile.profileImageUrl}
            planType={artist.profile.planType}
          />
          <div className="space-y-3">
            {artist.funnelSettings.introEyebrow?.trim() ? <Badge variant="accent">{artist.funnelSettings.introEyebrow}</Badge> : null}
            {introTitle ? (
              <h1 className="leading-tight sm:text-3xl" style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)", fontSize: "clamp(1.58rem, calc(1.42rem * var(--artist-heading-scale)), 2.35rem)" }}>
                {introTitle}
              </h1>
            ) : null}
            {introText ? (
              <p className="text-sm leading-6 sm:leading-7" style={{ color: "var(--artist-card-muted)" }}>
                {introText}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div ref={flowCardRef}>
        <Card
          className="w-full min-w-0 max-w-full overflow-x-clip"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor: "var(--artist-flow-surface)",
            borderRadius: "var(--artist-card-radius, var(--artist-radius))",
            boxShadow: "var(--artist-card-shadow)",
          }}
        >
          <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="break-words text-base sm:text-lg" style={{ color: "var(--artist-card-text)" }}>
                  {result ? copy.stepTitles[6] : currentTitle}
                </CardTitle>
                {(result ? copy.stepDescriptions[6] : currentDescription) ? (
                  <CardDescription className="break-words text-[13px] leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--artist-card-muted)" }}>
                    {result ? copy.stepDescriptions[6] : currentDescription}
                  </CardDescription>
                ) : null}
              </div>
              <Badge
                variant="muted"
                className="w-fit self-start text-[10px] tracking-[0.14em] sm:text-[11px] sm:tracking-[0.2em]"
                style={{
                  color: "var(--artist-card-text)",
                  backgroundColor: "var(--artist-chip-surface)",
                  borderColor: "var(--artist-border)",
                }}
              >
                {copy.stepLabel} {Math.min(step, resultStep)} / {resultStep}
              </Badge>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full sm:mt-4 sm:h-2" style={{ backgroundColor: "var(--artist-divider)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${displayProgress}%`,
                  background: `linear-gradient(90deg, ${artist.pageTheme.primaryColor}, ${artist.pageTheme.secondaryColor})`,
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
            {currentFlowStep === "start" ? (
              <IntentSelectionStep
                locale={locale}
                designs={activeDesigns}
                selectedDesignId={draft.selectedDesignId}
                selectedDesignCategory={draft.selectedDesignCategory}
                pricingSource={draft.pricingSource}
                areaScope={draft.areaScope}
                onPricingSourceChange={(value) => {
                  setBookingError(null);
                  setField("pricingSource", value);
                  setField("selectedDesignId", "");
                  setField("selectedDesignCategory", "");
                  if (value === "custom_request") {
                    resetCustomPathState("");
                    setField("areaScope", "");
                  } else {
                    setField("areaScope", "");
                    setField("requestType", "");
                    setField("largeAreaCoverage", "");
                    setField("wideAreaTarget", "");
                    setField("bodyAreaGroup", "");
                    setField("bodyAreaDetail", "");
                    setField("selectedSizeCm", null);
                    setField("inferredSizeCm", null);
                    setField("isSizeExplicit", false);
                    setField("approximateSizeCm", null);
                    setField("sizeCategory", "");
                    setField("colorMode", "");
                    setField("workStyle", "");
                    setField("realismLevel", "");
                    setField("layoutStyle", "");
                    setField("coverUp", null);
                  }
                }}
                onAreaScopeChange={(value) => {
                  setField("pricingSource", "custom_request");
                  setField("selectedDesignCategory", "");
                  setField("areaScope", value);
                  resetCustomPathState(value);
                  if (value === "unsure") {
                    setField("bodyAreaGroup", "");
                    setField("bodyAreaDetail", "");
                    setField("selectedSizeCm", null);
                    setField("inferredSizeCm", null);
                    setField("isSizeExplicit", false);
                  }
                }}
                onDesignCategoryChange={(value) => {
                  setField("pricingSource", "featured_design");
                  setField("selectedDesignCategory", value);
                  setField("selectedDesignId", "");
                  setField("colorMode", "");
                }}
                onDesignSelect={(designId) => {
                  if (!designId) {
                    setField("pricingSource", "featured_design");
                    setField("selectedDesignId", "");
                    setField("colorMode", "");
                    return;
                  }
                  const design = activeDesigns.find((item) => item.id === designId) ?? null;
                  setField("pricingSource", "featured_design");
                  setField("areaScope", "");
                  setField("selectedDesignCategory", design?.category ?? draft.selectedDesignCategory);
                  setField("selectedDesignId", designId);
                  setField("requestType", "");
                  setField("largeAreaCoverage", "");
                  setField("wideAreaTarget", "");
                  setField("bodyAreaGroup", "");
                  setField("bodyAreaDetail", "");
                  setField("selectedSizeCm", null);
                  setField("inferredSizeCm", null);
                  setField("isSizeExplicit", false);
                  setField("approximateSizeCm", null);
                  setField("sizeCategory", "");
                  setField("colorMode", "");
                  setField("workStyle", "");
                  setField("realismLevel", "");
                  setField("layoutStyle", "");
                  setField("coverUp", null);
                }}
              />
            ) : null}

            {currentFlowStep === "request_type" ? (
              <RequestTypeSelectionStep
                locale={locale}
                requestType={draft.requestType}
                onRequestTypeChange={(value) => {
                  setField("requestType", value);
                  setField("coverUp", value === "cover_up");
                }}
              />
            ) : null}

            {currentFlowStep === "placement" ? (
              <BodyPlacementSelector
                selectedDetail={draft.bodyAreaDetail}
                areaScope={draft.areaScope}
                locale={locale}
                onSelect={(group, detail) => {
                  setField("bodyAreaGroup", group);
                  setField("bodyAreaDetail", detail);

                  if (!detail) {
                    setField("largeAreaCoverage", "");
                    setField("selectedSizeCm", null);
                    setField("inferredSizeCm", null);
                    setField("isSizeExplicit", false);
                    setField("approximateSizeCm", null);
                    setField("sizeCategory", "");
                    return;
                  }

                  if (draft.areaScope === "large_single_area") {
                    setField("largeAreaCoverage", "");
                    setField("selectedSizeCm", null);
                    setField("inferredSizeCm", null);
                    setField("isSizeExplicit", false);
                    setField("approximateSizeCm", null);
                    setField("sizeCategory", "");
                    return;
                  }

                  setField("selectedSizeCm", null);
                  setField("inferredSizeCm", null);
                  setField("isSizeExplicit", false);
                  setField("approximateSizeCm", null);
                  setField("sizeCategory", "");
                }}
              />
            ) : null}

            {currentFlowStep === "large_coverage" ? (
              <div
                className="rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor: "var(--artist-section-surface-strong)",
                }}
                >
                <p className="text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {copy.largeAreaCoverageHelp}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {largeAreaCoverageChoices.map((option) => {
                    const active = draft.largeAreaCoverage === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (!draft.bodyAreaDetail) {
                            return;
                          }
                          const sizeCm = getLargeAreaSize(draft.bodyAreaDetail, option.value);
                          setField("largeAreaCoverage", option.value);
                          setField("selectedSizeCm", null);
                          setField("inferredSizeCm", sizeCm);
                          setField("isSizeExplicit", false);
                          setField("approximateSizeCm", sizeCm);
                          setField("sizeCategory", deriveSizeCategoryFromCm(sizeCm));
                        }}
                        className="rounded-[22px] border px-4 py-4 text-left transition"
                        style={{
                          borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                          backgroundColor: active
                            ? "var(--artist-selected-surface)"
                            : "var(--artist-section-surface)",
                          color: "var(--artist-card-text)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{option.label}</p>
                          {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentFlowStep === "wide_area_target" ? (
              <div
                className="rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor: "var(--artist-section-surface-strong)",
                }}
              >
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                  {copy.wideAreaTargetTitle}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {copy.wideAreaTargetDescription}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {wideAreaChoices.map((option) => {
                    const active = draft.wideAreaTarget === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => applyWideAreaTarget(option.value)}
                        className="rounded-[22px] border px-4 py-4 text-left transition"
                        style={{
                          borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                          backgroundColor: active
                            ? "var(--artist-selected-surface)"
                            : "var(--artist-section-surface)",
                          color: "var(--artist-card-text)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{option.label}</p>
                          {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentFlowStep === "size" ? (
              <SizeEstimationSelector
                selectedPlacement={draft.bodyAreaDetail}
                selectedSizeCm={draft.selectedSizeCm}
                locale={locale}
                onApproximateSizeChange={(cm) => {
                  setField("selectedSizeCm", cm);
                  setField("inferredSizeCm", null);
                  setField("isSizeExplicit", true);
                  setField("approximateSizeCm", cm);
                  setField("sizeCategory", deriveSizeCategoryFromCm(cm));
                }}
              />
            ) : null}

            {currentFlowStep === "color_only" || currentFlowStep === "color_character" ? (
              <div className="space-y-3">
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "var(--artist-section-surface-strong)",
                  }}
                  >
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                      {copy.colorModeTitle}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.colorModeHelp}
                    </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {colorChoices.map((option) => {
                          const active = draft.colorMode === option.value;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => {
                                setField("colorMode", option.value);
                              }}
                          className="rounded-[22px] border px-4 py-4 text-left transition"
                          style={{
                            borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                            backgroundColor: active
                              ? "var(--artist-selected-surface)"
                              : "var(--artist-section-surface)",
                            color: tokens.cardText,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium">
                              {draft.pricingSource === "featured_design"
                                ? copy.featuredColorModes[option.labelKey]
                                : copy.colorModes[option.labelKey]}
                            </p>
                            {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {currentFlowStep === "color_character" && draft.pricingSource === "custom_request" ? (
                  <>
                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "var(--artist-section-surface-strong)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.intensityTitle}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                        {copy.intensityDescription}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {intensityChoices.map((option) => {
                          const active =
                            option.value === "advanced"
                              ? draft.workStyle === "shaded_detailed" && draft.realismLevel === "advanced"
                              : draft.workStyle === option.value && draft.realismLevel !== "advanced";

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                if (option.value === "advanced") {
                                  setField("workStyle", "shaded_detailed");
                                  setField("realismLevel", "advanced");
                                  return;
                                }

                                setField("workStyle", option.value);
                                setField("realismLevel", "");
                              }}
                              className="rounded-[22px] border px-4 py-4 text-left transition"
                              style={{
                                borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                                backgroundColor: active
                                  ? "var(--artist-selected-surface)"
                                  : "var(--artist-section-surface)",
                                color: tokens.cardText,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{option.label}</p>
                                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                                    {copy.intensityDescriptions[option.value]}
                                  </p>
                                </div>
                                {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "var(--artist-section-surface-strong)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.layoutTitle}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                        {copy.layoutDescription}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {layoutChoices.map((option) => {
                          const active = draft.layoutStyle === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setField("layoutStyle", option.value)}
                              className="rounded-[22px] border px-4 py-4 text-left transition"
                              style={{
                                borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                                backgroundColor: active
                                  ? "var(--artist-selected-surface)"
                                  : "var(--artist-section-surface)",
                                color: tokens.cardText,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium">{option.label}</p>
                                  {copy.layoutDescriptions[option.value] ? (
                                    <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                                      {copy.layoutDescriptions[option.value]}
                                    </p>
                                  ) : null}
                                </div>
                                {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            {currentFlowStep === "extras" ? (
              <div className="space-y-3">
                {selectedDesign ? (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "var(--artist-section-surface-strong)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                      {copy.summaryLabels.selectedDesign}
                    </p>
                    <p className="mt-2 text-base font-medium" style={{ color: "var(--artist-card-text)" }}>
                      {selectedDesign.title}
                    </p>
                  </div>
                ) : null}

                {draft.pricingSource === "custom_request" && (draft.areaScope === "large_single_area" || draft.areaScope === "wide_area") ? (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "var(--artist-section-surface-strong)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                      {copy.coverUpTitle}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.coverUpDescription}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { value: true, label: copy.coverUpYes },
                        { value: false, label: copy.coverUpNo },
                      ].map((option) => {
                        const active = draft.coverUp === option.value;
                        return (
                          <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => setField("coverUp", option.value)}
                            className="rounded-[22px] border px-4 py-4 text-left transition"
                            style={{
                              borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                              backgroundColor: active
                                ? "var(--artist-selected-surface)"
                                : "var(--artist-section-surface)",
                              color: "var(--artist-card-text)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium">{option.label}</p>
                              {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "var(--artist-section-surface-strong)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                    {copy.referenceSectionTitle}
                  </p>
                  <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                    {copy.referenceSectionDescription}
                  </p>
                  <div className="mt-4 space-y-4">
                    {draft.pricingSource === "custom_request" ? (
                      <>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]">
                            {isUploadingReference ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                            {copy.referenceUpload}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void handleReferenceUpload(file);
                                }
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                          {draft.referenceImage ? (
                            <div className="size-14 overflow-hidden rounded-[16px] border border-white/10 bg-black/20">
                              <img src={draft.referenceImage} alt="Reference" className="h-full w-full object-cover" />
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                            {copy.referenceNote}
                          </span>
                          <Textarea
                            style={{
                              backgroundColor: "var(--artist-input-surface)",
                              borderColor: "var(--artist-border)",
                              color: "var(--artist-card-text)",
                            }}
                            value={draft.referenceDescription}
                            onChange={(event) => setField("referenceDescription", event.target.value)}
                            placeholder={copy.referencePlaceholder}
                          />
                        </div>
                      </>
                    ) : (
                      <Textarea
                        style={{
                          backgroundColor: "var(--artist-input-surface)",
                          borderColor: "var(--artist-border)",
                          color: "var(--artist-card-text)",
                        }}
                        value={draft.notes}
                        onChange={(event) => setField("notes", event.target.value)}
                        placeholder={copy.featuredNotePlaceholder}
                      />
                    )}
                  </div>
                </div>

                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "var(--artist-section-surface-strong)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                    {copy.customerInfo}
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                        {copy.gender}
                      </span>
                      <NativeSelect value={draft.gender} onChange={(event) => setField("gender", event.target.value as typeof draft.gender)}>
                        <option value="">{copy.genderPlaceholder}</option>
                        <option value="female">{copy.genders.female}</option>
                        <option value="male">{copy.genders.male}</option>
                        <option value="prefer_not_to_say">{copy.genders.prefer_not_to_say}</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                        {copy.ageRange}
                      </span>
                      <NativeSelect value={draft.ageRange} onChange={(event) => setField("ageRange", event.target.value as typeof draft.ageRange)}>
                        <option value="">{copy.ageRangePlaceholder}</option>
                        <option value="18-24">{copy.ageRanges["18-24"]}</option>
                        <option value="25-34">{copy.ageRanges["25-34"]}</option>
                        <option value="35-44">{copy.ageRanges["35-44"]}</option>
                        <option value="45+">{copy.ageRanges["45+"]}</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                        {copy.allergy}
                      </span>
                      <NativeSelect
                        value={
                          draft.hasAllergy === null ? "" : draft.hasAllergy ? "yes" : "no"
                        }
                        onChange={(event) =>
                          setField(
                            "hasAllergy",
                            event.target.value === ""
                              ? null
                              : event.target.value === "yes",
                          )
                        }
                      >
                        <option value="">{copy.genderPlaceholder}</option>
                        <option value="yes">{copy.yes}</option>
                        <option value="no">{copy.no}</option>
                      </NativeSelect>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                        {copy.chronicCondition}
                      </span>
                      <NativeSelect
                        value={
                          draft.hasChronicCondition === null
                            ? ""
                            : draft.hasChronicCondition
                              ? "yes"
                              : "no"
                        }
                        onChange={(event) =>
                          {
                            const nextValue =
                              event.target.value === ""
                                ? null
                                : event.target.value === "yes";
                            setField("hasChronicCondition", nextValue);
                            if (nextValue !== true) {
                              setField("chronicConditionDetails", "");
                            }
                          }
                        }
                      >
                        <option value="">{copy.genderPlaceholder}</option>
                        <option value="yes">{copy.yes}</option>
                        <option value="no">{copy.no}</option>
                      </NativeSelect>
                    </div>
                    {draft.hasChronicCondition ? (
                      <div className="space-y-2 sm:col-span-2">
                        <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                          {copy.chronicConditionDetails}
                        </span>
                        <Input
                          value={draft.chronicConditionDetails}
                          onChange={(event) => setField("chronicConditionDetails", event.target.value)}
                          placeholder={copy.chronicConditionPlaceholder}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                {requiresBookingSelection ? (
                  <div className="grid gap-3">
                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "var(--artist-section-surface-strong)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.cityTitle}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                        {copy.cityDescription}
                      </p>
                      <div className="mt-4">
                        <NativeSelect
                          value={draft.city}
                          onChange={(event) => {
                            setField("city", event.target.value);
                            setField("preferredStartDate", "");
                            setField("preferredEndDate", "");
                            setBookingError(null);
                          }}
                        >
                          <option value="">{copy.cityPlaceholder}</option>
                          {bookingCities.map((city) => (
                            <option key={city.id} value={city.cityName}>
                              {city.cityName}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                    </div>

                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "var(--artist-section-surface-strong)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {bookingMode === "range" ? copy.timingRangeTitle : copy.timingTitle}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                        {bookingMode === "range" ? copy.timingRangeDescription : copy.timingDescription}
                      </p>
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant={bookingMode === "single" ? "secondary" : "outline"} onClick={() => setBookingMode("single")}>
                            {copy.timingSingle}
                          </Button>
                          <Button type="button" size="sm" variant={bookingMode === "range" ? "secondary" : "outline"} onClick={() => setBookingMode("range")}>
                            {copy.timingRange}
                          </Button>
                        </div>

                        {bookingMode === "single" ? (
                          <div className="space-y-2">
                            <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                              {copy.startDate}
                            </span>
                            <DateCalendarPopover
                              locale={locale}
                              mode="single"
                              disabled={!draft.city || availableDatesForSelectedCity.length === 0}
                              triggerLabel={copy.timingTitle}
                              emptyLabel={copy.startDate}
                              selectedDate={draft.preferredStartDate}
                              availableDates={availableDatesForSelectedCity}
                              onSelectDate={(date) => {
                                setField("preferredStartDate", date);
                                setField("preferredEndDate", "");
                                setBookingError(null);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                                {copy.startDate}
                              </span>
                              <DateCalendarPopover
                                locale={locale}
                                mode="single"
                                disabled={!draft.city || availableDatesForSelectedCity.length === 0}
                                triggerLabel={copy.timingTitle}
                                emptyLabel={copy.startDate}
                                selectedDate={draft.preferredStartDate}
                                availableDates={availableDatesForSelectedCity}
                                onSelectDate={(date) => {
                                  setField("preferredStartDate", date);
                                  if (draft.preferredEndDate && draft.preferredEndDate < date) {
                                    setField("preferredEndDate", "");
                                  }
                                  setBookingError(null);
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                                {copy.endDate}
                              </span>
                              <DateCalendarPopover
                                locale={locale}
                                mode="single"
                                disabled={!draft.city || !draft.preferredStartDate || availableDatesForSelectedCity.length === 0}
                                triggerLabel={copy.timingTitle}
                                emptyLabel={copy.endDate}
                                selectedDate={draft.preferredEndDate}
                                availableDates={availableDatesForSelectedCity.filter((date) => date >= draft.preferredStartDate)}
                                onSelectDate={(date) => {
                                  setField("preferredEndDate", date);
                                  setBookingError(null);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {draft.city && availableDatesForSelectedCity.length === 0 ? (
                        <p className="mt-3 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                          {copy.noDates}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === resultStep && submitting ? (
              <div
                className="rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--artist-border)",
                    backgroundColor: "var(--artist-section-surface-strong)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--artist-primary) 14%, transparent)", color: "var(--artist-primary)" }}>
                    <LoaderCircle className="size-5 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium" style={{ color: "var(--artist-card-text)" }}>
                      {copy.calculatingTitle}
                    </p>
                    <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.calculatingBody}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {step === resultStep && result ? (
              <div className="space-y-4 sm:space-y-5">
                <div
                  className="rounded-[24px] border p-4 sm:rounded-[28px] sm:p-5"
                  style={{
                    borderColor: "color-mix(in srgb, var(--artist-primary) 28%, transparent)",
                    backgroundColor: "var(--artist-selected-surface)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 size-5" style={{ color: "var(--artist-primary)" }} />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.2em]" style={{ color: "var(--artist-primary)" }}>
                        {result.estimateAvailable && result.estimateMode
                          ? copy.resultTitles[result.estimateMode]
                          : copy.noEstimateTitle}
                      </p>
                      {result.estimateAvailable && result.displayLabel ? (
                        <p className="mt-2 break-words text-[1.75rem] leading-tight sm:text-4xl" style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}>
                          {result.displayLabel}
                        </p>
                      ) : (
                        <p className="mt-2 max-w-[42ch] text-sm leading-6 sm:text-base" style={{ color: "var(--artist-card-text)" }}>
                          {copy.noEstimateBody}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "var(--artist-section-surface-strong)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                    {copy.summaryTitle}
                  </p>
                  <div className="mt-3 space-y-2">
                    {resultSummaryItems.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 text-sm">
                        <span style={{ color: "var(--artist-card-muted)" }}>{item.label}</span>
                        <span className="text-right" style={{ color: "var(--artist-card-text)" }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {result.estimateAvailable ? (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "var(--artist-section-surface-strong)",
                    }}
                  >
                    <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.pricingBreakdownNote}
                    </p>
                  </div>
                ) : null}
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "var(--artist-section-surface-strong)",
                  }}
                >
                  <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                    {result.estimateAvailable ? copy.resultDisclaimerPrimary : result.disclaimer}
                  </p>
                  {result.estimateAvailable ? (
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.resultDisclaimerSecondary}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2.5 sm:gap-3">
                  <Button asChild className="w-full">
                    <a
                      href={result.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: "var(--artist-primary-button-surface)",
                        borderColor: "var(--artist-primary-button-border)",
                        color: "var(--artist-primary-button-text)",
                        boxShadow: "var(--artist-button-shadow)",
                      }}
                      className="rounded-[var(--artist-button-radius)] border"
                    >
                      <MessageCircle className="size-4" />
                      {copy.sendWhatsapp}
                    </a>
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={copyMessage}>
                    {copyState === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copyState === "copied" ? copy.copied : copy.copyMessage}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      reset();
                      setBookingMode("single");
                    }}
                  >
                    {copy.restart}
                  </Button>
                </div>
              </div>
            ) : null}

            {step < resultStep ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {bookingError}
                </div>
                <div className="flex items-center gap-2 self-end">
                  {step > 1 ? (
                    <Button type="button" variant="ghost" onClick={() => setStep(Math.max(1, step - 1))}>
                      <ArrowLeft className="size-4" />
                      {copy.back}
                    </Button>
                  ) : null}
                  {step < lastInteractiveStep ? (
                    <Button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance}>
                      {copy.continue}
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleFinalSubmit} disabled={!canSubmit}>
                      {primaryActionLabel}
                      <ArrowRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
