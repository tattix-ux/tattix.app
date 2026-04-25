"use client";

import { Expand, ImageIcon, LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PublicLocale } from "@/lib/i18n/public";
import { estimateCustomRequestPrice } from "@/lib/pricing/v2/custom-request";
import {
  PRICING_V2_LARGE_AREA_CASES,
  PRICING_V2_WIDE_AREA_CASES,
  PRICING_V2_ONBOARDING_CASES,
  PRICING_V2_REVIEW_CASES,
  PRICING_V2_WIDE_AREA_CASE_IDS,
  PRICING_V2_SIZE_SERIES_CASE_IDS,
  PRICING_V2_SPECIAL_CASE_IDS,
} from "@/lib/pricing/v2/onboarding-cases";
import { formatCurrencyValue, roundToFriendlyPrice } from "@/lib/pricing/v2/helpers";
import {
  buildPricingV2Profile,
  buildSuggestedLargeAreaCases,
  buildSuggestedOnboardingCases,
  buildSuggestedWideAreaCases,
  getArtistPricingV2Profile,
  getStoredPricingV2Profile,
} from "@/lib/pricing/v2/profile";
import { deriveReviewAdjustmentBias } from "@/lib/pricing/v2/size";
import type { ArtistPricingRules, PricingV2ReviewReason } from "@/lib/types";
import { cn } from "@/lib/utils";

type Verdict = "looks-right" | "slightly-low" | "slightly-high";
type Phase = 1 | 2 | 3 | 4;
type LargeAreaChoice = "enabled" | "disabled";
type StatusTone = "success" | "error" | null;
type ReviewCaseDraft = {
  verdict: Verdict | "";
  reason: PricingV2ReviewReason | "";
  adjustmentBias: number;
  iterationCount: number;
};

type PricingPreviewItem = {
  imageSlot: string;
  title: string;
  metaLine?: string;
};

function SurfaceBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_92%,black_8%)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:rounded-[16px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function StepHeaderButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[12px] border px-2.5 py-1.5 text-left text-[10px] leading-[1.3] transition",
        active
          ? "border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(214,177,122,0.18),rgba(155,110,69,0.10))] text-[var(--text-primary)] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
          : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.035)] hover:text-[var(--text-primary)]",
      )}
    >
      {label}
    </button>
  );
}

function AnchorInputCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <SurfaceBlock className="p-3 xl:p-2.5">
      <div className="space-y-1.5">
        <div className="space-y-0.5">
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">{title}</p>
          {description ? <p className="text-[10.5px] leading-[1.3] text-[var(--text-secondary)]">{description}</p> : null}
        </div>
        {children}
      </div>
    </SurfaceBlock>
  );
}

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      phases: [
        {
          navLabel: "1. Temel fiyat ayarları",
          title: "Temel fiyat ayarlarını yapalım",
          description: "",
        },
        {
          navLabel: "2. Farklı işleri karşılaştıralım",
          title: "Farklı işleri karşılaştıralım",
          description: "Bu örnekler, farklı işlerde fiyat yaklaşımını netleştirir.",
        },
        {
          navLabel: "3. Son kontrol",
          title: "Son kontrol",
          description: "Şimdi oluşan tahminlerin sana ne kadar uyduğunu kontrol edelim.",
        },
        {
          navLabel: "4. Geniş alan çalışmaları",
          title: "Geniş alan çalışmaları için de fiyat girmek ister misin?",
          description: "İstersen büyük alan kaplayan işler için de ayrı başlangıç fiyatları belirleyebilirsin.",
        },
      ],
      minimumJobPrice: "En küçük işlerde başladığın fiyat",
      textStartingPrice: "Yazı gibi çok basit işlerde başladığın fiyat",
      minimumJobPriceDescription: "",
      textStartingPriceDescription: "",
      phaseOneNote: "",
      estimateDisabledHint: "",
      sizeSeriesTitle: "Aynı tasarım büyüdükçe fiyatın nasıl değişiyor?",
      sizeSeriesDescription: "Burada tasarım aynı kalır; sadece boyut değişir.",
      specialCasesTitle: "Farklı işleri karşılaştıralım",
      caseTitle: "",
      largeAreasChoice: "Bu adımı açmak ister misin?",
      largeAreasChoiceDescription: "İstersen büyük alan kaplayan işler için de ayrı başlangıç fiyatları belirleyebilirsin.",
      phaseFiveNote: "Büyük alan çalışmaları almıyorsan bu kısmı boş bırakabilirsin.",
      largeAreasOptions: {
        enabled: "Evet",
        disabled: "Şimdilik hayır",
      },
      largeAreaCasesTitle: "Tek bölgede geniş alan örnekleri",
      wideAreaCasesTitle: "Çok geniş alan örnekleri",
      startingFrom: "Başlangıç fiyatı",
      min: "Fiyat alt sınırı",
      max: "Fiyat üst sınırı",
      placeholderAsset: "Örnek görsel alanı",
      placeholderHelp: "Görseli sonra ekleyebilirsin.",
      reviewTitle: "Bu tahmin sana uygun mu?",
      reviewNote: "Buradaki seçimler, sistemin tahminlerini sana yaklaştırmak için kullanılır.",
      reviewReasonLabel: "Neden böyle geldi?",
      reviewUpdate: "Tahmini güncelle",
      reviewNeedsAdjustment: "Uygun değilse nedeni seçip tahmini güncelle.",
      reviewAdjusted: "Tahmin güncellendi. Hâlâ uymuyorsa yeniden ayarlayabilirsin.",
      verdicts: {
        "looks-right": "Uygun",
        "slightly-low": "Biraz düşük",
        "slightly-high": "Biraz yüksek",
      },
      back: "Geri",
      next: "Devam",
      save: "Fiyat ayarlarını kaydet",
      saving: "Kaydediliyor",
      saved: "Fiyat ayarların kaydedildi.",
      failed: "Ayarlar kaydedilirken bir sorun oluştu. Tekrar dene.",
      estimate: "Müşteriye gösterilecek fiyat tahmini",
      previewImage: "Büyüt",
      previewTitle: "Görsel önizleme",
      closePreview: "Kapat",
      currency: "TL",
      optionalSinglePriceHint: "Bu işler için tek bir başlangıç fiyatı göstermek çoğu zaman daha uygundur.",
    };
  }

  return {
    phases: [
      {
        navLabel: "1. Set the starting points",
        title: "Let’s set the base prices",
        description: "First, let’s define the base prices and how size changes them.",
      },
      {
        navLabel: "2. Let’s look at different cases",
        title: "Let’s look at different cases",
        description: "These examples help us understand your pricing in special situations.",
      },
      {
        navLabel: "3. Do one final check",
        title: "Let’s do one final check",
        description: "Finally, let’s make sure these estimates feel right for you.",
      },
      {
        navLabel: "4. Large coverage work",
        title: "Do you want to show large coverage work too?",
        description: "If you want, we can also set starting levels for bigger pieces.",
      },
    ],
    minimumJobPrice: "Where do your smallest jobs usually start?",
    textStartingPrice: "Where do very simple text jobs usually start?",
    minimumJobPriceDescription: "This sets the lower level the system uses for most small jobs.",
    textStartingPriceDescription: "Very simple text-like jobs stay close to this.",
    estimateDisabledHint: "If you leave this section empty, clients will not see a price estimate.",
    sizeSeriesTitle: "How does your pricing change when the same piece gets bigger?",
    sizeSeriesDescription: "The design stays the same here. Only the size changes.",
    specialCasesTitle: "Let’s look at different cases",
    specialCasesDescription: "These examples help us understand your pricing in special situations.",
    caseTitle: "",
    largeAreasChoice: "Do you want to enable this step?",
    largeAreasChoiceDescription: "If you want, we can also set starting levels for bigger pieces.",
    largeAreasOptions: {
      enabled: "Yes",
      disabled: "Not for now",
    },
    largeAreaCasesTitle: "Large coverage examples for a single area",
    wideAreaCasesTitle: "Very wide coverage examples",
    startingFrom: "Starting level",
    min: "Price floor",
    max: "Price ceiling",
    placeholderAsset: "Example image area",
    placeholderHelp: "You can add the real image later.",
    reviewTitle: "Does this estimate feel right?",
    reviewReasonLabel: "What feels off here?",
    reviewUpdate: "Update estimate",
    reviewNeedsAdjustment: "If it is not right yet, choose the reason and update the estimate.",
    reviewAdjusted: "Estimate updated. If it still feels off, you can adjust it again.",
    verdicts: {
      "looks-right": "Looks right",
      "slightly-low": "A bit low",
      "slightly-high": "A bit high",
    },
    back: "Back",
    next: "Next",
      save: "Save pricing settings",
      saving: "Saving",
      saved: "Your pricing settings are saved.",
      failed: "Something went wrong while saving. Try again.",
      estimate: "The price estimate shown to the client",
      previewImage: "Expand",
      previewTitle: "Image preview",
      closePreview: "Close",
      currency: "TRY",
      phaseOneNote: "The range shown to the client is an approximate price.",
      reviewNote: "These choices help pull the system estimates closer to your pricing.",
      phaseFiveNote: "Leave this blank if you do not take large coverage work.",
      optionalSinglePriceHint: "For these pieces, showing a single starting price is usually more suitable.",
    };
}

