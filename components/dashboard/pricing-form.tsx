"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
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
import ultraHighDetailImage from "@/sample-tattoos/ultrahigh.png";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pricingSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import {
  applyValidationFeedbackAdjustments,
  buildValidationPreviewExamples,
  buildInitialCalibrationDraft,
  buildPricingPayloadFromCalibrationDraft,
  CALIBRATION_STEPS,
  summarizeFinalValidationReview,
  updateCalibrationDraftRange,
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

const calibrationImages: Record<"low" | "medium" | "high" | "ultra" | "color", StaticImageData> = {
  low: lowDetailImage,
  medium: mediumDetailImage,
  high: highDetailImage,
  ultra: ultraHighDetailImage,
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
      title: "Fiyat ayarını yap",
      description:
        "Sana birkaç örnek dövme gösterilecek.\nHer biri için “bunu kaça yaparsın?” sorusuna fiyat gir.\n\nSistem, verdiğin bu örneklere bakarak senin fiyat mantığını öğrenir ve ona göre öneri yapar.",
      openingPrice: "Başlangıç fiyatın",
      openingPriceHelp: "Küçük ve standart bir dövmeyi genelde kaçtan başlatıyorsun?",
      start: "Fiyat Ayarını Başlat",
      edit: "Fiyat ayarını düzenle",
      reset: "Sıfırla",
      close: "Daha sonra devam et",
      priceLabel: "Fiyat alt sınır",
      maxLabel: "Fiyat üst sınır",
      maxHelp: "",
      next: "Devam",
      back: "Geri",
      save: "Ayarları kaydet",
      saving: "Kaydediliyor",
      saveFailed: "Fiyat ayarı kaydedilemedi.",
      saved: "Fiyat ayarı kaydedildi.",
      invalid: "Bu sorunun fiyatını girmen gerekiyor.",
      stepLabel: "Adım",
      questionLabel: "Soru",
      sizeQuestion8: "Bu dövme 8 cm ön kolda olsa kaç ₺ fiyatlarsın?",
      sizeQuestion12: "Bu dövme 12 cm ön kolda olsa kaç ₺ fiyatlarsın?",
      sizeQuestion18: "Bu dövme 18 cm ön kolda olsa kaç ₺ fiyatlarsın?",
      sizeQuestion25: "Bu dövme 25 cm ön kolda olsa kaç ₺ fiyatlarsın?",
      detailContext: "12 cm · kolay bölge · siyah",
      detailLowLabel: "Az detay",
      detailMediumLabel: "Orta detay",
      detailHighLabel: "Çok detay",
      detailUltraLabel: "Realism",
      detailUltraHelp: "Yumuşak gölgelendirme ve yüksek işçilik gerektiren detaylı işler",
      placementContext: "12 cm · Orta detay · Siyah",
      placementEasyLabel: "Kolay bölge",
      placementMediumLabel: "Orta zorluk",
      placementHardLabel: "Zor bölge",
      colorContext: "12 cm · Orta detay · Kolay bölge",
      colorBlackLabel: "Siyah",
      colorColorLabel: "Renkli",
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
      saveAfterValidation: "Ayarları kaydet",
      scenarioSize: "Yaklaşık boyut",
      scenarioPlacement: "Bölge",
      scenario1: "Minimal linework · siyah",
      scenario2: "Ornamental dagger · siyah",
      scenario3: "Realism · black & grey",
      scenario4: "Colored butterfly · renkli",
      statusPending: "Bekliyor",
      statusConfirmed: "Onaylandı",
      statusAdjusted: "Güncellendi",
      statusNoMajority: "Net bir çoğunluk yok",
      statusNeedsReview: "Bir tur daha manuel bakılmalı",
      looksRight: "Uygun",
      slightlyLow: "Biraz düşük",
      slightlyHigh: "Biraz yüksek",
      completeQuestionsFirst: "Önce fiyat sorularını tamamla.",
    };
  }

  return {
    title: "Set up pricing",
    description:
      "You will see a few sample tattoos. Enter what you would charge for each one so the system can learn your pricing logic.",
    openingPrice: "Opening price",
    openingPriceHelp: "What do you usually start a small, standard tattoo at?",
    start: "Start pricing setup",
    edit: "Edit pricing setup",
    reset: "Reset",
    close: "Continue later",
    priceLabel: "Price min",
    maxLabel: "Price max",
    maxHelp: "",
    next: "Next",
    back: "Back",
    save: "Save settings",
    saving: "Saving",
    saveFailed: "Pricing setup could not be saved.",
    saved: "Pricing setup saved.",
    invalid: "Please enter a price for this question.",
    stepLabel: "Step",
    questionLabel: "Question",
    sizeQuestion8: "What would you charge if this tattoo were 8 cm on the forearm?",
    sizeQuestion12: "What would you charge if it were 12 cm on the forearm?",
    sizeQuestion18: "What would you charge if it were 18 cm on the forearm?",
    sizeQuestion25: "What would you charge if it were 25 cm on the forearm?",
    detailContext: "12 cm · easy placement · black",
    detailLowLabel: "Low detail",
    detailMediumLabel: "Medium detail",
    detailHighLabel: "High detail",
    detailUltraLabel: "Realism",
    detailUltraHelp: "Detailed work with soft shading and higher craftsmanship",
    placementContext: "12 cm · Medium detail · Black",
    placementEasyLabel: "Easy placement",
    placementMediumLabel: "Medium difficulty",
    placementHardLabel: "Hard placement",
    colorContext: "12 cm · Medium detail · Easy placement",
    colorBlackLabel: "Black",
    colorColorLabel: "Full color",
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
    saveAfterValidation: "Save settings",
    scenarioSize: "Approximate size",
    scenarioPlacement: "Placement",
    scenario1: "Minimal linework · black",
    scenario2: "Ornamental dagger · black",
    scenario3: "Realism · black & grey",
    scenario4: "Colored butterfly · color",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusAdjusted: "Adjusted",
    statusNoMajority: "No clear majority",
    statusNeedsReview: "Needs review",
    looksRight: "Looks right",
    slightlyLow: "Slightly low",
    slightlyHigh: "Slightly high",
    completeQuestionsFirst: "Finish the pricing questions first.",
  };
}

