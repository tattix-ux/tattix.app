"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import currentDaggerImage from "@/sample-tattoos/final-control/dagger.png";
import featherImage from "@/sample-tattoos/final-control/feather.png";
import realisticEyeImage from "@/sample-tattoos/final-control/realistic eye.png";
import textVisualImage from "@/sample-tattoos/final-control/text.png";
import butterflyImage from "@/sample-tattoos/final-control/butterfly.png";
import highDetailImage from "@/sample-tattoos/high.png";
import lowDetailImage from "@/sample-tattoos/low.png";
import mediumDetailImage from "@/sample-tattoos/medium.png";
import colorMediumImage from "@/sample-tattoos/colour-medium.png";
import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PublicLocale } from "@/lib/i18n/public";
import { VALIDATION_SCENARIOS } from "@/lib/pricing/calibration-flow";
import { FINAL_CONTROL_PROBES } from "@/lib/pricing/final-control";
import {
  applyFinalControlRoundsToPricingProfile,
  derivePricingProfile,
  type PricingCalibrationRawInputLike,
} from "@/lib/pricing/pricing-profile";
import {
  buildNormalizedQuoteConfig,
  estimateNormalizedQuote,
  type NormalizedQuoteInput,
} from "@/lib/pricing/normalized-engine";
import type {
  ArtistPricingRules,
  ArtistStyleOption,
  PricingValidationExampleId,
  PricingValidationFeedback,
} from "@/lib/types";

type PricingCalibrationFieldKey =
  | "openingPrice"
  | "size8"
  | "size18"
  | "size25"
  | "detailLow"
  | "detailHigh"
  | "detailColor"
  | "anchor18";

type ReviewReason = "size" | "detail" | "color" | "general";

type PricingCalibrationValues = Record<PricingCalibrationFieldKey, string>;

type PricingCalibrationDraft = {
  values: PricingCalibrationValues;
  currentIndex: number;
  isOpen: boolean;
  isFinalControlOpen: boolean;
  reviewIndex: number;
  reviewRound: number;
  reviewScenarioIds: PricingValidationExampleId[];
  reviewFeedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>;
  reviewReasons: Partial<Record<PricingValidationExampleId, ReviewReason>>;
  reviewRounds: Array<{
    feedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>;
    reasons: Partial<Record<PricingValidationExampleId, ReviewReason>>;
  }>;
};

type PricingCalibrationStep = {
  key: PricingCalibrationFieldKey;
  title: string;
  prompt: string;
  hint?: string;
  image?: StaticImageData;
  imageAlt?: string;
  imageLabel?: string;
};

