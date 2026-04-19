"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Copy, ImagePlus, LoaderCircle, MessageCircle, Sparkles } from "lucide-react";

import { IntentSelectionStep } from "@/components/funnel/intent-selection-step";
import { BodyPlacementSelector } from "@/components/funnel/body-placement-selector";
import { SizeEstimationSelector } from "@/components/funnel/size-estimation-selector";
import { AvatarTile } from "@/components/shared/avatar-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateCalendarPopover } from "@/components/ui/date-calendar-popover";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { deriveSizeCategoryFromCm, getPlacementSizeConstraint } from "@/lib/constants/size-estimation";
import { getPlacementDetailLocaleLabel, type PublicLocale } from "@/lib/i18n/public";
import { getRequestTypeLabel } from "@/lib/pricing/v2/output";
import { uploadPublicReferenceImage } from "@/lib/supabase/storage";
import { buildThemeStyles } from "@/lib/theme";
import type { ArtistPageData, ColorModeValue, PricingSourceValue } from "@/lib/types";
import { useFunnelStore } from "@/store/funnel-store";

type SubmissionResponse = {
  estimatedMin: number;
  estimatedMax: number;
  estimateMode: "range" | "soft_range" | "starting_from";
  displayLabel: string;
  summary: string;
  disclaimer: string;
  whatsappLink: string;
  message: string;
};

function getCopy(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      stepLabel: "Adım",
      heroCta: "Fiyat tahmini al",
      stepTitles: {
        1: "Ne yaptırmak istiyorsun?",
        2: "Nereye yapılacak?",
        3: "Yaklaşık boyut kaç cm?",
        4: "Renk olacak mı?",
        5: "Birkaç son bilgi",
        6: "Tahminin hazır",
      },
      stepDescriptions: {
        1: "Sana en yakın seçeneği işaretle.",
        2: "Önce genel bölgeyi, sonra tam yeri seç.",
        3: "Yaklaşık boyutu cm olarak seç.",
        4: "Fiyatı etkileyen renk yapısını seç.",
        5: "İstersen görsel, kısa not, şehir ve zamanı ekle.",
        6: "",
      },
      colorTitleCustom: "Renk olacak mı?",
      colorTitleFeatured: "Renk aynı mı kalsın?",
      colorDescriptionCustom: "Bu seçim başlangıç fiyatını etkiler.",
      colorDescriptionFeatured: "Özel değişiklik gerekiyorsa bunu dövmeciyle daha sonra konuşabilirsin.",
      colorModes: {
        "black-only": "Sadece siyah",
        "black-grey": "Siyah-gri",
        "full-color": "Renkli",
        same: "Aynı kalsın",
      },
      continue: "Devam",
      back: "Geri",
      submit: "Tahmini gör",
      uploading: "Yükleniyor",
      referenceTitle: "Referans görseli veya kısa not",
      referenceUpload: "Referans yükle",
      referenceNote: "Kısa not",
      referencePlaceholder: "Örn. ince çizgi bir gül, küçük ve sade.",
      extraNotes: "Ek not",
      extraNotesPlaceholder: "Varsa eklemek istediğin kısa bir not yazabilirsin.",
      cityTitle: "Şehir",
      cityPlaceholder: "Şehir seç",
      timingTitle: "Uygun olduğun zaman",
      timingSingle: "Tek gün",
      timingRange: "Tarih aralığı",
      startDate: "Başlangıç tarihi",
      endDate: "Bitiş tarihi",
      noDates: "Bu şehir için seçilebilir tarih görünmüyor.",
      customerInfo: "İstersen birkaç bilgi daha",
      gender: "Cinsiyet",
      genderPlaceholder: "Seçmek istersen",
      ageRange: "Yaş aralığı",
      ageRangePlaceholder: "Seçmek istersen",
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
        range: "Tahmini başlangıç aralığı",
        soft_range: "Yaklaşık bant",
        starting_from: "Başlangıç fiyatı",
      },
      summaryTitle: "Seçim özeti",
      summaryLabels: {
        requestType: "Talep tipi",
        selectedDesign: "Tasarım",
        placement: "Yerleşim",
        size: "Boyut",
        color: "Renk",
      },
      sendWhatsapp: "WhatsApp ile gönder",
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
    stepTitles: {
      1: "What do you want to get?",
      2: "Where will it go?",
      3: "About how many cm?",
      4: "Will there be color?",
      5: "A few final details",
      6: "Your estimate is ready",
    },
    stepDescriptions: {
      1: "Pick the option that feels closest.",
      2: "Choose the general area first, then the exact spot.",
      3: "Choose the approximate size in cm.",
      4: "Pick the color direction that affects the starting price.",
      5: "You can add a reference, a short note, city, and timing.",
      6: "",
    },
    colorTitleCustom: "Will there be color?",
    colorTitleFeatured: "Will the color stay the same?",
    colorDescriptionCustom: "This helps shape the starting estimate.",
    colorDescriptionFeatured: "If you want a custom change, you can discuss it with the artist later.",
    colorModes: {
      "black-only": "Black only",
      "black-grey": "Black and grey",
      "full-color": "Color",
      same: "Keep it the same",
    },
    continue: "Continue",
    back: "Back",
    submit: "See estimate",
    uploading: "Uploading",
    referenceTitle: "Reference image or short note",
    referenceUpload: "Upload reference",
    referenceNote: "Short note",
    referencePlaceholder: "For example: a fine-line rose, small and simple.",
    extraNotes: "Extra note",
    extraNotesPlaceholder: "Add a short note if there is anything else to mention.",
    cityTitle: "City",
    cityPlaceholder: "Choose city",
    timingTitle: "When are you available?",
    timingSingle: "Single day",
    timingRange: "Date range",
    startDate: "Start date",
    endDate: "End date",
    noDates: "There are no selectable dates for this city right now.",
    customerInfo: "A few optional details",
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
    summaryTitle: "Summary",
    summaryLabels: {
      requestType: "Request type",
      selectedDesign: "Design",
      placement: "Placement",
      size: "Size",
      color: "Color",
    },
    sendWhatsapp: "Send via WhatsApp",
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