function isQuestionAnswered(range: { min: string; max: string }) {
  return Boolean(range.min.trim());
}

function areRangesAnswered(ranges: Array<{ min: string; max: string }>) {
  return ranges.every(isQuestionAnswered);
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
    return placement === "ribs" ? "Kaburga" : "Ön kol";
  }

  return placement === "ribs" ? "Ribs" : "Forearm";
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
  const [pendingSaveDraft, setPendingSaveDraft] = useState<CalibrationDraft | null>(null);
  const [awaitingFinalSave, setAwaitingFinalSave] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const ready = draft.validation.finalValidation.validationStatus !== "pending";
  const currentStep = CALIBRATION_STEPS[screenIndex] ?? CALIBRATION_STEPS[0];
  const validationExamples = useMemo(
    () => buildValidationPreviewExamples(draft, pricingRules),
    [draft, pricingRules],
  );
  const currentValidationScenario = VALIDATION_SCENARIOS[validationIndex] ?? VALIDATION_SCENARIOS[0];
  const currentValidationRange = validationExamples[validationIndex] ?? validationExamples[0];
  const currentValidationImage = validationImages[currentValidationScenario.image];
  const stepReady =
    currentStep === "size"
      ? areRangesAnswered([draft.size.size8, draft.size.size12, draft.size.size18, draft.size.size25])
      : currentStep === "detail"
        ? areRangesAnswered([draft.detail.low, draft.detail.medium, draft.detail.high, draft.detail.ultra])
      : currentStep === "placement"
          ? areRangesAnswered([draft.placement.easy, draft.placement.medium, draft.placement.hard])
          : areRangesAnswered([draft.color.black, draft.color.color]);

  function updateRange(
    section: "size" | "detail" | "placement" | "color",
    key: string,
    edge: "min" | "max",
    value: string,
  ) {
    setDraft((current) => updateCalibrationDraftRange(current, section, key, edge, value));
  }

  function buildEmptyDraft() {
    const base = buildInitialCalibrationDraft(pricingRules);

    return {
      ...base,
      validation: {
        globalScale: "1",
        finalValidation: {
          validationRound: 1 as const,
          perExampleFeedback: {},
          appliedGlobalValidationAdjustment: 1,
          validationStatus: "pending" as const,
          calibratedAndValidated: false,
        },
      },
      size: {
        size8: { min: "", max: "" },
        size12: { min: "", max: "" },
        size18: { min: "", max: "" },
        size25: { min: "", max: "" },
      },
      detail: {
        low: { min: "", max: "" },
        medium: { min: "", max: "" },
        high: { min: "", max: "" },
        ultra: { min: "", max: "" },
      },
      placement: {
        easy: { min: "", max: "" },
        medium: { min: "", max: "" },
        hard: { min: "", max: "" },
      },
      color: {
        black: { min: "", max: "" },
        color: { min: "", max: "" },
      },
    };
  }

  function resetDraft() {
    const nextDraft = buildEmptyDraft();

    setDraft(nextDraft);
    setScreenIndex(0);
    setShowCalibration(false);
    setShowFinalValidation(false);
    setPendingSaveDraft(null);
    setAwaitingFinalSave(false);
    resetValidationFlow();
    setStatusMessage(null);
  }

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
      setPendingSaveDraft(null);
      setAwaitingFinalSave(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(nextDraft = draft, successMessage = copy.saved) {
    await persistDraft(nextDraft, successMessage);
  }

  function handleNext() {
    if (!stepReady) {
      setStatusMessage(copy.invalid);
      return;
    }

    setStatusMessage(null);
    if (screenIndex === CALIBRATION_STEPS.length - 1) {
      setShowCalibration(false);
      setShowFinalValidation(true);
      resetValidationFlow();
      return;
    }

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
    setPendingSaveDraft(null);
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
      const adjustedDraft = updateFinalValidationDraft(
        applyValidationFeedbackAdjustments(draft, nextFeedback, nextScaleMultiplier),
        review,
      );
      setDraft(adjustedDraft);
      setPendingSaveDraft(null);
      setAwaitingFinalSave(false);
      setValidationRound(2);
      setValidationIndex(0);
      setValidationFeedback({});
      setStatusMessage(copy.validationAdjusted);
      return;
    }

    const nextDraft = updateFinalValidationDraft(draft, review);
    setDraft(nextDraft);
    setPendingSaveDraft(nextDraft);
    setAwaitingFinalSave(true);
    setStatusMessage(
      review.calibratedAndValidated ? copy.finalCheckReady : copy.validationNeedsReview,
    );
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription className="whitespace-pre-line">{copy.description}</CardDescription>
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
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowCalibration((current) => !current);
                  setShowFinalValidation(false);
                  setPendingSaveDraft(null);
                  setAwaitingFinalSave(false);
                  setScreenIndex(0);
                  setStatusMessage(null);
                }}
              >
                {ready ? copy.edit : copy.start}
              </Button>
              {ready && draft.validation.finalValidation.validationStatus !== "pending" ? (
                <Button type="button" variant="ghost" onClick={resetDraft}>
                  {copy.reset}
                </Button>
              ) : null}
              {showCalibration ? (
                <Button type="button" variant="ghost" onClick={() => setShowCalibration(false)}>
                  {copy.close}
                </Button>
              ) : null}
            </div>
          </div>

          {showCalibration ? (
            <>
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                      {copy.stepLabel} {screenIndex + 1} / {CALIBRATION_STEPS.length}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {copy.questionLabel} {screenIndex + 1} / {CALIBRATION_STEPS.length}
                  </p>
                </div>

                <div className="mt-3 rounded-[18px] border border-white/8 bg-black/20 p-3">
                  {currentStep === "size" ? (
                    <div className="space-y-4">
                      <div className="mx-auto max-w-[360px] overflow-hidden rounded-[18px] border border-white/8 bg-black/20">
                        <div className="relative aspect-[4/3] w-full bg-black/10">
                          <Image
                            src={calibrationImages.medium}
                            alt="Baseline tattoo"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 360px"
                          />
                        </div>
                      </div>
                      {[
                        { key: "size8", label: copy.sizeQuestion8, range: draft.size.size8 },
                        { key: "size12", label: copy.sizeQuestion12, range: draft.size.size12 },
                        { key: "size18", label: copy.sizeQuestion18, range: draft.size.size18 },
                        { key: "size25", label: copy.sizeQuestion25, range: draft.size.size25 },
                      ].map((item) => (
                        <div key={item.key} className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <Field label={copy.priceLabel}>
                              <Input
                                type="number"
                                value={item.range.min}
                                onChange={(event) => updateRange("size", item.key, "min", event.target.value)}
                              />
                            </Field>
                            <Field label={copy.maxLabel}>
                              <Input
                                type="number"
                                value={item.range.max}
                                onChange={(event) => updateRange("size", item.key, "max", event.target.value)}
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {currentStep === "detail" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--foreground-muted)]">{copy.detailContext}</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          {
                            key: "low",
                            label: copy.detailLowLabel,
                            help: "",
                            image: calibrationImages.low,
                            range: draft.detail.low,
                          },
                          {
                            key: "medium",
                            label: copy.detailMediumLabel,
                            help: "",
                            image: calibrationImages.medium,
                            range: draft.detail.medium,
                          },
                          {
                            key: "high",
                            label: copy.detailHighLabel,
                            help: "",
                            image: calibrationImages.high,
                            range: draft.detail.high,
                          },
                          {
                            key: "ultra",
                            label: copy.detailUltraLabel,
                            help: copy.detailUltraHelp,
                            image: calibrationImages.ultra,
                            range: draft.detail.ultra,
                          },
                        ].map((item) => (
                          <div key={item.key} className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                            <div className="overflow-hidden rounded-[16px] border border-white/8 bg-black/10">
                              <div className="relative aspect-[4/3] w-full">
                                <Image
                                  src={item.image}
                                  alt={item.label}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 768px) 100vw, 320px"
                                />
                              </div>
                            </div>
                            <p className="mt-3 text-sm font-medium text-white">{item.label}</p>
                            {item.help ? (
                              <p className="mt-1 text-xs text-[var(--foreground-muted)]">{item.help}</p>
                            ) : null}
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <Field label={copy.priceLabel}>
                                <Input
                                  type="number"
                                  value={item.range.min}
                                  onChange={(event) => updateRange("detail", item.key, "min", event.target.value)}
                                />
                              </Field>
                              <Field label={copy.maxLabel}>
                                <Input
                                  type="number"
                                  value={item.range.max}
                                  onChange={(event) => updateRange("detail", item.key, "max", event.target.value)}
                                />
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === "placement" ? (
                    <div className="space-y-4">
                      <div className="mx-auto max-w-[360px] overflow-hidden rounded-[18px] border border-white/8 bg-black/20">
                        <div className="relative aspect-[4/3] w-full bg-black/10">
                          <Image
                            src={calibrationImages.medium}
                            alt="Placement reference"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 360px"
                          />
                        </div>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)]">{copy.placementContext}</p>
                      {[
                        { key: "easy", label: copy.placementEasyLabel, range: draft.placement.easy },
                        { key: "medium", label: copy.placementMediumLabel, range: draft.placement.medium },
                        { key: "hard", label: copy.placementHardLabel, range: draft.placement.hard },
                      ].map((item) => (
                        <div key={item.key} className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <Field label={copy.priceLabel}>
                              <Input
                                type="number"
                                value={item.range.min}
                                onChange={(event) => updateRange("placement", item.key, "min", event.target.value)}
                              />
                            </Field>
                            <Field label={copy.maxLabel}>
                              <Input
                                type="number"
                                value={item.range.max}
                                onChange={(event) => updateRange("placement", item.key, "max", event.target.value)}
                              />
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {currentStep === "color" ? (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--foreground-muted)]">{copy.colorContext}</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[
                          {
                            key: "black",
                            label: copy.colorBlackLabel,
                            image: calibrationImages.medium,
                            range: draft.color.black,
                          },
                          {
                            key: "color",
                            label: copy.colorColorLabel,
                            image: calibrationImages.color,
                            range: draft.color.color,
                          },
                        ].map((item) => (
                          <div key={item.key} className="rounded-[18px] border border-white/8 bg-black/20 p-4">
                            <div className="overflow-hidden rounded-[16px] border border-white/8 bg-black/10">
                              <div className="relative aspect-[4/3] w-full">
                                <Image
                                  src={item.image}
                                  alt={item.label}
                                  fill
                                  className="object-contain"
                                  sizes="(max-width: 768px) 100vw, 260px"
                                />
                              </div>
                            </div>
                            <p className="mt-3 text-sm font-medium text-white">{item.label}</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <Field label={copy.priceLabel}>
                                <Input
                                  type="number"
                                  value={item.range.min}
                                  onChange={(event) => updateRange("color", item.key, "min", event.target.value)}
                                />
                              </Field>
                              <Field label={copy.maxLabel}>
                                <Input
                                  type="number"
                                  value={item.range.max}
                                  onChange={(event) => updateRange("color", item.key, "max", event.target.value)}
                                />
                              </Field>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {copy.maxHelp ? (
                    <p className="mt-3 text-sm text-[var(--foreground-muted)]">{copy.maxHelp}</p>
                  ) : null}
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

                {screenIndex < CALIBRATION_STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext}>
                    {copy.next}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext}>
                    {copy.finalCheckStart}
                    <ArrowRight className="size-4" />
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
                  <div className="mx-auto max-w-[360px] p-3 sm:p-4">
                    <div className="relative aspect-[4/3] w-full bg-black/10">
                      <Image
                        src={currentValidationImage}
                        alt={getValidationScenarioLabel(currentValidationScenario.id, locale)}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 360px"
                      />
                    </div>
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAwaitingFinalSave(false);
                    setShowFinalValidation(false);
                    setShowCalibration(true);
                    setScreenIndex(CALIBRATION_STEPS.length - 1);
                    setStatusMessage(copy.completeQuestionsFirst);
                  }}
                >
                  {copy.edit}
                </Button>
                {awaitingFinalSave ? (
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSave(
                        pendingSaveDraft ?? draft,
                        (pendingSaveDraft ?? draft).validation.finalValidation.calibratedAndValidated
                          ? copy.validationSaved
                          : copy.validationNeedsReview,
                      )
                    }
                  >
                    {isSaving ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        {copy.saving}
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        {copy.saveAfterValidation}
                      </>
                    )}
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