const finalControlImages: Record<PricingValidationExampleId, StaticImageData> = {
  "text-low-boundary": textVisualImage,
  "colored-butterfly": butterflyImage,
  "current-dagger": currentDaggerImage,
  "feather-high-detail": featherImage,
  "realistic-eye": realisticEyeImage,
};

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat ayarı",
      description:
        "Minimum sayıda soruyla nasıl fiyat verdiğini öğrenelim. Her ekranda tek bir cevap girmen yeterli.",
      start: "Fiyat ayarını başlat",
      edit: "Cevapları düzenle",
      reset: "Sıfırla",
      close: "Daha sonra devam et",
      completed: "8 soru tamamlandı.",
      saveLater: "Cevapların bu cihazda korunur.",
      openingTitle: "En basit dövmen için minimum ücretin nedir?",
      openingHint: "Çok küçük ve basit bir dövme için alacağın en düşük fiyat.",
      sizeHint: "Aynı dövme, sadece boyut değişiyor. Kol gibi düz bir bölgede düşün.",
      size8Prompt: "Bu dövmeyi yaklaşık 8 cm boyutta kaça yaparsın?",
      size18Prompt: "Bu dövmeyi yaklaşık 18 cm boyutta kaça yaparsın?",
      size25Prompt: "Bu dövmeyi yaklaşık 25 cm boyutta kaça yaparsın?",
      detailHint: "Aynı boyut (≈18 cm) ve aynı bölgede düşün.",
      detailLowPrompt: "Bu seviyede bir dövmeyi kaça yaparsın?",
      detailHighPrompt: "Bu seviyede bir dövmeyi kaça yaparsın?",
      detailColorPrompt: "Bu dövme renkli olursa kaça yaparsın?",
      detailLowLabel: "Düşük detay",
      detailHighLabel: "Yüksek detay",
      detailColorLabel: "Renkli",
      anchorPrompt: "Bu dövmeyi yaklaşık 18 cm boyutta kaça yaparsın?",
      anchorLabel: "Anchor",
      priceLabel: "Fiyat",
      currency: "TL",
      back: "Geri",
      next: "Devam",
      finish: "Son kontrole geç",
      progress: "İlerleme",
      saving: "Kaydediliyor",
      saved: "Fiyat ayarı kaydedildi.",
      saveFailed: "Fiyat ayarı kaydedilemedi.",
      finalControlTitle: "Son kontrol",
      finalControlIntro: "Bu görseller için çıkan fiyatı hızlıca kontrol et.",
      finalControlPrompt: "Sence bu fiyat nasıl?",
      finalControlHint: "Yaklaşık boyutu ve düz bir bölgeyi düşün.",
      finalControlSave: "Ayarları kaydet",
      finalControlComplete: "Son kontrol tamamlandı.",
      low: "Düşük",
      okay: "Uygun",
      high: "Yüksek",
      reasonTitle: "Fark en çok nerede?",
      reasonSize: "Boyut",
      reasonDetail: "Detay",
      reasonColor: "Renk",
      reasonGeneral: "Genel",
      finalProgress: "Son kontrol",
      imageText: "Text",
      imageButterfly: "Colored butterfly",
      imageDagger: "Current dagger",
      imageFeather: "Feather",
      imageEye: "Realistic eye",
      assumedPlacement: "Düz bölge",
      estimatedPrice: "Tahmini fiyat",
    };
  }

  return {
    title: "Pricing setup",
    description: "Answer a few quick prompts so we can learn how you usually price your work.",
    start: "Start pricing setup",
    edit: "Edit answers",
    reset: "Reset",
    close: "Continue later",
    completed: "All 8 questions are complete.",
    saveLater: "Your answers stay on this device for now.",
    openingTitle: "What is your minimum price for the simplest tattoo?",
    openingHint: "The lowest price you would charge for a very small and simple tattoo.",
    sizeHint: "Same tattoo, only the size changes. Think of a flat placement like an arm.",
    size8Prompt: "What would you charge for this tattoo at around 8 cm?",
    size18Prompt: "What would you charge for this tattoo at around 18 cm?",
    size25Prompt: "What would you charge for this tattoo at around 25 cm?",
    detailHint: "Think of the same size (≈18 cm) and the same placement.",
    detailLowPrompt: "What would you charge for a tattoo at this level?",
    detailHighPrompt: "What would you charge for a tattoo at this level?",
    detailColorPrompt: "What would you charge if this tattoo were in color?",
    detailLowLabel: "Low detail",
    detailHighLabel: "High detail",
    detailColorLabel: "Color",
    anchorPrompt: "What would you charge for this tattoo at around 18 cm?",
    anchorLabel: "Anchor",
    priceLabel: "Price",
    currency: "TRY",
    back: "Back",
    next: "Next",
    finish: "Go to final check",
    progress: "Progress",
    saving: "Saving",
    saved: "Pricing setup saved.",
    saveFailed: "Pricing setup could not be saved.",
    finalControlTitle: "Final check",
    finalControlIntro: "Quickly review the price shown for these examples.",
    finalControlPrompt: "How does this price feel?",
    finalControlHint: "Think of the approximate size and a flat standard placement.",
    finalControlSave: "Save settings",
    finalControlComplete: "Final check completed.",
    low: "Low",
    okay: "Okay",
    high: "High",
    reasonTitle: "What feels most off?",
    reasonSize: "Size",
    reasonDetail: "Detail",
    reasonColor: "Color",
    reasonGeneral: "General",
    finalProgress: "Final check",
    imageText: "Text",
    imageButterfly: "Colored butterfly",
    imageDagger: "Current dagger",
    imageFeather: "Feather",
    imageEye: "Realistic eye",
    assumedPlacement: "Flat placement",
    estimatedPrice: "Estimated price",
  };
}

