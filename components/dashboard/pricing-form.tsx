"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, ArrowRight, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import colorMediumImage from "@/sample-tattoos/colour-medium.png";
import coloredButterflyImage from "@/sample-tattoos/coloured butterfly.png";
import daggerImage from "@/sample-tattoos/dagger.png";
import highDetailImage from "@/sample-tattoos/high.png";
import lowDetailImage from "@/sample-tattoos/low.png";
import mediumDetailImage from "@/sample-tattoos/medium.png";
import minimalLineworkImage from "@/sample-tattoos/minimal linework.png";
import realisticEyeImage from "@/sample-tattoos/realistic eye.png";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pricingSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import {
  buildValidationPreviewExamples,
  buildCalibrationSlots,
  buildInitialCalibrationDraft,
  buildPricingPayloadFromCalibrationDraft,
  CALIBRATION_QUESTIONS,
  isCalibrationReady,
  summarizeFinalValidationReview,
  updateCalibrationDraftRange,
  updateCalibrationValidationDraft,
  updateFinalValidationDraft,
  VALIDATION_SCENARIOS,
  type CalibrationDraft,
} from "@/lib/pricing/calibration-flow";
import type {
  ArtistPricingRules,
  ArtistStyleOption,
  PricingValidationStatus,
  PricingValidationExampleId,
  PricingValidationFeedback,
} from "@/lib/types";

const calibrationImages: Record<"low" | "medium" | "high" | "color", StaticImageData> = {
  low: lowDetailImage,
  medium: mediumDetailImage,
  high: highDetailImage,
  color: colorMediumImage,
};

const validationImages: Record<
  "minimal-linework" | "ornamental-dagger" | "realistic-eye" | "colored-butterfly",
  StaticImageData
