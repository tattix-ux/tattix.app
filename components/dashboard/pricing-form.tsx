"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import daggerImage from "@/sample-tattoos/dagger.png";
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
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";

type PricingCalibrationFieldKey =
  | "openingPrice"
  | "size8"
  | "size18"
  | "size25"
  | "detailLow"
  | "detailHigh"
  | "detailColor"
  | "anchor18";

type PricingCalibrationValues = Record<PricingCalibrationFieldKey, string>;

type PricingCalibrationDraft = {
  values: PricingCalibrationValues;
  currentIndex: number;
  isOpen: boolean;
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
      finish: "Tamamla",
      progress: "İlerleme",
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
    finish: "Finish",
    progress: "Progress",
  };
}

function buildInitialValues(pricingRules: ArtistPricingRules): PricingCalibrationValues {
  return {
    openingPrice:
      pricingRules.anchorPrice > 0
        ? String(Math.round(pricingRules.anchorPrice))
        : pricingRules.basePrice > 0
          ? String(Math.round(pricingRules.basePrice))
          : "",
    size8: "",
    size18: "",
    size25: "",
    detailLow: "",
    detailHigh: "",
    detailColor: "",
    anchor18: "",
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
      imageLabel: copy.detailLowLabel,
    },
    {
      key: "detailHigh",
      title: copy.detailHighLabel,
      prompt: copy.detailHighPrompt,
      hint: copy.detailHint,
      image: highDetailImage,
      imageAlt: copy.detailHighLabel,
      imageLabel: copy.detailHighLabel,
    },
    {
      key: "detailColor",
      title: copy.detailColorLabel,
      prompt: copy.detailColorPrompt,
      hint: copy.detailHint,
      image: colorMediumImage,
      imageAlt: copy.detailColorLabel,
      imageLabel: copy.detailColorLabel,
    },
    {
      key: "anchor18",
      title: copy.anchorLabel,
      prompt: copy.anchorPrompt,
      image: daggerImage,
      imageAlt: copy.anchorLabel,
    },
  ];
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

export function PricingForm({
  pricingRules,
  styles: _styles,
  locale = "en",
}: {
  pricingRules: ArtistPricingRules;
  styles: ArtistStyleOption[];
  locale?: PublicLocale;
}) {
  const copy = getText(locale);
  const steps = useMemo(() => buildSteps(locale), [locale]);
  const storageKey = `tattix:pricing-onboarding-ui:${pricingRules.artistId}`;
  const [draft, setDraft] = useState<PricingCalibrationDraft>({
    values: buildInitialValues(pricingRules),
    currentIndex: 0,
    isOpen: false,
  });

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
          ? Math.max(0, Math.min(parsed.currentIndex, steps.length - 1))
          : findFirstIncompleteIndex(nextValues, steps);

      setDraft({
        values: nextValues,
        currentIndex: nextIndex,
        isOpen: Boolean(parsed.isOpen) || Object.values(nextValues).some((value) => value.trim().length > 0),
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
  const canContinue = draft.values[currentStep.key].trim().length > 0;
  const progressWidth = `${(completedCount / steps.length) * 100}%`;

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
    setDraft((current) => ({
      ...current,
      isOpen: true,
      currentIndex: findFirstIncompleteIndex(current.values, steps),
    }));
  }

  function handleClose() {
    setDraft((current) => ({
      ...current,
      isOpen: false,
    }));
  }

  function handleReset() {
    setDraft({
      values: buildInitialValues(pricingRules),
      currentIndex: 0,
      isOpen: true,
    });
  }

  function handleNext() {
    if (!canContinue) {
      return;
    }

    setDraft((current) => {
      if (current.currentIndex >= steps.length - 1) {
        return {
          ...current,
          isOpen: false,
          currentIndex: steps.length - 1,
        };
      }

      return {
        ...current,
        currentIndex: current.currentIndex + 1,
      };
    });
  }

  function handleBack() {
    setDraft((current) => ({
      ...current,
      currentIndex: Math.max(0, current.currentIndex - 1),
    }));
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
              <Button type="button" onClick={handleStart}>
                {completedCount > 0 ? copy.edit : copy.start}
              </Button>
              {(completedCount > 0 || draft.isOpen) ? (
                <Button type="button" variant="ghost" onClick={handleReset}>
                  <RotateCcw className="size-4" />
                  {copy.reset}
                </Button>
              ) : null}
              {draft.isOpen ? (
                <Button type="button" variant="ghost" onClick={handleClose}>
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
                    <h3 className="text-lg font-semibold text-white">{currentStep.prompt}</h3>
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

                  <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                    <CurrencyInput
                      label={copy.priceLabel}
                      suffix={copy.currency}
                      value={draft.values[currentStep.key]}
                      onChange={(value) => updateValue(currentStep.key, value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {draft.currentIndex > 0 ? (
                  <Button type="button" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="size-4" />
                    {copy.back}
                  </Button>
                ) : null}

                <Button type="button" onClick={handleNext} disabled={!canContinue}>
                  {draft.currentIndex === steps.length - 1 ? copy.finish : copy.next}
                  {draft.currentIndex === steps.length - 1 ? null : <ArrowRight className="size-4" />}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