function buildInitialValues(pricingRules: ArtistPricingRules): PricingCalibrationValues {
  const rawInputs = pricingRules.calibrationExamples.pricingRawInputs;

  return {
    openingPrice: rawInputs?.minimumPrice
      ? String(Math.round(rawInputs.minimumPrice))
      : pricingRules.anchorPrice > 0
        ? String(Math.round(pricingRules.anchorPrice))
        : pricingRules.basePrice > 0
          ? String(Math.round(pricingRules.basePrice))
          : "",
    size8: rawInputs?.roseMedium8cm ? String(Math.round(rawInputs.roseMedium8cm)) : "",
    size18: rawInputs?.roseMedium18cm ? String(Math.round(rawInputs.roseMedium18cm)) : "",
    size25: rawInputs?.roseMedium25cm ? String(Math.round(rawInputs.roseMedium25cm)) : "",
    detailLow: rawInputs?.roseLow18cm ? String(Math.round(rawInputs.roseLow18cm)) : "",
    detailHigh: rawInputs?.roseHigh18cm ? String(Math.round(rawInputs.roseHigh18cm)) : "",
    detailColor: rawInputs?.roseColor18cm ? String(Math.round(rawInputs.roseColor18cm)) : "",
    anchor18: rawInputs?.daggerAnchor18cm ? String(Math.round(rawInputs.daggerAnchor18cm)) : "",
  };
}

function createEmptyDraft(pricingRules: ArtistPricingRules): PricingCalibrationDraft {
  return {
    values: buildInitialValues(pricingRules),
    currentIndex: 0,
    isOpen: false,
    isFinalControlOpen: false,
    reviewIndex: 0,
    reviewRound: 1,
    reviewScenarioIds: VALIDATION_SCENARIOS.map((scenario) => scenario.id),
    reviewFeedback: {},
    reviewReasons: {},
    reviewRounds: [],
  };
}

function findFirstIncompleteIndex(values: PricingCalibrationValues, steps: PricingCalibrationStep[]) {
  const nextIndex = steps.findIndex((step) => !values[step.key].trim());
  return nextIndex === -1 ? steps.length - 1 : nextIndex;
}

function buildSteps(locale: PublicLocale): PricingCalibrationStep[] {
  const copy = getText(locale);

  return [
    {
      key: "openingPrice",
      title: copy.openingTitle,
      prompt: copy.openingTitle,
      hint: copy.openingHint,
    },
    {
      key: "size8",
      title: copy.size8Prompt,
      prompt: copy.size8Prompt,
      hint: copy.sizeHint,
      image: mediumDetailImage,
      imageAlt: "Medium detail rose",
    },
    {
      key: "size18",
      title: copy.size18Prompt,
      prompt: copy.size18Prompt,
      hint: copy.sizeHint,
      image: mediumDetailImage,
      imageAlt: "Medium detail rose",
    },
    {
      key: "size25",
      title: copy.size25Prompt,
      prompt: copy.size25Prompt,
      hint: copy.sizeHint,
      image: mediumDetailImage,
      imageAlt: "Medium detail rose",
    },
    {
      key: "detailLow",
      title: copy.detailLowLabel,
      prompt: copy.detailLowPrompt,
      hint: copy.detailHint,
      image: lowDetailImage,
      imageAlt: copy.detailLowLabel,
    },
    {
      key: "detailHigh",
      title: copy.detailHighLabel,
      prompt: copy.detailHighPrompt,
      hint: copy.detailHint,
      image: highDetailImage,
      imageAlt: copy.detailHighLabel,
    },
    {
      key: "detailColor",
      title: copy.detailColorLabel,
      prompt: copy.detailColorPrompt,
      hint: copy.detailHint,
      image: colorMediumImage,
      imageAlt: copy.detailColorLabel,
    },
    {
      key: "anchor18",
      title: copy.anchorLabel,
      prompt:
        locale === "tr"
          ? "Bu dövmeyi kol gibi düz bir bölgede, yaklaşık 18 cm boyutta kaça yaparsın?"
          : "What would you charge for this tattoo at around 18 cm on a flat placement like an arm?",
      image: currentDaggerImage,
      imageAlt: copy.anchorLabel,
    },
  ];
}