> = {
  "minimal-linework": minimalLineworkImage,
  "ornamental-dagger": daggerImage,
  "realistic-eye": realisticEyeImage,
  "colored-butterfly": coloredButterflyImage,
};

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat kalibrasyonu",
      description: "Tattix’e örnek fiyatlar ver. Sistem fiyat modelini buna göre kursun.",
      openingPrice: "Başlangıç fiyatın",
      openingPriceHelp: "Küçük ve standart bir dövmeyi genelde kaçtan başlatıyorsun?",
      openingPriceNote: "Bu değer modelin taban fiyatı olur.",
      summaryTitle: "Kalibrasyon özeti",
      summaryBody: "Fiyat modeli, açılış fiyatı ve kalibrasyon cevaplarından oluşur.",
      ready: "Kalibrasyon hazır.",
      notReady: "Kalibrasyon henüz tamamlanmadı.",
      start: "Kalibrasyonu başlat",
      edit: "Kalibrasyonu düzenle",
      close: "Daha sonra devam et",
      priceLabel: "Fiyat",
      maxLabel: "Üst sınır",
      maxHelp: "Boş bırakırsan tek fiyat olarak kaydederiz.",
      next: "Devam",
      back: "Geri",
      save: "Kalibrasyonu kaydet",
      saving: "Kaydediliyor",
      saveFailed: "Kalibrasyon kaydedilemedi.",
      saved: "Kalibrasyon kaydedildi.",
      invalid: "Bu sorunun fiyatını girmen gerekiyor.",
      stepLabel: "Adım",
      questionLabel: "Soru",
      sizeStep: "Boyut kalibrasyonu",
      detailStep: "Detay kalibrasyonu",
      placementStep: "Bölge kalibrasyonu",
      colorStep: "Renk kalibrasyonu",
      sizeQuestion8: "Bu dövme yaklaşık 8 cm olsaydı kaç ₺ fiyatlarsın?",
      sizeQuestion12: "12 cm olsaydı kaç ₺ fiyatlarsın?",
      sizeQuestion18: "18 cm olsaydı kaç ₺ fiyatlarsın?",
      sizeQuestion25: "25 cm olsaydı kaç ₺ fiyatlarsın?",
      detailQuestionLow: "Bu dövmeyi bu detay seviyesinde yaklaşık kaç ₺ fiyatlarsın?",
      detailQuestionMedium: "Bu seviyede kaç ₺ olur?",
      detailQuestionHigh: "Bu kadar detaylı olursa kaç ₺ olur?",
      placementQuestionEasy: "Bu dövme kolay bir bölgede (örneğin ön kol) olsa kaç ₺ olur?",
      placementQuestionHard: "Zor bir bölgede (örneğin kaburga, boyun, el) olsa kaç ₺ olur?",
      colorQuestionBlack: "Siyah hali kaç ₺ olur?",
      colorQuestionColor: "Renkli hali kaç ₺ olur?",
      sizeAssumption: "Varsayım: siyah, orta detay, standart bölge, özel tasarım yok, kapatma yok.",
      detailAssumption: "Boyut sabit kabul edilir. Sadece detay seviyesi değişir.",
      placementAssumption: "Boyut ve dövme benzer kalır. Sadece bölge zorluğu değişir.",
      colorAssumption: "Boyut ve detay aynı kalır. Sadece renk farkı ölçülür.",
      referenceTitle: "Kullanılan referans",
      referenceHelp: "Bu görsel yer tutucu değil; senin verdiğin örnek görseller kullanılıyor. İleride kolayca değiştirilebilir.",
      finalCheckTitle: "Son kontrol",
      finalCheckIntro:
        "Son bir kontrol yapalım. Aşağıdaki örnek dövmeler için oluşturduğum tahmini fiyat aralıklarının sana ne kadar uygun göründüğünü seç.",
      finalCheckReady: "Final kontrol tamamlandı.",
      finalCheckPending: "Final kontrol henüz tamamlanmadı.",
      finalCheckStart: "Son kontrolü başlat",
      finalCheckRestart: "Son kontrolü tekrar yap",
      finalCheckClose: "Daha sonra bakarım",
      previewRange: "Tahmini aralık",
      validationQuestion: "Bu tahmini fiyat aralığı sana ne kadar uygun görünüyor?",
      validationAdjusted: "Tahminleri biraz güncelledim. Aynı örnekleri bir kez daha kontrol edelim.",
      validationSaved: "Final kontrol kaydedildi.",
      validationNeedsReview: "Model hâlâ biraz ayar istiyor. Bu haliyle kaydettim.",
      scenarioSize: "Yaklaşık boyut",
      scenarioPlacement: "Bölge",
      scenario1: "Minimal linework · siyah",
      scenario2: "Ornamental dagger · siyah",
      scenario3: "Realistic eye · black & grey",
      scenario4: "Colored butterfly · renkli",
      statusPending: "Bekliyor",
      statusConfirmed: "Onaylandı",
      statusAdjusted: "Güncellendi",
      statusNoMajority: "Net bir çoğunluk yok",
      statusNeedsReview: "Bir tur daha manuel bakılmalı",
      looksRight: "Uygun",
      slightlyLow: "Biraz düşük",
      slightlyHigh: "Biraz yüksek",
      scaleLabel: "Genel ince ayar",
      scaleHelp: "Gerekirse tüm modeli az miktarda yukarı ya da aşağı taşı.",
      slotsTitle: "Hazır referans seti",
      slotsHelp: "Bu slotlar daha sonra senin seçeceğin son görsellerle değiştirilebilir.",
    };
  }

  return {
    title: "Pricing calibration",
    description: "Give Tattix sample prices so it can build the quote model.",
    openingPrice: "Opening price",
    openingPriceHelp: "What do you usually start a small, standard tattoo at?",
    openingPriceNote: "This becomes the anchor of the pricing model.",
    summaryTitle: "Calibration summary",
    summaryBody: "The model uses the opening price plus your calibration answers.",
    ready: "Calibration is ready.",
    notReady: "Calibration is not complete yet.",
    start: "Start calibration",
    edit: "Edit calibration",
    close: "Continue later",
    priceLabel: "Price",
    maxLabel: "Upper range",
    maxHelp: "Leave blank to save a single price.",
    next: "Next",
    back: "Back",
    save: "Save calibration",
    saving: "Saving",
    saveFailed: "Calibration could not be saved.",
    saved: "Calibration saved.",
    invalid: "Please enter a price for this question.",
    stepLabel: "Step",
    questionLabel: "Question",
    sizeStep: "Size calibration",
    detailStep: "Detail calibration",
    placementStep: "Placement calibration",
    colorStep: "Color calibration",
    sizeQuestion8: "If this tattoo were around 8 cm, what would you charge?",
    sizeQuestion12: "What would it be at 12 cm?",
    sizeQuestion18: "What would it be at 18 cm?",
    sizeQuestion25: "What would it be at 25 cm?",
    detailQuestionLow: "At this level of detail, what would you charge?",
    detailQuestionMedium: "What would it be at this level?",
    detailQuestionHigh: "What would it be if it were this detailed?",
    placementQuestionEasy: "If this tattoo were in an easy placement (like forearm), what would it be?",
    placementQuestionHard: "What would it be in a harder placement (like ribs, neck, hand)?",
    colorQuestionBlack: "What would the black version cost?",
    colorQuestionColor: "What would the colored version cost?",
    sizeAssumption: "Assume black ink, medium detail, standard placement, no custom design, no cover-up.",
    detailAssumption: "Size stays fixed. Only detail level changes.",
    placementAssumption: "Size and tattoo stay similar. Only placement difficulty changes.",
    colorAssumption: "Size and detail stay the same. Only color changes.",
    referenceTitle: "Reference used",
    referenceHelp: "These images are replaceable and can be swapped with your final calibration images later.",
    finalCheckTitle: "Final check",
    finalCheckIntro:
      "One final check. Review how believable these estimated quote ranges look for the example tattoos below.",
    finalCheckReady: "Final check completed.",
    finalCheckPending: "Final check has not been completed yet.",
    finalCheckStart: "Start final check",
    finalCheckRestart: "Run final check again",
    finalCheckClose: "Maybe later",
    previewRange: "Estimated range",
    validationQuestion: "How close does this estimated range feel to you?",
    validationAdjusted: "I updated the estimate slightly. Let's review the same examples once more.",
    validationSaved: "Final check saved.",
    validationNeedsReview: "The model still needs a quick manual review. This state was saved.",
    scenarioSize: "Approximate size",
    scenarioPlacement: "Placement",
    scenario1: "Minimal linework · black",
    scenario2: "Ornamental dagger · black",
    scenario3: "Realistic eye · black & grey",
    scenario4: "Colored butterfly · color",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusAdjusted: "Adjusted",
    statusNoMajority: "No clear majority",
    statusNeedsReview: "Needs review",
    looksRight: "Looks right",
    slightlyLow: "Slightly low",
    slightlyHigh: "Slightly high",
    scaleLabel: "Global fine-tune",
    scaleHelp: "Move the whole model slightly up or down if needed.",
    slotsTitle: "Prepared reference set",
    slotsHelp: "These slots can be replaced later with the final images you choose.",
  };
}