function getFeaturedColorOptions(referenceColorMode: ColorModeValue) {
  const options: Array<{ key: string; value: ColorModeValue; labelKey: "same" | ColorModeValue }> = [
    { key: "same", value: referenceColorMode, labelKey: "same" },
  ];
  const fallbacks: ColorModeValue[] = ["black-grey", "full-color", "black-only"];

  for (const candidate of fallbacks) {
    if (candidate !== referenceColorMode) {
      options.push({ key: candidate, value: candidate, labelKey: candidate });
    }

    if (options.length === 3) {
      break;
    }
  }

  return options;
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
  const compactArtistHeader = step > 1 || Boolean(draft.pricingSource);
  const { tokens } = buildThemeStyles(artist.pageTheme);
  const resultStep = 6;
  const currentTitle = copy.stepTitles[step as 1 | 2 | 3 | 4 | 5 | 6];
  const currentDescription = copy.stepDescriptions[step as 1 | 2 | 3 | 4 | 5 | 6];
  const displayProgress = (Math.min(step, 5) / 5) * 100;
  const colorChoices =
    draft.pricingSource === "featured_design" && selectedDesign
      ? getFeaturedColorOptions(selectedDesign.referenceColorMode ?? "black-only")
      : [
          { key: "black-only", value: "black-only" as ColorModeValue, labelKey: "black-only" as const },
          { key: "black-grey", value: "black-grey" as ColorModeValue, labelKey: "black-grey" as const },
          { key: "full-color", value: "full-color" as ColorModeValue, labelKey: "full-color" as const },
        ];

  const canAdvance =
    (step === 1 &&
      Boolean(
        draft.pricingSource &&
          (draft.pricingSource === "featured_design" ? draft.selectedDesignId : draft.requestType),
      )) ||
    (step === 2 && Boolean(draft.bodyAreaGroup && draft.bodyAreaDetail)) ||
    (step === 3 && Boolean(draft.approximateSizeCm && draft.sizeCategory)) ||
    (step === 4 && Boolean(draft.colorMode)) ||
    step === 5;

  const resultSummaryItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];

    if (draft.pricingSource === "featured_design" && selectedDesign) {
      items.push({ label: copy.summaryLabels.selectedDesign, value: selectedDesign.title });
    }

    if (draft.pricingSource === "custom_request" && draft.requestType) {
      items.push({ label: copy.summaryLabels.requestType, value: getRequestTypeLabel(draft.requestType, locale) });
    }

    if (draft.bodyAreaDetail) {
      items.push({
        label: copy.summaryLabels.placement,
        value: getPlacementDetailLocaleLabel(draft.bodyAreaDetail, locale),
      });
    }

    if (draft.approximateSizeCm) {
      items.push({
        label: copy.summaryLabels.size,
        value: `${draft.approximateSizeCm} cm`,
      });
    }

    if (draft.colorMode) {
      const sameColorMode = selectedDesign?.referenceColorMode ?? "black-only";
      const colorLabel =
        draft.pricingSource === "featured_design" && draft.colorMode === sameColorMode
          ? copy.colorModes.same
          : copy.colorModes[draft.colorMode];
      items.push({ label: copy.summaryLabels.color, value: colorLabel });
    }

    return items;
  }, [copy.colorModes, copy.summaryLabels.color, copy.summaryLabels.placement, copy.summaryLabels.requestType, copy.summaryLabels.selectedDesign, copy.summaryLabels.size, draft.approximateSizeCm, draft.bodyAreaDetail, draft.colorMode, draft.pricingSource, draft.requestType, locale, selectedDesign]);

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
      approximateSizeCm: draft.approximateSizeCm ?? null,
      sizeCategory: draft.sizeCategory,
      widthCm: null,
      heightCm: null,
      colorMode: draft.colorMode || undefined,
      referenceImage: draft.referenceImage || null,
      referenceImagePath: draft.referenceImagePath || null,
      referenceDescription: draft.referenceDescription || undefined,
      city: draft.city || undefined,
      preferredStartDate: draft.preferredStartDate || undefined,
      preferredEndDate: bookingMode === "range" ? draft.preferredEndDate || undefined : undefined,
      gender: draft.gender || undefined,
      ageRange: draft.ageRange || undefined,
      style: "custom",
      notes: draft.notes || undefined,
      coverUp: draft.requestType === "cover_up",
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
        setStep(5);
        return;
      }

      setResult({
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
      setStep(5);
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
        className={`${compactArtistHeader ? "sticky top-2 z-20 overflow-hidden" : "overflow-hidden"} w-full min-w-0 max-w-full overflow-x-clip`}
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor:
            "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
          borderRadius: "var(--artist-radius)",
        }}
      >
        {compactArtistHeader ? (
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <AvatarTile
                name={artist.profile.artistName}
                imageUrl={artist.profile.profileImageUrl}
                planType={artist.profile.planType}
              />
              <div className="min-w-0">
                <p className="truncate text-base sm:text-lg" style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}>
                  {artist.profile.artistName}
                </p>
                <p className="truncate text-xs sm:text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {artist.profile.instagramHandle}
                </p>
              </div>
            </div>
          </CardContent>
        ) : (
          <>
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
                  <h1 className="text-[1.55rem] leading-tight sm:text-3xl" style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}>
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
          </>
        )}
      </Card>

      <div ref={flowCardRef}>
        <Card
          className="w-full min-w-0 max-w-full overflow-x-clip"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor:
              "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
            borderRadius: "var(--artist-radius)",
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
                  backgroundColor: "color-mix(in srgb, var(--artist-card) 88%, white 12%)",
                  borderColor: "var(--artist-border)",
                }}
              >
                {copy.stepLabel} {Math.min(step, 6)} / 6
              </Badge>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6 sm:mt-4 sm:h-2">
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
            {step === 1 ? (
              <IntentSelectionStep
                locale={locale}
                designs={activeDesigns}
                selectedDesignId={draft.selectedDesignId}
                pricingSource={draft.pricingSource}
                requestType={draft.requestType}
                onPricingSourceChange={(value) => {
                  setBookingError(null);
                  setField("pricingSource", value);
                  setField("selectedDesignId", "");
                  setField("requestType", "");
                  setField("colorMode", "");
                }}
                onRequestTypeChange={(value) => {
                  setField("requestType", value);
                  setField("pricingSource", "custom_request");
                }}
                onDesignSelect={(designId) => {
                  const design = activeDesigns.find((item) => item.id === designId) ?? null;
                  setField("pricingSource", "featured_design");
                  setField("selectedDesignId", designId);
                  setField("requestType", "");
                  setField("colorMode", design?.referenceColorMode ?? "black-only");
                }}
              />
            ) : null}

            {step === 2 ? (
              <BodyPlacementSelector
                selectedDetail={draft.bodyAreaDetail}
                locale={locale}
                onSelect={(group, detail) => {
                  setField("bodyAreaGroup", group);
                  setField("bodyAreaDetail", detail);

                  if (!detail) {
                    setField("approximateSizeCm", null);
                    setField("sizeCategory", "");
                    return;
                  }

                  const defaultSize = getPlacementSizeConstraint(detail).defaultCm;
                  setField("approximateSizeCm", defaultSize);
                  setField("sizeCategory", deriveSizeCategoryFromCm(defaultSize));
                }}
              />
            ) : null}

            {step === 3 ? (
              <SizeEstimationSelector
                selectedPlacement={draft.bodyAreaDetail}
                approximateSizeCm={draft.approximateSizeCm}
                sizeTimeRanges={artist.pricingRules.sizeTimeRanges}
                locale={locale}
                onApproximateSizeChange={(cm) => {
                  setField("approximateSizeCm", cm);
                  setField("sizeCategory", deriveSizeCategoryFromCm(cm));
                }}
              />
            ) : null}

            {step === 4 ? (
              <div
                className="rounded-[24px] border p-4"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor: "rgba(0,0,0,0.12)",
                }}
              >
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                  {draft.pricingSource === "featured_design" ? copy.colorTitleFeatured : copy.colorTitleCustom}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {draft.pricingSource === "featured_design" ? copy.colorDescriptionFeatured : copy.colorDescriptionCustom}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {colorChoices.map((option) => {
                    const active = draft.colorMode === option.value;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setField("colorMode", option.value)}
                        className="rounded-[22px] border px-4 py-4 text-left transition"
                        style={{
                          borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                          backgroundColor: active
                            ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                            : "rgba(0,0,0,0.12)",
                          color: tokens.cardText,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium">{copy.colorModes[option.labelKey]}</p>
                          {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-3">
                {selectedDesign ? (
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "rgba(0,0,0,0.12)",
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

                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "rgba(0,0,0,0.12)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                    {copy.referenceTitle}
                  </p>
                  <div className="mt-4 space-y-4">
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
                    <Textarea
                      style={{
                        backgroundColor: "rgba(0,0,0,0.12)",
                        borderColor: "var(--artist-border)",
                        color: "var(--artist-card-text)",
                      }}
                      value={draft.referenceDescription}
                      onChange={(event) => setField("referenceDescription", event.target.value)}
                      placeholder={copy.referencePlaceholder}
                    />
                    <Textarea
                      style={{
                        backgroundColor: "rgba(0,0,0,0.12)",
                        borderColor: "var(--artist-border)",
                        color: "var(--artist-card-text)",
                      }}
                      value={draft.notes}
                      onChange={(event) => setField("notes", event.target.value)}
                      placeholder={copy.extraNotesPlaceholder}
                    />
                  </div>
                </div>

                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "rgba(0,0,0,0.12)",
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
                  </div>
                </div>

                {requiresBookingSelection ? (
                  <div className="grid gap-3">
                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "rgba(0,0,0,0.12)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.cityTitle}
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
                        backgroundColor: "rgba(0,0,0,0.12)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.timingTitle}
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
                  backgroundColor: "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
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
                    backgroundColor: "color-mix(in srgb, var(--artist-primary) 12%, transparent)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-1 size-5" style={{ color: "var(--artist-primary)" }} />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.2em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.resultTitles[result.estimateMode]}
                      </p>
                      <p className="mt-2 break-words text-[1.75rem] leading-tight sm:text-4xl" style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}>
                        {result.displayLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "rgba(0,0,0,0.12)",
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
                <div
                  className="rounded-[24px] border p-4"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor: "rgba(0,0,0,0.12)",
                  }}
                >
                  <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                    {result.disclaimer}
                  </p>
                  {draft.pricingSource === "featured_design" ? (
                    <p className="mt-2 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.featuredDisclaimer}
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
                        backgroundColor: "var(--artist-primary)",
                        color: "var(--artist-primary-foreground)",
                      }}
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
                  {step < 5 ? (
                    <Button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance}>
                      {copy.continue}
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleFinalSubmit}>
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