const SIZE_GROUP_KEYS: PricingCalibrationFieldKey[] = ["size8", "size18", "size25"];

function isSizeGroupStep(key: PricingCalibrationFieldKey) {
  return SIZE_GROUP_KEYS.includes(key);
}

function normalizeStepIndex(index: number) {
  if (index >= 1 && index <= 3) {
    return 1;
  }

  return index;
}

function CurrencyInput({
  value,
  onChange,
  label,
  suffix,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  suffix: string;
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-14"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
          {suffix}
        </span>
      </div>
    </Field>
  );
}

function getScenarioLabel(id: PricingValidationExampleId, locale: PublicLocale) {
  const copy = getText(locale);

  switch (id) {
    case "text-low-boundary":
      return copy.imageText;
    case "colored-butterfly":
      return copy.imageButterfly;
    case "current-dagger":
      return copy.imageDagger;
    case "feather-high-detail":
      return copy.imageFeather;
    case "realistic-eye":
      return copy.imageEye;
  }
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
  const steps = useMemo(() => buildSteps(locale), [locale]);
  const storageKey = `tattix:pricing-onboarding-ui:${pricingRules.artistId}`;
  const [draft, setDraft] = useState<PricingCalibrationDraft>(() => createEmptyDraft(pricingRules));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingReviewFeedback, setPendingReviewFeedback] = useState<PricingValidationFeedback | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<PricingCalibrationDraft>;
      if (!parsed.values) {
        return;
      }

      const nextValues = {
        ...buildInitialValues(pricingRules),
        ...parsed.values,
      } satisfies PricingCalibrationValues;

      const nextIndex =
        typeof parsed.currentIndex === "number" && Number.isFinite(parsed.currentIndex)
          ? normalizeStepIndex(Math.max(0, Math.min(parsed.currentIndex, steps.length - 1)))
          : normalizeStepIndex(findFirstIncompleteIndex(nextValues, steps));

      setDraft({
        values: nextValues,
        currentIndex: nextIndex,
        isOpen: Boolean(parsed.isOpen) || Object.values(nextValues).some((value) => value.trim().length > 0),
        isFinalControlOpen: Boolean(parsed.isFinalControlOpen),
        reviewRound:
          typeof parsed.reviewRound === "number" && Number.isFinite(parsed.reviewRound)
            ? Math.max(1, parsed.reviewRound)
            : 1,
        reviewScenarioIds:
          Array.isArray(parsed.reviewScenarioIds) && parsed.reviewScenarioIds.length > 0
            ? parsed.reviewScenarioIds.filter((id): id is PricingValidationExampleId =>
                VALIDATION_SCENARIOS.some((scenario) => scenario.id === id),
              )
            : VALIDATION_SCENARIOS.map((scenario) => scenario.id),
        reviewIndex:
          typeof parsed.reviewIndex === "number" && Number.isFinite(parsed.reviewIndex)
            ? Math.max(
                0,
                Math.min(
                  parsed.reviewIndex,
                  Math.max(
                    0,
                    (Array.isArray(parsed.reviewScenarioIds) && parsed.reviewScenarioIds.length > 0
                      ? parsed.reviewScenarioIds.length
                      : VALIDATION_SCENARIOS.length) - 1,
                  ),
                ),
              )
            : 0,
        reviewFeedback: parsed.reviewFeedback ?? {},
        reviewReasons: parsed.reviewReasons ?? {},
        reviewRounds: Array.isArray(parsed.reviewRounds) ? parsed.reviewRounds : [],
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [pricingRules, steps, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, storageKey]);

  const completedCount = steps.filter((step) => draft.values[step.key].trim().length > 0).length;
  const isComplete = completedCount === steps.length;
  const currentStep = steps[draft.currentIndex] ?? steps[0];
  const canContinue = isSizeGroupStep(currentStep.key)
    ? SIZE_GROUP_KEYS.every((key) => draft.values[key].trim().length > 0)
    : draft.values[currentStep.key].trim().length > 0;
  const progressWidth = `${(completedCount / steps.length) * 100}%`;
  const currentScenarioId = draft.reviewScenarioIds[draft.reviewIndex] ?? draft.reviewScenarioIds[0];
  const currentScenario =
    VALIDATION_SCENARIOS.find((scenario) => scenario.id === currentScenarioId) ?? VALIDATION_SCENARIOS[0];
  const currentProbe = FINAL_CONTROL_PROBES.find((probe) => probe.id === currentScenario.id) ?? FINAL_CONTROL_PROBES[0];

  const previewRanges = useMemo(() => {
    const rawInputs: PricingCalibrationRawInputLike = {
      minimumPrice: Number(draft.values.openingPrice),
      roseMedium8cm: Number(draft.values.size8),
      roseMedium18cm: Number(draft.values.size18),
      roseMedium25cm: Number(draft.values.size25),
      roseLow18cm: Number(draft.values.detailLow),
      roseHigh18cm: Number(draft.values.detailHigh),
      roseColor18cm: Number(draft.values.detailColor),
      daggerAnchor18cm: Number(draft.values.anchor18),
    };

    const { sanitizedInputs, pricingProfile } = derivePricingProfile(rawInputs);
    const adjustedPricingProfile =
      draft.reviewRounds.length > 0
        ? applyFinalControlRoundsToPricingProfile(pricingProfile, draft.reviewRounds).pricingProfile
        : pricingProfile;
    const nextRules: ArtistPricingRules = {
      ...pricingRules,
      calibrationExamples: {
        ...pricingRules.calibrationExamples,
        pricingRawInputs: sanitizedInputs,
        pricingProfile: adjustedPricingProfile,
      },
    };
    const config = buildNormalizedQuoteConfig(nextRules);

    return VALIDATION_SCENARIOS.map((scenario) => {
      const input: NormalizedQuoteInput = {
        size:
          scenario.sizeCm <= 8
            ? "tiny"
            : scenario.sizeCm <= 12
              ? "small"
              : scenario.sizeCm <= 18
                ? "medium"
                : "large",
        sizeCm: scenario.sizeCm,
        placement: scenario.placement,
        detailLevel: scenario.detailLevel,
        colorMode: scenario.colorMode,
        coverUp: false,
        customDesign: false,
        designType: null,
      };

      return {
        id: scenario.id,
        range: estimateNormalizedQuote(input, config),
      };
    });
  }, [draft.reviewRounds, draft.values, pricingRules]);

  const currentRange = previewRanges.find((item) => item.id === currentScenario.id)?.range ?? previewRanges[0]?.range;
  const allReviewAnswered = draft.reviewScenarioIds.length === 0;

  function updateValue(key: PricingCalibrationFieldKey, value: string) {
    setDraft((current) => ({
      ...current,
      values: {
        ...current.values,
        [key]: value,
      },
    }));
  }

  function handleStart() {
    setStatusMessage(null);
    setDraft((current) => ({
      ...current,
      isOpen: true,
      isFinalControlOpen: false,
      currentIndex: normalizeStepIndex(findFirstIncompleteIndex(current.values, steps)),
      reviewIndex: 0,
      reviewRound: 1,
      reviewScenarioIds: VALIDATION_SCENARIOS.map((scenario) => scenario.id),
      reviewFeedback: {},
      reviewReasons: {},
      reviewRounds: [],
    }));
  }

  function handleClose() {
    setStatusMessage(null);
    setPendingReviewFeedback(null);
    setDraft((current) => ({
      ...current,
      isOpen: false,
      isFinalControlOpen: false,
    }));
  }

  function handleReset() {
    setStatusMessage(null);
    setPendingReviewFeedback(null);
    setDraft({
      ...createEmptyDraft(pricingRules),
      isOpen: true,
    });
  }

  function handleNext() {
    if (!canContinue) {
      return;
    }

    setStatusMessage(null);

    if (draft.currentIndex >= steps.length - 1) {
      setPendingReviewFeedback(null);
      setDraft((current) => ({
        ...current,
        isOpen: false,
        isFinalControlOpen: true,
        reviewIndex: 0,
        reviewRound: 1,
        reviewScenarioIds: VALIDATION_SCENARIOS.map((scenario) => scenario.id),
        reviewFeedback: {},
        reviewReasons: {},
        reviewRounds: [],
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      currentIndex: current.currentIndex === 1 ? 4 : current.currentIndex + 1,
    }));
  }

  function handleBack() {
    setStatusMessage(null);
    setDraft((current) => ({
      ...current,
      currentIndex:
        current.currentIndex === 4 ? 1 : Math.max(0, current.currentIndex - 1),
    }));
  }

  function advanceReview(nextDraft: PricingCalibrationDraft) {
    const atLastScenario = nextDraft.reviewIndex >= nextDraft.reviewScenarioIds.length - 1;

    if (!atLastScenario) {
      return {
        ...nextDraft,
        reviewIndex: nextDraft.reviewIndex + 1,
      };
    }

    const completedRound = {
      feedback: nextDraft.reviewFeedback,
      reasons: nextDraft.reviewReasons,
    };
    const reviewRounds = [...nextDraft.reviewRounds, completedRound];
    const remainingScenarioIds = nextDraft.reviewScenarioIds.filter(
      (scenarioId) => nextDraft.reviewFeedback[scenarioId] !== "looks-right",
    );

    if (!remainingScenarioIds.length) {
      setStatusMessage(copy.finalControlComplete);

      return {
        ...nextDraft,
        reviewIndex: 0,
        reviewRound: reviewRounds.length + 1,
        reviewScenarioIds: [],
        reviewFeedback: {},
        reviewReasons: {},
        reviewRounds,
        isFinalControlOpen: true,
      };
    }

    setStatusMessage(
      locale === "tr"
        ? "Fiyatları güncelledik. Uymayan görselleri tekrar kontrol et."
        : "We updated the prices. Review the examples that still feel off.",
    );

    return {
      ...nextDraft,
      reviewIndex: 0,
      reviewRound: reviewRounds.length + 1,
      reviewScenarioIds: remainingScenarioIds,
      reviewFeedback: {},
      reviewReasons: {},
      reviewRounds,
      isFinalControlOpen: true,
    };
  }

  function handleReviewFeedback(feedback: PricingValidationFeedback) {
    setStatusMessage(null);

    if (feedback === "looks-right") {
      setPendingReviewFeedback(null);
      setDraft((current) =>
        advanceReview({
          ...current,
          reviewFeedback: {
            ...current.reviewFeedback,
            [currentScenario.id]: feedback,
          },
        }),
      );
      return;
    }

    setPendingReviewFeedback(feedback);
  }

  function handleReviewReason(reason: ReviewReason) {
    if (!pendingReviewFeedback) {
      return;
    }

    setPendingReviewFeedback(null);
    setDraft((current) =>
      advanceReview({
        ...current,
        reviewFeedback: {
          ...current.reviewFeedback,
          [currentScenario.id]: pendingReviewFeedback,
        },
        reviewReasons: {
          ...current.reviewReasons,
          [currentScenario.id]: reason,
        },
      }),
    );
  }

  async function handleSave() {
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/dashboard/pricing/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minimumPrice: Number(draft.values.openingPrice),
          roseMedium8cm: Number(draft.values.size8),
          roseMedium18cm: Number(draft.values.size18),
          roseMedium25cm: Number(draft.values.size25),
          roseLow18cm: Number(draft.values.detailLow),
          roseHigh18cm: Number(draft.values.detailHigh),
          roseColor18cm: Number(draft.values.detailColor),
          daggerAnchor18cm: Number(draft.values.anchor18),
          finalControl: draft.reviewRounds.length > 0
            ? {
                validationRound: draft.reviewRounds.length,
                rounds: draft.reviewRounds,
              }
            : undefined,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setStatusMessage(payload?.message ?? copy.saveFailed);
        return;
      }

      setStatusMessage(copy.saved);
      setDraft((current) => ({
        ...current,
        isOpen: false,
        isFinalControlOpen: false,
      }));
      router.refresh();
    } finally {
      setIsSaving(false);
    }
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
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleStart} disabled={isSaving}>
                {completedCount > 0 ? copy.edit : copy.start}
              </Button>
              {(completedCount > 0 || draft.isOpen || draft.isFinalControlOpen) ? (
                <Button type="button" variant="ghost" onClick={handleReset} disabled={isSaving}>
                  <RotateCcw className="size-4" />
                  {copy.reset}
                </Button>
              ) : null}
              {(draft.isOpen || draft.isFinalControlOpen) ? (
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSaving}>
                  {copy.close}
                </Button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
              <Badge className="border border-white/10 bg-white/5 text-white">
                {completedCount} / {steps.length}
              </Badge>
              <span>{isComplete ? copy.completed : copy.saveLater}</span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{ width: progressWidth }}
              />
            </div>
          </div>

          {statusMessage ? <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p> : null}

          {draft.isOpen ? (
            <>
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    {copy.progress}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {draft.currentIndex + 1} / {steps.length}
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {isSizeGroupStep(currentStep.key)
                        ? locale === "tr"
                          ? "Bu dövmeyi farklı boyutlarda kaça yaparsın?"
                          : "What would you charge for this tattoo at different sizes?"
                        : currentStep.prompt}
                    </h3>
                    {currentStep.hint ? (
                      <p className="text-sm text-[var(--foreground-muted)]">{currentStep.hint}</p>
                    ) : null}
                  </div>

                  {currentStep.image ? (
                    <div className="overflow-hidden rounded-[20px] border border-white/8 bg-black/20 p-3">
                      <div className="mx-auto max-w-[360px] overflow-hidden rounded-[18px] border border-white/8 bg-black/10">
                        <div className="relative aspect-[4/3] w-full">
                          <Image
                            src={currentStep.image}
                            alt={currentStep.imageAlt ?? currentStep.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 360px"
                          />
                        </div>
                      </div>
                      {currentStep.imageLabel ? (
                        <p className="mt-3 text-center text-sm font-medium text-white">{currentStep.imageLabel}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {isSizeGroupStep(currentStep.key) ? (
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <div className="grid gap-4">
                        <CurrencyInput
                          label={copy.size8Prompt}
                          suffix={copy.currency}
                          value={draft.values.size8}
                          onChange={(value) => updateValue("size8", value)}
                        />
                        <CurrencyInput
                          label={copy.size18Prompt}
                          suffix={copy.currency}
                          value={draft.values.size18}
                          onChange={(value) => updateValue("size18", value)}
                        />
                        <CurrencyInput
                          label={copy.size25Prompt}
                          suffix={copy.currency}
                          value={draft.values.size25}
                          onChange={(value) => updateValue("size25", value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <CurrencyInput
                        label={copy.priceLabel}
                        suffix={copy.currency}
                        value={draft.values[currentStep.key]}
                        onChange={(value) => updateValue(currentStep.key, value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {draft.currentIndex > 0 ? (
                  <Button type="button" variant="ghost" onClick={handleBack} disabled={isSaving}>
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </Button>
                ) : null}

                <Button type="button" onClick={handleNext} disabled={!canContinue || isSaving}>
                  {draft.currentIndex === steps.length - 1 ? copy.finish : copy.next}
                  {draft.currentIndex === steps.length - 1 ? null : <ArrowRight className="size-4" />}
                </Button>
              </div>
            </>
          ) : null}

          {draft.isFinalControlOpen ? (
            <>
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    {copy.finalProgress}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {allReviewAnswered
                      ? copy.finalControlComplete
                      : `${draft.reviewIndex + 1} / ${draft.reviewScenarioIds.length}`}
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">{copy.finalControlTitle}</h3>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {allReviewAnswered
                        ? copy.finalControlComplete
                        : `${copy.finalControlIntro} ${locale === "tr" ? `${draft.reviewRound}. tur` : `Round ${draft.reviewRound}`}`}
                    </p>
                  </div>

                  {!allReviewAnswered ? (
                    <>
                      <div className="overflow-hidden rounded-[20px] border border-white/8 bg-black/20 p-3">
                        <div className="mx-auto max-w-[360px] overflow-hidden rounded-[18px] border border-white/8 bg-black/10">
                          <div className="relative aspect-[4/3] w-full">
                            <Image
                              src={finalControlImages[currentScenario.id]}
                              alt={getScenarioLabel(currentScenario.id, locale)}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, 360px"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                        <p className="text-sm font-medium text-white">
                          {getScenarioLabel(currentScenario.id, locale)}
                        </p>
                        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                          {currentProbe.assumedSizeCm} cm · {copy.assumedPlacement}
                        </p>
                        <p className="mt-4 text-base font-medium text-white">
                          {copy.estimatedPrice}: {currentRange?.min} - {currentRange?.max}
                        </p>
                        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{copy.finalControlHint}</p>
                      </div>

                      <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                        <p className="text-sm font-medium text-white">{copy.finalControlPrompt}</p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {[
                            { key: "slightly-low", label: copy.low },
                            { key: "looks-right", label: copy.okay },
                            { key: "slightly-high", label: copy.high },
                          ].map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => handleReviewFeedback(option.key as PricingValidationFeedback)}
                              className="rounded-[18px] border px-4 py-3 text-sm text-white transition"
                              style={{
                                borderColor:
                                  draft.reviewFeedback[currentScenario.id] === option.key || pendingReviewFeedback === option.key
                                    ? "var(--primary)"
                                    : "rgba(255,255,255,0.08)",
                                backgroundColor:
                                  draft.reviewFeedback[currentScenario.id] === option.key || pendingReviewFeedback === option.key
                                    ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                                    : "rgba(255,255,255,0.02)",
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        {pendingReviewFeedback && pendingReviewFeedback !== "looks-right" ? (
                          <div className="mt-4 rounded-[18px] border border-white/8 bg-black/20 p-4">
                            <p className="text-sm font-medium text-white">{copy.reasonTitle}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-4">
                              {[
                                { key: "size", label: copy.reasonSize },
                                { key: "detail", label: copy.reasonDetail },
                                { key: "color", label: copy.reasonColor },
                                { key: "general", label: copy.reasonGeneral },
                              ].map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => handleReviewReason(option.key as ReviewReason)}
                                  className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {locale === "tr"
                          ? "Tüm görseller uygun görünüyor. Ayarları şimdi kaydedebilirsin."
                          : "Everything looks right now. You can save these settings."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {!allReviewAnswered && draft.reviewIndex > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPendingReviewFeedback(null);
                      setDraft((current) => ({
                        ...current,
                        reviewIndex: Math.max(0, current.reviewIndex - 1),
                      }));
                    }}
                    disabled={isSaving}
                  >
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </Button>
                ) : null}

                <Button type="button" onClick={handleSave} disabled={!allReviewAnswered || isSaving}>
                  {isSaving ? copy.saving : copy.finalControlSave}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