function getQuestionMeta(questionId: (typeof CALIBRATION_QUESTIONS)[number]["id"], locale: PublicLocale) {
  const copy = getText(locale);

  const map = {
    size8: { title: copy.sizeStep, prompt: copy.sizeQuestion8, assumption: copy.sizeAssumption },
    size12: { title: copy.sizeStep, prompt: copy.sizeQuestion12, assumption: copy.sizeAssumption },
    size18: { title: copy.sizeStep, prompt: copy.sizeQuestion18, assumption: copy.sizeAssumption },
    size25: { title: copy.sizeStep, prompt: copy.sizeQuestion25, assumption: copy.sizeAssumption },
    detailLow: { title: copy.detailStep, prompt: copy.detailQuestionLow, assumption: copy.detailAssumption },
    detailMedium: { title: copy.detailStep, prompt: copy.detailQuestionMedium, assumption: copy.detailAssumption },
    detailHigh: { title: copy.detailStep, prompt: copy.detailQuestionHigh, assumption: copy.detailAssumption },
    placementEasy: { title: copy.placementStep, prompt: copy.placementQuestionEasy, assumption: copy.placementAssumption },
    placementHard: { title: copy.placementStep, prompt: copy.placementQuestionHard, assumption: copy.placementAssumption },
    colorBlack: { title: copy.colorStep, prompt: copy.colorQuestionBlack, assumption: copy.colorAssumption },
    colorColor: { title: copy.colorStep, prompt: copy.colorQuestionColor, assumption: copy.colorAssumption },
  } as const;

  return map[questionId];
}

function getQuestionRange(draft: CalibrationDraft, questionId: (typeof CALIBRATION_QUESTIONS)[number]["id"]) {
  switch (questionId) {
    case "size8":
      return draft.size.size8;
    case "size12":
      return draft.size.size12;
    case "size18":
      return draft.size.size18;
    case "size25":
      return draft.size.size25;
    case "detailLow":
      return draft.detail.low;
    case "detailMedium":
      return draft.detail.medium;
    case "detailHigh":
      return draft.detail.high;
    case "placementEasy":
      return draft.placement.easy;
    case "placementHard":
      return draft.placement.hard;
    case "colorBlack":
      return draft.color.black;
    case "colorColor":
      return draft.color.color;
  }
}