function CurrencyInput({
  value,
  onChange,
  label,
  suffix,
  helper,
  normalizeOnBlur = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  suffix: string;
  helper?: string;
  normalizeOnBlur?: boolean;
}) {
  return (
    <Field label={label} description={helper}>
      <div className="relative">
        <Input
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            if (!normalizeOnBlur || !value.trim()) {
              return;
            }

            onChange(String(roundToFriendlyPrice(toInputNumber(value), "nearest")));
          }}
          className="h-7.5 rounded-[12px] border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] pr-10 text-[12px]"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-4 -translate-y-1/2 items-center text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {suffix}
        </span>
      </div>
    </Field>
  );
}

function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
  columnsClassName = "sm:grid-cols-3",
  segmented = false,
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; description?: string }>;
  columnsClassName?: string;
  segmented?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columnsClassName,
        segmented && "rounded-[16px] border border-white/8 bg-white/[0.03] p-1",
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[14px] border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-0",
              active
                ? "border-[var(--accent)]/34 bg-[var(--accent)]/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : segmented
                  ? "border-transparent bg-transparent text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_8%)] hover:border-white/10 hover:bg-white/[0.04]"
                  : "border-white/8 bg-white/[0.015] text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_8%)] hover:border-white/16 hover:bg-white/[0.04]",
            )}
          >
            <span className="text-[12px] font-medium">{option.label}</span>
            {option.description ? (
              <span
                className={cn(
                  "mt-0.5 block text-[10.5px] leading-[1.3]",
                  active
                    ? "text-[color:color-mix(in_srgb,white_88%,var(--foreground-muted)_12%)]"
                    : "text-[color:color-mix(in_srgb,var(--foreground-muted)_86%,white_6%)]",
                )}
              >
                {option.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function getPlacementDetail(bucket: "easy" | "standard" | "hard") {
  if (bucket === "hard") {
    return "ribs";
  }

  if (bucket === "standard") {
    return "wrist";
  }

  return "forearm-outer";
}

function toInputNumber(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toDisplayCurrency(value: number, locale: PublicLocale) {
  return formatCurrencyValue(value, locale, "TRY");
}

function getEstimateDisplayClass(displayLabel: string) {
  return displayLabel.trim().endsWith("+") ? "text-[2.15rem]" : "text-2xl";
}

function getSizeLabel(sizeCm: number, locale: PublicLocale) {
  return locale === "tr" ? `Boyut · ${sizeCm} cm` : `Size · ${sizeCm} cm`;
}

function buildReviewReasonOptionLabel(
  reason: PricingV2ReviewReason,
  verdict: Verdict,
  locale: PublicLocale,
) {
  if (locale !== "tr") {
    return reason;
  }

  const suffix = verdict === "slightly-low" ? "düşük geldi" : "yüksek geldi";

  switch (reason) {
    case "size":
      return `Boyut için ${suffix}`;
    case "detail":
      return `Detay için ${suffix}`;
    case "placement":
      return `Bölge için ${suffix}`;
    case "color_shading":
      return `Renk / gölge için ${suffix}`;
    case "cover_up":
      return `Kapatma işi olduğu için ${suffix}`;
    case "general":
      return `Genel olarak ${suffix}`;
  }
}

function getReviewReasonOptions(
  item: (typeof PRICING_V2_REVIEW_CASES)[number],
  verdict: Verdict,
  locale: PublicLocale,
) {
  const options: PricingV2ReviewReason[] = ["size", "detail", "placement", "general"];

  if (item.colorMode !== "black-only" || item.workStyle === "shaded_detailed") {
    options.splice(3, 0, "color_shading");
  }

  if (item.coverUp) {
    options.splice(options.length - 1, 0, "cover_up");
  }

  return options.map((reason) => ({
    value: reason,
    label: buildReviewReasonOptionLabel(reason, verdict, locale),
  }));
}

function createDefaultReviewCase(): ReviewCaseDraft {
  return {
    verdict: "",
    reason: "",
    adjustmentBias: 1,
    iterationCount: 0,
  };
}

function buildReviewCaseState(initialProfile: ReturnType<typeof getArtistPricingV2Profile>) {
  return Object.fromEntries(
    PRICING_V2_REVIEW_CASES.map((reviewItem) => {
      const item = initialProfile.reviewCases.find((entry) => entry.id === reviewItem.id);

      if (!item) {
        return [reviewItem.id, createDefaultReviewCase()];
      }

      return [
        item.id,
        {
          verdict: item.verdict,
          reason: item.reason ?? "",
          adjustmentBias:
            typeof item.adjustmentBias === "number"
              ? item.adjustmentBias
              : item.verdict === "looks-right"
                ? 1
                : deriveReviewAdjustmentBias({
                    verdict: item.verdict,
                    reason: item.reason,
                    currentBias: 1,
                    iterationCount: item.iterationCount ?? 0,
                  }),
          iterationCount: item.iterationCount ?? 0,
        } satisfies ReviewCaseDraft,
      ];
    }),
  ) as Record<string, ReviewCaseDraft>;
}

function areRangeAnswersEqual(
  current: Array<{ id: string; min: string; max: string }>,
  next: Array<{ id: string; min: string; max: string }>,
) {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((item, index) => {
    const candidate = next[index];
    return (
      candidate &&
      item.id === candidate.id &&
      item.min === candidate.min &&
      item.max === candidate.max
    );
  });
}

function areStartingAnswersEqual(
  current: Array<{ id: string; startingFrom: string }>,
  next: Array<{ id: string; startingFrom: string }>,
) {
  if (current.length !== next.length) {
    return false;
  }

  return current.every((item, index) => {
    const candidate = next[index];
    return (
      candidate &&
      item.id === candidate.id &&
      item.startingFrom === candidate.startingFrom
    );
  });
}

function ImageSlotPreview({
  imageSlot,
  imagePresentation,
  placeholderAsset,
  placeholderHelp,
  variant = "case",
  onPreview,
  previewLabel = "Expand",
}: {
  imageSlot: string;
  imagePresentation?: {
    fit?: "cover" | "contain";
    frameClassName?: string;
    imageClassName?: string;
    sizeClassName?: string;
  };
  placeholderAsset: string;
  placeholderHelp: string;
  variant?: "case" | "review" | "showcase";
  onPreview?: (() => void) | undefined;
  previewLabel?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const frameClassName =
    imagePresentation?.frameClassName ?? "bg-white/[0.97] px-4 py-4";
  const fitClassName = imagePresentation?.fit === "cover" ? "object-cover" : "object-contain";
  const sizeClassName =
    imagePresentation?.sizeClassName ??
    (variant === "case"
      ? "h-[148px] md:h-[164px]"
      : variant === "showcase"
        ? "h-[220px] md:h-[248px]"
        : "h-[144px] md:h-[156px]");

  if (!imageSlot || hasError) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-[18px] border border-dashed border-white/10 bg-[color:color-mix(in_srgb,var(--background)_94%,white_2%)] px-3 text-center", sizeClassName)}>
        <ImageIcon className="size-5 text-[var(--accent-soft)]" />
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--accent-soft)]">
          {placeholderAsset}
        </p>
        <p className="mt-2 text-xs leading-5 text-[color:color-mix(in_srgb,var(--foreground-muted)_86%,white_6%)]">
          {placeholderHelp}
        </p>
      </div>
    );
  }

  return onPreview ? (
    <button
      type="button"
      onClick={onPreview}
      className="group relative block w-full overflow-hidden rounded-[18px] text-left transition hover:-translate-y-0.5"
    >
      <div className={cn("overflow-hidden rounded-[16px] border border-white/10 bg-[color:color-mix(in_srgb,var(--background)_94%,white_2%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", sizeClassName)}>
        <div className={cn("relative flex h-full w-full items-center justify-center", frameClassName)}>
          <img
            src={imageSlot}
            alt=""
            className={cn("h-full w-full transition duration-200 group-hover:scale-[1.06]", fitClassName, imagePresentation?.imageClassName)}
            onError={() => setHasError(true)}
          />
          <span className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-black/8 bg-white/92 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-black/72 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <Expand className="size-3" />
            {previewLabel}
          </span>
        </div>
      </div>
    </button>
  ) : (
    <div className={cn("overflow-hidden rounded-[16px] border border-white/10 bg-[color:color-mix(in_srgb,var(--background)_94%,white_2%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", sizeClassName)}>
      <div className={cn("flex h-full w-full items-center justify-center", frameClassName)}>
        <img
          src={imageSlot}
          alt=""
          className={cn("h-full w-full", fitClassName, imagePresentation?.imageClassName)}
          onError={() => setHasError(true)}
        />
      </div>
    </div>
  );
}

export function PricingForm({
  pricingRules,
  locale = "en",
}: {
  pricingRules: ArtistPricingRules;
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const copy = getText(locale);
  const initialProfile = useMemo(() => getArtistPricingV2Profile(pricingRules), [pricingRules]);
  const storedProfile = useMemo(() => getStoredPricingV2Profile(pricingRules), [pricingRules]);
  const [phase, setPhase] = useState<Phase>(1);
  const currentPhaseCopy = copy.phases[phase - 1];
  const [previewItem, setPreviewItem] = useState<PricingPreviewItem | null>(null);
  const [highlightedSizeCaseId, setHighlightedSizeCaseId] = useState<string>(
    PRICING_V2_SIZE_SERIES_CASE_IDS[1] ?? PRICING_V2_SIZE_SERIES_CASE_IDS[0] ?? "",
  );
  const [minimumJobPrice, setMinimumJobPrice] = useState(
    storedProfile ? String(storedProfile.minimumJobPrice) : "",
  );
  const [textStartingPrice, setTextStartingPrice] = useState(
    storedProfile ? String(storedProfile.textStartingPrice) : "",
  );
  const [largeAreaChoice, setLargeAreaChoice] = useState<LargeAreaChoice>(
    storedProfile?.onboardingLargeAreasEnabled ? "enabled" : "disabled",
  );
  const [hasEditedCaseRanges, setHasEditedCaseRanges] = useState(false);
  const [statusTone, setStatusTone] = useState<StatusTone>(null);
  const suggestedCases = useMemo(
    () =>
      buildSuggestedOnboardingCases({
        minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
        textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
      }),
    [
      initialProfile.minimumJobPrice,
      initialProfile.textStartingPrice,
      minimumJobPrice,
      textStartingPrice,
    ],
  );
  const [onboardingCases, setOnboardingCases] = useState(
    suggestedCases.map((item) => {
      const existing = storedProfile?.onboardingCases.find((caseItem) => caseItem.id === item.id);
      return {
        id: item.id,
        min: existing ? String(existing.min) : "",
        max: existing ? String(existing.max) : "",
      };
    }),
  );
  const suggestedLargeAreaCases = useMemo(
    () =>
      buildSuggestedLargeAreaCases({
        minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
        onboardingCases: onboardingCases.map((item) => ({
          id: item.id,
          min: toInputNumber(item.min),
          max: toInputNumber(item.max),
        })),
      }),
    [initialProfile.minimumJobPrice, minimumJobPrice, onboardingCases],
  );
  const suggestedWideAreaCases = useMemo(
    () =>
      buildSuggestedWideAreaCases(
        suggestedLargeAreaCases.map((item) => ({
          id: item.id,
          min: item.min,
          max: item.max,
        })),
        toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
      ),
    [initialProfile.minimumJobPrice, minimumJobPrice, suggestedLargeAreaCases],
  );
  const [largeAreaCases, setLargeAreaCases] = useState(
    suggestedLargeAreaCases.map((item) => {
      const existing = storedProfile?.largeAreaCases.find((caseItem) => caseItem.id === item.id);
      return {
        id: item.id,
        min: existing ? String(existing.min) : "",
        max: existing ? String(existing.max) : "",
      };
    }),
  );
  const [wideAreaCases, setWideAreaCases] = useState(
    suggestedWideAreaCases.map((item) => {
      const existing = storedProfile?.wideAreaCases.find((caseItem) => caseItem.id === item.id);
      return {
        id: item.id,
        startingFrom: existing ? String(existing.startingFrom) : "",
      };
    }),
  );
  const [reviewCases, setReviewCases] = useState<Record<string, ReviewCaseDraft>>(
    buildReviewCaseState(initialProfile),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!previewItem) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem]);

  useEffect(() => {
    if (hasEditedCaseRanges || !storedProfile) {
      return;
    }

    const nextOnboardingCases = suggestedCases.map((item) => ({
      id: item.id,
      min: String(item.min),
      max: String(item.max),
    }));
    const nextLargeAreaCases = suggestedLargeAreaCases.map((item) => ({
      id: item.id,
      min: String(item.min),
      max: String(item.max),
    }));
    const nextWideAreaCases = suggestedWideAreaCases.map((item) => ({
      id: item.id,
      startingFrom: String(item.startingFrom),
    }));

    setOnboardingCases((current) =>
      areRangeAnswersEqual(current, nextOnboardingCases) ? current : nextOnboardingCases,
    );
    setLargeAreaCases((current) =>
      areRangeAnswersEqual(current, nextLargeAreaCases) ? current : nextLargeAreaCases,
    );
    setWideAreaCases((current) =>
      areStartingAnswersEqual(current, nextWideAreaCases) ? current : nextWideAreaCases,
    );
  }, [hasEditedCaseRanges, storedProfile, suggestedCases, suggestedLargeAreaCases, suggestedWideAreaCases]);

  const derivedProfile = useMemo(
    () =>
      buildPricingV2Profile({
        minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
        textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
        onboardingCases: onboardingCases.map((item) => ({
          id: item.id,
          min: toInputNumber(item.min),
          max: toInputNumber(item.max),
        })),
        onboardingLargeAreasEnabled: largeAreaChoice === "enabled",
        largeAreaCases: largeAreaCases.map((item) => ({
          id: item.id,
          min: toInputNumber(item.min),
          max: toInputNumber(item.max),
        })),
        wideAreaCases: wideAreaCases.map((item) => ({
          id: item.id,
          startingFrom: toInputNumber(item.startingFrom),
        })),
        reviewCases: Object.entries(reviewCases)
          .filter(([, item]) => Boolean(item.verdict))
          .map(([id, item]) => ({
            id,
            verdict: item.verdict as Verdict,
            reason: item.reason || undefined,
            adjustmentBias: item.adjustmentBias,
            iterationCount: item.iterationCount,
          })),
      }),
    [
      initialProfile.minimumJobPrice,
      initialProfile.textStartingPrice,
      largeAreaCases,
      largeAreaChoice,
      minimumJobPrice,
      onboardingCases,
      reviewCases,
      textStartingPrice,
      wideAreaCases,
    ],
  );

  const reviewEstimates = useMemo(
    () =>
      PRICING_V2_REVIEW_CASES.map((item) => {
        const reviewCase = reviewCases[item.id];
        const profileForCase = buildPricingV2Profile({
          minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
          textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
          onboardingCases: onboardingCases.map((entry) => ({
            id: entry.id,
            min: toInputNumber(entry.min),
            max: toInputNumber(entry.max),
          })),
          onboardingLargeAreasEnabled: largeAreaChoice === "enabled",
          largeAreaCases: largeAreaCases.map((entry) => ({
            id: entry.id,
            min: toInputNumber(entry.min),
            max: toInputNumber(entry.max),
          })),
          wideAreaCases: wideAreaCases.map((entry) => ({
            id: entry.id,
            startingFrom: toInputNumber(entry.startingFrom),
          })),
          reviewCases:
            reviewCase && reviewCase.verdict
              ? [
                  {
                    id: item.id,
                    verdict: reviewCase.verdict as Verdict,
                    reason: reviewCase.reason || undefined,
                    adjustmentBias: reviewCase.adjustmentBias,
                    iterationCount: reviewCase.iterationCount,
                  },
                ]
              : [],
        });

        return {
          ...item,
          estimate: estimateCustomRequestPrice(
            {
              areaScope: "standard_piece",
              requestType: item.requestType,
              placement: item.placementDetail ?? getPlacementDetail(item.placementBucket),
              sizeCm: item.referenceSizeCm,
              colorMode: item.colorMode,
              workStyle: item.workStyle,
              realismLevel: item.realismLevel,
              hasReferenceImage: true,
              hasReferenceNote: false,
              coverUp: item.coverUp,
            },
            {
              locale,
              currency: "TRY",
              pricingRules,
              profile: profileForCase,
            },
          ),
        };
      }),
    [
      initialProfile.minimumJobPrice,
      initialProfile.textStartingPrice,
      largeAreaCases,
      largeAreaChoice,
      locale,
      minimumJobPrice,
      onboardingCases,
      pricingRules,
      reviewCases,
      textStartingPrice,
      wideAreaCases,
    ],
  );
  const sizeSeriesCaseIds = new Set<string>(PRICING_V2_SIZE_SERIES_CASE_IDS);
  const specialCaseIds = new Set<string>(PRICING_V2_SPECIAL_CASE_IDS);
  const sizeSeriesCases = PRICING_V2_ONBOARDING_CASES.filter((item) => sizeSeriesCaseIds.has(item.id));
  const specialCases = PRICING_V2_ONBOARDING_CASES.filter((item) => specialCaseIds.has(item.id));
  const largeAreaDisplayCases = PRICING_V2_LARGE_AREA_CASES;
  const wideAreaDisplayCases = PRICING_V2_WIDE_AREA_CASES;
  const sharedSizeSeriesImage = sizeSeriesCases[0] ?? null;
  const highlightedSizeCase =
    sizeSeriesCases.find((item) => item.id === highlightedSizeCaseId) ?? sizeSeriesCases[1] ?? sizeSeriesCases[0] ?? null;

  const phaseOneComplete =
    Boolean(minimumJobPrice && textStartingPrice) &&
    sizeSeriesCases.every((item) => {
      const currentCase = onboardingCases.find((entry) => entry.id === item.id);
      return Boolean(currentCase?.min.trim() && currentCase?.max.trim());
    });
  const phaseTwoComplete = specialCases.every((item) => {
    const currentCase = onboardingCases.find((entry) => entry.id === item.id);
    return Boolean(currentCase?.min.trim() && currentCase?.max.trim());
  });
  const phaseThreeComplete = reviewEstimates.every((item) => reviewCases[item.id]?.verdict === "looks-right");
  const phaseFourComplete =
    largeAreaChoice === "disabled" ||
    (largeAreaCases.every((item) => item.min.trim() && item.max.trim()) &&
      wideAreaCases.every((item) => item.startingFrom.trim()));

  async function handleSave() {
    setIsSaving(true);
    setStatusMessage(null);
    setStatusTone(null);

    try {
      const response = await fetch("/api/dashboard/pricing/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
          textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
          onboardingCases: onboardingCases.map((item) => ({
            id: item.id,
            min: toInputNumber(item.min),
            max: toInputNumber(item.max),
          })),
          onboardingLargeAreasEnabled: largeAreaChoice === "enabled",
          largeAreaCases: largeAreaCases.map((item) => ({
            id: item.id,
            min: toInputNumber(item.min),
            max: toInputNumber(item.max),
          })),
          wideAreaCases: wideAreaCases.map((item) => ({
            id: item.id,
            startingFrom: toInputNumber(item.startingFrom),
          })),
          reviewCases: Object.entries(reviewCases)
            .filter(([, item]) => Boolean(item.verdict))
            .map(([id, item]) => ({
              id,
              verdict: item.verdict as Verdict,
              reason: item.reason || undefined,
              adjustmentBias: item.adjustmentBias,
              iterationCount: item.iterationCount,
            })),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "save-failed");
      }

      setStatusTone("success");
      setStatusMessage(copy.saved);
      router.refresh();
    } catch (error) {
      console.error("[pricing-v2-save]", error);
      setStatusTone("error");
      setStatusMessage(copy.failed);
    } finally {
      setIsSaving(false);
    }
  }

  function updateReviewCase(
    id: string,
    updater: (current: ReviewCaseDraft) => ReviewCaseDraft,
  ) {
    setReviewCases((current) => ({
      ...current,
      [id]: updater(current[id] ?? createDefaultReviewCase()),
    }));
  }

  function handleReviewVerdictChange(id: string, verdict: Verdict) {
    updateReviewCase(id, (current) => ({
      ...current,
      verdict,
      reason: verdict === "looks-right" ? current.reason : "",
    }));
  }

  function handleReviewAdjustmentApply(id: string) {
    updateReviewCase(id, (current) => {
      if (!current.verdict || current.verdict === "looks-right" || !current.reason) {
        return current;
      }

      return {
        ...current,
        adjustmentBias: deriveReviewAdjustmentBias({
          verdict: current.verdict,
          reason: current.reason,
          currentBias: current.adjustmentBias,
          iterationCount: current.iterationCount,
        }),
        iterationCount: current.iterationCount + 1,
      };
    });
  }

  return (
    <>
    <Card className="surface-border overflow-hidden border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_90%,black_8%)_100%)] shadow-[0_18px_44px_rgba(0,0,0,0.16)]">
      <CardHeader className="space-y-1.5 pb-1.5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
            {locale === "tr" ? `Adım ${phase} / 4` : `Step ${phase} / 4`}
          </div>
          <div>
            <CardTitle className="text-[0.92rem] tracking-[-0.02em]">{currentPhaseCopy.title}</CardTitle>
            <CardDescription className="mt-0.5 max-w-[62ch] text-[11.5px] leading-[1.35] text-[var(--text-secondary)]">
              {currentPhaseCopy.description}
            </CardDescription>
          </div>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-4">
          {copy.phases.map((phaseItem, index) => (
            <StepHeaderButton
              key={phaseItem.navLabel}
              active={phase === index + 1}
              label={phaseItem.navLabel}
              onClick={() => setPhase((index + 1) as Phase)}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">

        {phase === 1 ? (
          <div className="space-y-3">
            <div className="grid gap-2.5 lg:grid-cols-2">
              <AnchorInputCard title={copy.minimumJobPrice} description={copy.minimumJobPriceDescription}>
                <CurrencyInput
                  value={minimumJobPrice}
                  onChange={setMinimumJobPrice}
                  label={copy.min}
                  suffix={copy.currency}
                  normalizeOnBlur
                />
              </AnchorInputCard>
              <AnchorInputCard title={copy.textStartingPrice} description={copy.textStartingPriceDescription}>
                <CurrencyInput
                  value={textStartingPrice}
                  onChange={setTextStartingPrice}
                  label={copy.startingFrom}
                  suffix={copy.currency}
                  normalizeOnBlur
                />
              </AnchorInputCard>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{copy.sizeSeriesTitle}</p>
                <p className="text-[12px] leading-[1.35] text-[var(--text-secondary)]">
                  {copy.sizeSeriesDescription}
                </p>
              </div>
              <SurfaceBlock className="p-2.5 sm:p-3">
                <div className="grid gap-2.5 lg:grid-cols-[minmax(210px,248px)_minmax(0,1fr)] lg:items-start xl:grid-cols-[250px_minmax(0,1fr)]">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex rounded-full border border-[var(--border-soft)] bg-[rgba(214,177,122,0.10)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent)]">
                        {highlightedSizeCase ? getSizeLabel(highlightedSizeCase.referenceSizeCm, locale) : copy.sizeSeriesTitle}
                      </span>
                    </div>
                    {sharedSizeSeriesImage ? (
                      <div className="rounded-[18px] border border-[var(--border-soft)] bg-[radial-gradient(circle_at_top,rgba(214,177,122,0.08),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-2">
                        <ImageSlotPreview
                          imageSlot={sharedSizeSeriesImage.imageSlot}
                          imagePresentation={sharedSizeSeriesImage.imagePresentation}
                          placeholderAsset={copy.placeholderAsset}
                          placeholderHelp={copy.placeholderHelp}
                          variant="showcase"
                          previewLabel={copy.previewImage}
                          onPreview={() =>
                            setPreviewItem({
                              imageSlot: sharedSizeSeriesImage.imageSlot,
                              title: sharedSizeSeriesImage.title[locale],
                              metaLine: highlightedSizeCase
                                ? [getSizeLabel(highlightedSizeCase.referenceSizeCm, locale), highlightedSizeCase.metaLine[locale]].join(" · ")
                                : sharedSizeSeriesImage.metaLine[locale],
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {sizeSeriesCases.map((item) => {
                      const currentCase = onboardingCases.find((entry) => entry.id === item.id);

                      if (!currentCase) {
                        return null;
                      }
                      const active = highlightedSizeCaseId === item.id;

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHighlightedSizeCaseId(item.id)}
                          onFocus={() => setHighlightedSizeCaseId(item.id)}
                          className={cn(
                            "rounded-[16px] border p-2.5 transition",
                            active
                              ? "border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(214,177,122,0.10),rgba(255,255,255,0.02))] shadow-[0_12px_26px_rgba(0,0,0,0.16)]"
                              : "border-[var(--border-soft)] bg-[rgba(255,255,255,0.025)] hover:border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.04)]",
                          )}
                        >
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-semibold leading-snug text-[var(--text-primary)]">{item.title[locale]}</p>
                                <span className="inline-flex rounded-full border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                  {getSizeLabel(item.referenceSizeCm, locale)}
                                </span>
                              </div>
                              <p className="text-[12px] leading-[1.35] text-[var(--text-secondary)]">
                                {item.metaLine[locale]}
                              </p>
                              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                                {getSizeLabel(item.referenceSizeCm, locale)}
                              </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <CurrencyInput
                                value={currentCase.min}
                                onChange={(value) => {
                                  setHasEditedCaseRanges(true);
                                  setOnboardingCases((current) =>
                                    current.map((entry) => (entry.id === item.id ? { ...entry, min: value } : entry)),
                                  );
                                }}
                                label={copy.min}
                                suffix={copy.currency}
                                normalizeOnBlur
                              />
                              <CurrencyInput
                                value={currentCase.max}
                                onChange={(value) => {
                                  setHasEditedCaseRanges(true);
                                  setOnboardingCases((current) =>
                                    current.map((entry) => (entry.id === item.id ? { ...entry, max: value } : entry)),
                                  );
                                }}
                                label={copy.max}
                                suffix={copy.currency}
                                normalizeOnBlur
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </SurfaceBlock>
            </div>
          </div>
        ) : null}

        {phase === 2 ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="grid gap-2.5 xl:grid-cols-2">
                {specialCases.map((item) => {
                  const currentCase = onboardingCases.find((entry) => entry.id === item.id);

                  if (!currentCase) {
                    return null;
                  }

                  return (
                    <SurfaceBlock key={item.id} className="p-2.5">
                      <div className="grid gap-2.5">
                        <ImageSlotPreview
                          imageSlot={item.imageSlot}
                          imagePresentation={item.imagePresentation}
                          placeholderAsset={copy.placeholderAsset}
                          placeholderHelp={copy.placeholderHelp}
                          variant="case"
                          previewLabel={copy.previewImage}
                          onPreview={() =>
                            setPreviewItem({
                              imageSlot: item.imageSlot,
                              title: item.title[locale],
                              metaLine: [getSizeLabel(item.referenceSizeCm, locale), item.metaLine[locale]].join(" · "),
                            })
                          }
                        />
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <p className="text-[12px] font-semibold leading-snug text-white">{item.title[locale]}</p>
                            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                              {getSizeLabel(item.referenceSizeCm, locale)}
                            </p>
                            <p className="text-[11px] leading-[1.3] text-[var(--text-secondary)]">
                              {item.metaLine[locale]}
                            </p>
                          </div>
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            <CurrencyInput
                              value={currentCase.min}
                              onChange={(value) => {
                                setHasEditedCaseRanges(true);
                                setOnboardingCases((current) =>
                                  current.map((entry) => (entry.id === item.id ? { ...entry, min: value } : entry)),
                                );
                              }}
                              label={copy.min}
                              suffix={copy.currency}
                              normalizeOnBlur
                            />
                            <CurrencyInput
                              value={currentCase.max}
                              onChange={(value) => {
                                setHasEditedCaseRanges(true);
                                setOnboardingCases((current) =>
                                  current.map((entry) => (entry.id === item.id ? { ...entry, max: value } : entry)),
                                );
                              }}
                              label={copy.max}
                              suffix={copy.currency}
                              normalizeOnBlur
                            />
                          </div>
                        </div>
                      </div>
                    </SurfaceBlock>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {phase === 3 ? (
          <div className="space-y-2">
            <p className="text-[12px] text-[color:color-mix(in_srgb,var(--foreground-muted)_86%,white_6%)]">
              {copy.reviewNote}
            </p>
            <div className="grid gap-2.5 xl:grid-cols-2">
            {reviewEstimates.map((item) => {
              const reviewCase = reviewCases[item.id] ?? createDefaultReviewCase();
              const needsReason = Boolean(
                reviewCase.verdict && reviewCase.verdict !== "looks-right",
              );

              return (
                <SurfaceBlock key={item.id} className="p-2.5">
                  <div className="grid gap-2.5">
                    <ImageSlotPreview
                      imageSlot={item.imageSlot}
                      imagePresentation={item.imagePresentation}
                      placeholderAsset={copy.placeholderAsset}
                      placeholderHelp={copy.placeholderHelp}
                      variant="review"
                      previewLabel={copy.previewImage}
                      onPreview={() =>
                        setPreviewItem({
                          imageSlot: item.imageSlot,
                          title: item.title[locale],
                          metaLine: [getSizeLabel(item.referenceSizeCm, locale), item.metaLine[locale]].join(" · "),
                        })
                      }
                    />
                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <p className="text-[12px] font-semibold leading-snug text-white">{item.title[locale]}</p>
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                          {getSizeLabel(item.referenceSizeCm, locale)}
                        </p>
                        <p className="text-[11px] leading-[1.3] text-[var(--text-secondary)]">
                          {item.metaLine[locale]}
                        </p>
                        <p className="pt-0.5 text-[10.5px] text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
                          {copy.estimate}
                        </p>
                        <p className={cn("font-semibold tracking-tight text-white", getEstimateDisplayClass(item.estimate.displayLabel))}>
                          {item.estimate.displayLabel}
                        </p>
                      </div>
                      <Field label={copy.reviewTitle}>
                        <ChoiceGroup
                          value={reviewCase.verdict}
                          onChange={(value) => handleReviewVerdictChange(item.id, value)}
                          options={[
                            { value: "looks-right", label: copy.verdicts["looks-right"] },
                            { value: "slightly-low", label: copy.verdicts["slightly-low"] },
                            { value: "slightly-high", label: copy.verdicts["slightly-high"] },
                          ]}
                          columnsClassName="sm:grid-cols-3"
                          segmented
                        />
                      </Field>

                      {needsReason ? (
                        <div className="space-y-2 rounded-[14px] border border-[var(--accent)]/12 bg-[linear-gradient(180deg,rgba(247,177,93,0.06),rgba(255,255,255,0.01))] p-2">
                          <Field
                            label={copy.reviewReasonLabel}
                            description={
                              reviewCase.iterationCount > 0
                                ? copy.reviewAdjusted
                                : copy.reviewNeedsAdjustment
                            }
                          >
                            <ChoiceGroup
                              value={reviewCase.reason}
                              onChange={(value) =>
                                updateReviewCase(item.id, (current) => ({
                                  ...current,
                                  reason: value,
                                }))
                              }
                              options={getReviewReasonOptions(item, reviewCase.verdict as Verdict, locale)}
                              columnsClassName="sm:grid-cols-2"
                            />
                          </Field>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-[10.5px] text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
                              {reviewCase.iterationCount > 0
                                ? locale === "tr"
                                  ? `${reviewCase.iterationCount}. düzeltme uygulandı`
                                  : `${reviewCase.iterationCount} adjustment${reviewCase.iterationCount > 1 ? "s" : ""} applied`
                                : copy.reviewNeedsAdjustment}
                            </p>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleReviewAdjustmentApply(item.id)}
                              disabled={!reviewCase.reason}
                            >
                              {copy.reviewUpdate}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </SurfaceBlock>
              );
            })}
            </div>
          </div>
        ) : null}

        {phase === 4 ? (
          <div className="space-y-3">
            <Field label={copy.largeAreasChoice}>
              <ChoiceGroup
                value={largeAreaChoice}
                onChange={setLargeAreaChoice}
                options={[
                  { value: "enabled", label: copy.largeAreasOptions.enabled },
                  { value: "disabled", label: copy.largeAreasOptions.disabled },
                ]}
                columnsClassName="sm:grid-cols-2"
              />
            </Field>
            <p className="text-[12px] text-[color:color-mix(in_srgb,var(--foreground-muted)_86%,white_6%)]">
              {copy.phaseFiveNote}
            </p>

            {largeAreaChoice === "enabled" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-medium text-[var(--text-primary)]">{copy.largeAreaCasesTitle}</p>
                  </div>
                  <div className="grid gap-2.5 xl:grid-cols-2">
                    {largeAreaDisplayCases.map((item) => {
                      const currentCase = largeAreaCases.find((entry) => entry.id === item.id);

                      if (!currentCase) {
                        return null;
                      }

                      return (
                        <SurfaceBlock key={item.id} className="p-2.5">
                          <div
                            className={cn(
                              "grid gap-2.5",
                              item.cardLayoutClassName ?? "",
                            )}
                          >
                            <ImageSlotPreview
                              imageSlot={item.imageSlot}
                              imagePresentation={item.imagePresentation}
                              placeholderAsset={copy.placeholderAsset}
                              placeholderHelp={copy.placeholderHelp}
                              variant="case"
                              previewLabel={copy.previewImage}
                              onPreview={() =>
                                setPreviewItem({
                                  imageSlot: item.imageSlot,
                                  title: item.title[locale],
                                  metaLine: item.metaLine[locale],
                                })
                              }
                            />
                            <div className="space-y-2">
                              <div className="space-y-0.5">
                                <p className="text-[12px] font-semibold leading-snug text-white">{item.title[locale]}</p>
                                <p className="text-[11px] leading-[1.3] text-[var(--text-secondary)]">
                                  {item.metaLine[locale]}
                                </p>
                                </div>
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                <CurrencyInput
                                  value={currentCase.min}
                                  onChange={(value) => {
                                    setHasEditedCaseRanges(true);
                                    setLargeAreaCases((current) =>
                                      current.map((entry) => (entry.id === item.id ? { ...entry, min: value } : entry)),
                                    );
                                  }}
                                  label={copy.min}
                                  suffix={copy.currency}
                                  normalizeOnBlur
                                />
                                <CurrencyInput
                                  value={currentCase.max}
                                  onChange={(value) => {
                                    setHasEditedCaseRanges(true);
                                    setLargeAreaCases((current) =>
                                      current.map((entry) => (entry.id === item.id ? { ...entry, max: value } : entry)),
                                    );
                                  }}
                                  label={copy.max}
                                  suffix={copy.currency}
                                  normalizeOnBlur
                                />
                              </div>
                            </div>
                          </div>
                        </SurfaceBlock>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-medium text-[var(--text-primary)]">{copy.wideAreaCasesTitle}</p>
                    <p className="text-[11px] text-[color:color-mix(in_srgb,var(--foreground-muted)_86%,white_6%)]">
                      {copy.optionalSinglePriceHint}
                    </p>
                  </div>
                  <div className="grid gap-2.5 xl:grid-cols-2">
                    {wideAreaDisplayCases.map((item) => {
                      const currentCase = wideAreaCases.find((entry) => entry.id === item.id);

                      if (!currentCase) {
                        return null;
                      }

                      return (
                        <SurfaceBlock key={item.id} className="p-2.5">
                          <div
                            className={cn(
                              "grid gap-2.5",
                              item.cardLayoutClassName ?? "",
                            )}
                          >
                            <ImageSlotPreview
                              imageSlot={item.imageSlot}
                              imagePresentation={item.imagePresentation}
                              placeholderAsset={copy.placeholderAsset}
                              placeholderHelp={copy.placeholderHelp}
                              variant="case"
                              previewLabel={copy.previewImage}
                              onPreview={() =>
                                setPreviewItem({
                                  imageSlot: item.imageSlot,
                                  title: item.title[locale],
                                  metaLine: item.metaLine[locale],
                                })
                              }
                            />
                            <div className="space-y-2">
                              <div className="space-y-0.5">
                                <p className="text-[12px] font-semibold leading-snug text-white">{item.title[locale]}</p>
                                <p className="text-[11px] leading-[1.3] text-[var(--text-secondary)]">
                                  {item.metaLine[locale]}
                                </p>
                              </div>
                              <div className="max-w-[240px]">
                                <CurrencyInput
                                  value={currentCase.startingFrom}
                                  onChange={(value) => {
                                    setHasEditedCaseRanges(true);
                                    setWideAreaCases((current) =>
                                      current.map((entry) =>
                                        entry.id === item.id ? { ...entry, startingFrom: value } : entry,
                                      ),
                                    );
                                  }}
                                  label={copy.startingFrom}
                                  suffix={copy.currency}
                                  normalizeOnBlur
                                />
                              </div>
                              <p className="border-t border-white/8 pt-2 text-[1.55rem] font-semibold tracking-tight text-white">
                                {`${toDisplayCurrency(toInputNumber(currentCase.startingFrom), locale)}+`}
                              </p>
                            </div>
                          </div>
                        </SurfaceBlock>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2.5 border-t border-[var(--border-soft)] pt-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p
              className={cn(
                "text-sm",
                statusTone === "success"
                  ? "text-emerald-300"
                  : statusTone === "error"
                    ? "text-rose-300"
                    : "text-[var(--text-muted)]",
              )}
            >
              {statusMessage ?? ""}
            </p>
            <p className="text-xs text-[var(--text-dim)]">
              {locale === "tr"
                ? "Bu ayarları daha sonra yine düzenleyebilirsin."
                : "You can adjust these settings again later."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {phase > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setPhase((current) => Math.max(1, current - 1) as Phase)} className="h-9 px-4">
                {copy.back}
              </Button>
            ) : null}
            {phase < 4 ? (
              <Button
                type="button"
                onClick={() => setPhase((current) => (current + 1) as Phase)}
                className="h-10 min-w-[128px] px-5"
                disabled={
                  (phase === 1 && !phaseOneComplete) ||
                  (phase === 2 && !phaseTwoComplete) ||
                  (phase === 3 && !phaseThreeComplete)
                }
              >
                {copy.next}
              </Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={isSaving || !phaseFourComplete} className="h-10 min-w-[200px] px-5">
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {isSaving ? copy.saving : copy.save}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    {previewItem ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm"
        onClick={() => setPreviewItem(null)}
      >
        <div
          className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-[color:color-mix(in_srgb,var(--background)_92%,black_6%)] p-4 shadow-[0_28px_70px_rgba(0,0,0,0.4)] sm:p-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-base font-semibold text-white">{previewItem.title}</p>
              {previewItem.metaLine ? (
                <p className="mt-1 text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
                  {previewItem.metaLine}
                </p>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewItem(null)} aria-label={copy.closePreview}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.98] p-4 sm:p-6">
            <img
              src={previewItem.imageSlot}
              alt={previewItem.title}
              className="h-[72vh] w-full object-contain"
            />
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
