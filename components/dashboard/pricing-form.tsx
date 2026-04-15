"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, ArrowRight, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import colorMediumImage from "@/sample-tattoos/colour-medium.png";
import highDetailImage from "@/sample-tattoos/high.png";
import lowDetailImage from "@/sample-tattoos/low.png";
import mediumDetailImage from "@/sample-tattoos/medium.png";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { pricingSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import {
  buildCalibrationPreviewExamples,
  buildCalibrationSlots,
  buildInitialCalibrationDraft,
  buildPricingPayloadFromCalibrationDraft,
  CALIBRATION_QUESTIONS,
  isCalibrationReady,
  updateCalibrationDraftRange,
  updateCalibrationValidationDraft,
  type CalibrationDraft,
} from "@/lib/pricing/calibration-flow";
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";

const calibrationImages: Record<"low" | "medium" | "high" | "color", StaticImageData> = {
  low: lowDetailImage,
  medium: mediumDetailImage,
  high: highDetailImage,
  color: colorMediumImage,
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
      finalCheckBody: "Tattix bu örnek tahminleri üretti. Sana ne kadar uygun görünüyor?",
      previewRange: "Tahmini aralık",
      preview1: "Orta boy · orta detay · kolay bölge · siyah",
      preview2: "Daha büyük · çok detay · zor bölge · siyah",
      preview3: "Daha büyük · orta detay · kolay bölge · renkli",
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
    finalCheckBody: "Tattix generated these sample estimates. How close do they feel?",
    previewRange: "Estimated range",
    preview1: "Medium size · medium detail · easy placement · black",
    preview2: "Larger size · high detail · hard placement · black",
    preview3: "Larger size · medium detail · easy placement · color",
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
  const [screenIndex, setScreenIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const slots = buildCalibrationSlots(pricingRules.calibrationReferenceSlots);
  const ready = isCalibrationReady(pricingRules);
  const currentQuestion = CALIBRATION_QUESTIONS[screenIndex];
  const currentMeta = getQuestionMeta(currentQuestion.id, locale);
  const currentRange = getQuestionRange(draft, currentQuestion.id);
  const previewExamples = useMemo(() => buildCalibrationPreviewExamples(draft), [draft]);
  const previewLabels = [copy.preview1, copy.preview2, copy.preview3];
  const currentImage = calibrationImages[currentQuestion.image];

  async function handleSave() {
    setStatusMessage(null);

    const payload = buildPricingPayloadFromCalibrationDraft(draft, pricingRules);
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

      setStatusMessage(copy.saved);
      setShowCalibration(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  function handleNext() {
    if (!isQuestionAnswered(currentRange)) {
      setStatusMessage(copy.invalid);
      return;
    }

    setStatusMessage(null);

    if (screenIndex === CALIBRATION_QUESTIONS.length - 1) {
      setShowValidation(true);
      return;
    }

    setScreenIndex((current) => current + 1);
  }

  function handleBack() {
    setStatusMessage(null);

    if (showValidation) {
      setShowValidation(false);
      return;
    }

    setScreenIndex((current) => Math.max(0, current - 1));
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
                  setShowValidation(false);
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

          {showCalibration ? (
            <>
              {!showValidation ? (
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
              ) : (
                <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    {copy.finalCheckTitle}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{copy.finalCheckTitle}</h3>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">{copy.finalCheckBody}</p>

                  <div className="mt-5 grid gap-3">
                    {previewExamples.map((example, index) => (
                      <div key={example.id} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                        <p className="text-sm text-[var(--foreground-muted)]">{previewLabels[index]}</p>
                        <p className="mt-2 text-base font-medium text-white">
                          {copy.previewRange}: {example.range.min} - {example.range.max}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {[
                      { key: "looks-right", label: copy.looksRight, scale: "1" },
                      { key: "slightly-low", label: copy.slightlyLow, scale: "1.06" },
                      { key: "slightly-high", label: copy.slightlyHigh, scale: "0.94" },
                    ].map((option) => {
                      const active = draft.validation.feedback === option.key;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            setDraft((current) =>
                              updateCalibrationValidationDraft(current, {
                                feedback: option.key as CalibrationDraft["validation"]["feedback"],
                                globalScale: option.scale,
                              }),
                            )
                          }
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

                  <div className="mt-5 rounded-[20px] border border-white/8 bg-black/20 p-4">
                    <p className="text-sm font-medium text-white">{copy.scaleLabel}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.scaleHelp}</p>
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {["0.92", "0.96", "1", "1.04", "1.08"].map((value) => {
                        const active = draft.validation.globalScale === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setDraft((current) =>
                                updateCalibrationValidationDraft(current, {
                                  globalScale: value,
                                }),
                              )
                            }
                            className="rounded-[16px] border px-2 py-2 text-sm transition"
                            style={{
                              borderColor: active ? "var(--primary)" : "rgba(255,255,255,0.08)",
                              backgroundColor: active
                                ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                                : "rgba(255,255,255,0.02)",
                              color: "white",
                            }}
                          >
                            {value}x
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {statusMessage ? <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p> : null}

              <div className="flex flex-wrap items-center gap-3">
                {(screenIndex > 0 || showValidation) ? (
                  <Button type="button" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </Button>
                ) : null}

                {!showValidation ? (
                  <Button type="button" onClick={handleNext}>
                    {copy.next}
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSave} disabled={isSaving}>
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
        </div>
      </CardContent>
    </Card>
  );
}