function setQuestionRange(
  draft: CalibrationDraft,
  questionId: (typeof CALIBRATION_QUESTIONS)[number]["id"],
  edge: "min" | "max",
  value: string,
) {
  switch (questionId) {
    case "size8":
      return updateCalibrationDraftRange(draft, "size", "size8", edge, value);
    case "size12":
      return updateCalibrationDraftRange(draft, "size", "size12", edge, value);
    case "size18":
      return updateCalibrationDraftRange(draft, "size", "size18", edge, value);
    case "size25":
      return updateCalibrationDraftRange(draft, "size", "size25", edge, value);
    case "detailLow":
      return updateCalibrationDraftRange(draft, "detail", "low", edge, value);
    case "detailMedium":
      return updateCalibrationDraftRange(draft, "detail", "medium", edge, value);
    case "detailHigh":
      return updateCalibrationDraftRange(draft, "detail", "high", edge, value);
    case "placementEasy":
      return updateCalibrationDraftRange(draft, "placement", "easy", edge, value);
    case "placementHard":
      return updateCalibrationDraftRange(draft, "placement", "hard", edge, value);
    case "colorBlack":
      return updateCalibrationDraftRange(draft, "color", "black", edge, value);
    case "colorColor":
      return updateCalibrationDraftRange(draft, "color", "color", edge, value);
  }
}

function isQuestionAnswered(range: { min: string; max: string }) {
  return Boolean(range.min.trim());
}

function getValidationStatusLabel(
  status: PricingValidationStatus | "pending",
  locale: PublicLocale,
) {
  const copy = getText(locale);

  switch (status) {
    case "confirmed":
      return copy.statusConfirmed;
    case "adjusted":
      return copy.statusAdjusted;
    case "completed-no-majority":
      return copy.statusNoMajority;
    case "needs-review":
      return copy.statusNeedsReview;
    default:
      return copy.statusPending;
  }
}

function getValidationScenarioLabel(
  id: PricingValidationExampleId,
  locale: PublicLocale,
) {
  const copy = getText(locale);

  switch (id) {
    case "minimal-linework":
      return copy.scenario1;
    case "ornamental-dagger":
      return copy.scenario2;
    case "realistic-eye":
      return copy.scenario3;
    case "colored-butterfly":
      return copy.scenario4;
  }
}

function getPlacementSummaryLabel(
  placement: string,
  locale: PublicLocale,
) {
  if (locale === "tr") {
    return placement === "ribs" ? "Zor bölge" : "Kolay bölge";
  }

  return placement === "ribs" ? "Hard placement" : "Easy placement";
}

export function PricingForm({
  pricingRules,
  styles: _styles,
  locale = "en",
}: {
  pricingRules: ArtistPricingRules;
  styles: ArtistStyleOption[];
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const copy = getText(locale);
  const [draft, setDraft] = useState<CalibrationDraft>(() => buildInitialCalibrationDraft(pricingRules));
  const [showCalibration, setShowCalibration] = useState(false);
  const [showFinalValidation, setShowFinalValidation] = useState(false);
  const [screenIndex, setScreenIndex] = useState(0);
  const [validationIndex, setValidationIndex] = useState(0);
  const [validationRound, setValidationRound] = useState<1 | 2>(1);
  const [validationFeedback, setValidationFeedback] = useState<
    Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>
  >({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const slots = buildCalibrationSlots(pricingRules.calibrationReferenceSlots);
  const ready = isCalibrationReady(pricingRules);
  const validationReady = draft.validation.finalValidation.calibratedAndValidated;
  const currentQuestion = CALIBRATION_QUESTIONS[screenIndex];
  const currentMeta = getQuestionMeta(currentQuestion.id, locale);
  const currentRange = getQuestionRange(draft, currentQuestion.id);
  const validationExamples = useMemo(
    () => buildValidationPreviewExamples(draft, pricingRules),
    [draft, pricingRules],
  );
  const currentValidationScenario = VALIDATION_SCENARIOS[validationIndex] ?? VALIDATION_SCENARIOS[0];
  const currentValidationRange = validationExamples[validationIndex] ?? validationExamples[0];
  const currentValidationImage = validationImages[currentValidationScenario.image];
  const currentImage = calibrationImages[currentQuestion.image];

  async function persistDraft(nextDraft: CalibrationDraft, successMessage: string) {
    setStatusMessage(null);

    const payload = buildPricingPayloadFromCalibrationDraft(nextDraft, pricingRules);
    const parsed = pricingSchema.safeParse(payload);

    if (!parsed.success) {
      setStatusMessage(copy.invalid);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/dashboard/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      await response.json().catch(() => null);

      if (!response.ok) {
        setStatusMessage(copy.saveFailed);
        return;
      }

      setDraft(nextDraft);
      setStatusMessage(successMessage);
      setShowCalibration(false);
      setShowFinalValidation(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(nextDraft = draft, successMessage = copy.saved) {
    await persistDraft(nextDraft, successMessage);
  }

  function handleNext() {
    if (!isQuestionAnswered(currentRange)) {
      setStatusMessage(copy.invalid);
      return;
    }

    setStatusMessage(null);
    setScreenIndex((current) => current + 1);
  }

  function handleBack() {
    setStatusMessage(null);
    setScreenIndex((current) => Math.max(0, current - 1));
  }

  function resetValidationFlow() {
    setValidationIndex(0);
    setValidationRound(1);
    setValidationFeedback({});
  }

  async function handleValidationChoice(feedback: PricingValidationFeedback) {
    const nextFeedback = {
      ...validationFeedback,
      [currentValidationScenario.id]: feedback,
    };
    setValidationFeedback(nextFeedback);
    setStatusMessage(null);

    if (validationIndex < VALIDATION_SCENARIOS.length - 1) {
      setValidationIndex((current) => current + 1);
      return;
    }

    const { review, nextScaleMultiplier, needsSecondRound } = summarizeFinalValidationReview(
      nextFeedback,
      validationRound,
    );

    if (needsSecondRound) {
      const nextGlobalScale = Math.max(
        0.85,
        Math.min(1.15, (Number(draft.validation.globalScale) || 1) * nextScaleMultiplier),
      );
      setDraft((current) =>
        updateFinalValidationDraft(
          updateCalibrationValidationDraft(current, {
            globalScale: Number(nextGlobalScale.toFixed(2)).toString(),
          }),
          review,
        ),
      );
      setValidationRound(2);
      setValidationIndex(0);
      setValidationFeedback({});
      setStatusMessage(copy.validationAdjusted);
      return;
    }

    const nextDraft = updateFinalValidationDraft(draft, review);
    await handleSave(
      nextDraft,
      review.calibratedAndValidated ? copy.validationSaved : copy.validationNeedsReview,
    );
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <Field label={copy.openingPrice}>
              <Input
                type="number"
                value={draft.openingPrice}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    openingPrice: event.target.value,
                  }))
                }
              />
            </Field>
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">{copy.openingPriceHelp}</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.openingPriceNote}</p>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <p className="text-sm font-medium text-white">{copy.summaryTitle}</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.summaryBody}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">{copy.openingPrice}</p>
                <p className="mt-2 text-lg font-semibold text-white">{draft.openingPrice || "-"}</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">{copy.slotsTitle}</p>
                <p className="mt-2 text-lg font-semibold text-white">{slots.length}</p>
              </div>
              <div className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">{copy.scaleLabel}</p>
                <p className="mt-2 text-lg font-semibold text-white">{draft.validation.globalScale}x</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[var(--foreground-muted)]">{ready ? copy.ready : copy.notReady}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowCalibration((current) => !current);
                  setShowFinalValidation(false);
                  setScreenIndex(0);
                  setStatusMessage(null);
                }}
              >
                {ready ? copy.edit : copy.start}
              </Button>
              {showCalibration ? (
                <Button type="button" variant="ghost" onClick={() => setShowCalibration(false)}>
                  {copy.close}
                </Button>
              ) : null}
            </div>
          </div>

          {ready ? (
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{copy.finalCheckTitle}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {validationReady ? copy.finalCheckReady : copy.finalCheckPending}
                  </p>
                </div>
                <div className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-sm text-white">
                  {getValidationStatusLabel(
                    draft.validation.finalValidation.validationStatus ?? "pending",
                    locale,
                  )}
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--foreground-muted)]">{copy.finalCheckIntro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    setShowFinalValidation((current) => !current);
                    setShowCalibration(false);
                    resetValidationFlow();
                    setStatusMessage(null);
                  }}
                >
                  {validationReady ? copy.finalCheckRestart : copy.finalCheckStart}
                </Button>
                {showFinalValidation ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowFinalValidation(false);
                      resetValidationFlow();
                    }}
                  >
                    {copy.finalCheckClose}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {showCalibration ? (
            <>
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                      {copy.stepLabel} {currentQuestion.step} / 4
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{currentMeta.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {copy.questionLabel} {currentQuestion.stepIndex} / {CALIBRATION_QUESTIONS.filter((item) => item.step === currentQuestion.step).length}
                  </p>
                </div>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">{currentMeta.prompt}</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{currentMeta.assumption}</p>
                </div>

                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-black/20">
                  <div className="relative aspect-[4/5] w-full bg-black/10">
                    <Image
                      src={currentImage}
                      alt={currentMeta.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 560px"
                    />
                  </div>
                  <div className="border-t border-white/8 p-4">
                    <p className="text-sm font-medium text-white">{copy.referenceTitle}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.referenceHelp}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={copy.priceLabel}>
                      <Input
                        type="number"
                        value={currentRange.min}
                        onChange={(event) =>
                          setDraft((current) =>
                            setQuestionRange(current, currentQuestion.id, "min", event.target.value),
                          )
                        }
                      />
                    </Field>
                    <Field label={copy.maxLabel}>
                      <Input
                        type="number"
                        value={currentRange.max}
                        onChange={(event) =>
                          setDraft((current) =>
                            setQuestionRange(current, currentQuestion.id, "max", event.target.value),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <p className="mt-3 text-sm text-[var(--foreground-muted)]">{copy.maxHelp}</p>
                </div>
              </div>

              {statusMessage ? <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                {screenIndex > 0 ? (
                  <Button type="button" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </Button>
                ) : null}

                {screenIndex < CALIBRATION_QUESTIONS.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    {copy.next}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() =>
                      handleSave(
                        updateFinalValidationDraft(draft, {
                          validationRound: 1,
                          perExampleFeedback: {},
                          appliedGlobalValidationAdjustment: 1,
                          validationStatus: "pending",
                          calibratedAndValidated: false,
                        }),
                      )
                    }
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        {copy.saving}
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        {copy.save}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : null}

          {showFinalValidation ? (
            <>
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                      {copy.finalCheckTitle}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {copy.stepLabel} {validationRound} / 2
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {copy.questionLabel} {validationIndex + 1} / {VALIDATION_SCENARIOS.length}
                  </p>
                </div>

                <p className="mt-4 text-sm text-[var(--foreground-muted)]">{copy.finalCheckIntro}</p>

                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-black/20">
                  <div className="relative aspect-[4/5] w-full bg-black/10">
                    <Image
                      src={currentValidationImage}
                      alt={getValidationScenarioLabel(currentValidationScenario.id, locale)}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 560px"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">
                    {getValidationScenarioLabel(currentValidationScenario.id, locale)}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm text-[var(--foreground-muted)] sm:grid-cols-2">
                    <p>
                      {copy.scenarioSize}: {currentValidationScenario.sizeCm} cm
                    </p>
                    <p>
                      {copy.scenarioPlacement}: {getPlacementSummaryLabel(currentValidationScenario.placement, locale)}
                    </p>
                  </div>
                  <p className="mt-4 text-base font-medium text-white">
                    {copy.previewRange}: {currentValidationRange.range.min} - {currentValidationRange.range.max}
                  </p>
                </div>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">{copy.validationQuestion}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {[
                      { key: "looks-right", label: copy.looksRight },
                      { key: "slightly-low", label: copy.slightlyLow },
                      { key: "slightly-high", label: copy.slightlyHigh },
                    ].map((option) => {
                      const active = validationFeedback[currentValidationScenario.id] === option.key;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleValidationChoice(option.key as PricingValidationFeedback)}
                          className="rounded-[18px] border px-4 py-3 text-sm transition"
                          style={{
                            borderColor: active ? "var(--primary)" : "rgba(255,255,255,0.08)",
                            backgroundColor: active
                              ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                              : "rgba(255,255,255,0.02)",
                            color: "white",
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {statusMessage ? <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                {(validationIndex > 0 || validationRound > 1) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (validationIndex > 0) {
                        setValidationIndex((current) => Math.max(0, current - 1));
                      }
                    }}
                  >
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
