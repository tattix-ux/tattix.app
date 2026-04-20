"use client";

import { ImageIcon, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PublicLocale } from "@/lib/i18n/public";
import { estimateCustomRequestPrice } from "@/lib/pricing/v2/custom-request";
import { PRICING_V2_ONBOARDING_CASES, PRICING_V2_REVIEW_CASES } from "@/lib/pricing/v2/onboarding-cases";
import { formatCurrencyValue, roundToFriendlyPrice } from "@/lib/pricing/v2/helpers";
import { buildPricingV2Profile, buildSuggestedOnboardingCases, getArtistPricingV2Profile } from "@/lib/pricing/v2/profile";
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type Verdict = "looks-right" | "slightly-low" | "slightly-high";
type Phase = 1 | 2 | 3;
type StatusTone = "success" | "error" | null;

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat yapını tanıyalım",
      description: "Müşteriye gösterilecek başlangıç seviyesini birlikte netleştirelim.",
      phases: [
        "1. Fiyat yapını tanıyalım",
        "2. Birkaç örnek üzerinden ilerleyelim",
        "3. Son bir kontrol yapalım",
      ],
      minimumJobPrice: "En küçük işlerde genelde başladığın fiyat",
      textStartingPrice: "Yazı gibi çok basit işlerde çoğu zaman başladığın fiyat",
      colorImpact: "Renkli işler genelde fiyatı ne kadar etkiler?",
      coverUpImpact: "Kapatma işleri genelde nasıl olur?",
      workStyleTitle: "Bazı işlerde fiyatın biraz daha değişebilir. Kısaca bunu da tanıyalım.",
      workStyleFields: {
        clean_line: "Sade çizgisel işler",
        shaded_detailed: "Daha işçilikli / gölgeli işler",
        precision_symmetric: "Hassas / simetrik işler",
      },
      leadPreference: "Sistemin nasıl çalışmasını istersin?",
      colorOptions: {
        low: "Pek etkilemez",
        medium: "Biraz yükseltir",
        high: "Belirgin yükseltir",
      },
      coverUpOptions: {
        medium: "Biraz daha yüksek olur",
        high: "Belirgin daha yüksek olur",
      },
      leadOptions: {
        lead_friendly: "Daha fazla lead gelsin",
        balanced: "Dengeli olsun",
        filtered: "Daha filtreli lead gelsin",
      },
      caseTitle: "Bu iş için müşteriye hangi bandı göstermek istersin?",
      min: "Alt sınır",
      max: "Üst sınır",
      placeholderAsset: "Örnek görsel alanı",
      placeholderHelp: "Görseli sonra ekleyebilirsin.",
      reviewTitle: "Bu tahmin nasıl duruyor?",
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
      estimate: "Müşterinin göreceği fiyat",
      currency: "TL",
    };
  }

  return {
    title: "Let’s learn your pricing style",
    description: "Let’s shape the starting prices your clients will see.",
    phases: [
      "1. Learn your pricing style",
      "2. Review a few example cases",
      "3. Do one final check",
    ],
    minimumJobPrice: "Where do your smallest jobs usually start?",
    textStartingPrice: "Where do very simple text jobs usually start?",
    colorImpact: "How much do color jobs usually affect the price?",
    coverUpImpact: "How do cover-up jobs usually feel?",
    workStyleTitle: "Some jobs may shift your pricing a bit more. Let’s quickly learn that too.",
    workStyleFields: {
      clean_line: "Clean line pieces",
      shaded_detailed: "More worked / shaded pieces",
      precision_symmetric: "Precise / symmetric pieces",
    },
    leadPreference: "How do you want the system to behave?",
    colorOptions: {
      low: "Barely changes it",
      medium: "Raises it a bit",
      high: "Raises it clearly",
    },
    coverUpOptions: {
      medium: "Usually a bit higher",
      high: "Usually clearly higher",
    },
    leadOptions: {
      lead_friendly: "Bring in more leads",
      balanced: "Keep it balanced",
      filtered: "Filter leads a bit more",
    },
    caseTitle: "What range would you want to show for this case?",
    min: "Min",
    max: "Max",
    placeholderAsset: "Example image area",
    placeholderHelp: "You can add the real image later.",
    reviewTitle: "How does this estimate feel?",
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
    estimate: "What the client would see",
    currency: "TRY",
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
          className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pr-14"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
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
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  columnsClassName?: string;
}) {
  return (
    <div className={cn("grid gap-2", columnsClassName)}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35 focus-visible:ring-offset-0",
              active
                ? "border-[var(--accent)]/34 bg-[var(--accent)]/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "border-white/8 bg-white/[0.015] text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_8%)] hover:border-white/16 hover:bg-white/[0.04]",
            )}
          >
            <span className="text-sm font-medium">{option.label}</span>
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

function ImageSlotPreview({
  imageSlot,
  placeholderAsset,
  placeholderHelp,
}: {
  imageSlot: string;
  placeholderAsset: string;
  placeholderHelp: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!imageSlot || hasError) {
    return (
      <div className="flex h-[124px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/10 bg-[color:color-mix(in_srgb,var(--background)_94%,white_2%)] px-4 text-center">
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

  return (
    <div className="h-[124px] overflow-hidden rounded-[20px] border border-white/10 bg-[color:color-mix(in_srgb,var(--background)_94%,white_2%)]">
      <img
        src={imageSlot}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
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
  const router = useRouter();
  const copy = getText(locale);
  const initialProfile = useMemo(() => getArtistPricingV2Profile(pricingRules), [pricingRules]);
  const [phase, setPhase] = useState<Phase>(1);
  const [minimumJobPrice, setMinimumJobPrice] = useState(String(initialProfile.minimumJobPrice));
  const [textStartingPrice, setTextStartingPrice] = useState(String(initialProfile.textStartingPrice));
  const [colorImpactPreference, setColorImpactPreference] = useState(initialProfile.colorImpactPreference);
  const [coverUpImpactPreference, setCoverUpImpactPreference] = useState(initialProfile.coverUpImpactPreference);
  const [workStyleSensitivity, setWorkStyleSensitivity] = useState({
    clean_line: initialProfile.workStyleSensitivity.cleanLine,
    shaded_detailed: initialProfile.workStyleSensitivity.shadedDetailed,
    precision_symmetric: initialProfile.workStyleSensitivity.precisionSymmetric,
  });
  const [leadPreference, setLeadPreference] = useState(initialProfile.leadPreference);
  const [hasEditedCaseRanges, setHasEditedCaseRanges] = useState(false);
  const [statusTone, setStatusTone] = useState<StatusTone>(null);
  const suggestedCases = useMemo(
    () =>
      buildSuggestedOnboardingCases({
        minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
        textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
        colorImpactPreference,
        coverUpImpactPreference,
        workStyleSensitivity,
      }),
    [
      colorImpactPreference,
      coverUpImpactPreference,
      initialProfile.minimumJobPrice,
      initialProfile.textStartingPrice,
      minimumJobPrice,
      textStartingPrice,
      workStyleSensitivity,
    ],
  );
  const [onboardingCases, setOnboardingCases] = useState(
    suggestedCases.map((item) => {
      const existing = initialProfile.onboardingCases.find((caseItem) => caseItem.id === item.id);
      return {
        id: item.id,
        min: String(existing?.min ?? item.min),
        max: String(existing?.max ?? item.max),
      };
    }),
  );
  const [reviewCases, setReviewCases] = useState<Record<string, Verdict>>(
    Object.fromEntries(initialProfile.reviewCases.map((item) => [item.id, item.verdict])),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (hasEditedCaseRanges) {
      return;
    }

    setOnboardingCases(
      suggestedCases.map((item) => ({
        id: item.id,
        min: String(item.min),
        max: String(item.max),
      })),
    );
  }, [hasEditedCaseRanges, suggestedCases]);

  const derivedProfile = useMemo(
    () =>
      buildPricingV2Profile({
        minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
        textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
        colorImpactPreference,
        coverUpImpactPreference,
        workStyleSensitivity,
        leadPreference,
        onboardingCases: onboardingCases.map((item) => ({
          id: item.id,
          min: toInputNumber(item.min),
          max: toInputNumber(item.max),
        })),
        reviewCases: Object.entries(reviewCases).map(([id, verdict]) => ({ id, verdict })),
      }),
    [
      colorImpactPreference,
      coverUpImpactPreference,
      initialProfile.minimumJobPrice,
      initialProfile.textStartingPrice,
      leadPreference,
      minimumJobPrice,
      onboardingCases,
      reviewCases,
      textStartingPrice,
      workStyleSensitivity,
    ],
  );

  const reviewEstimates = useMemo(
    () =>
      PRICING_V2_REVIEW_CASES.map((item) => ({
        ...item,
        estimate: estimateCustomRequestPrice(
          {
            requestType: item.requestType,
            placement: getPlacementDetail(item.placementBucket),
            sizeCm: item.referenceSizeCm,
            colorMode: item.colorMode,
            workStyle: item.workStyle,
            hasReferenceImage: true,
            hasReferenceNote: false,
          },
          {
            locale,
            currency: "TRY",
            pricingRules,
            profile: derivedProfile,
          },
        ),
      })),
    [derivedProfile, locale, pricingRules],
  );

  const phaseOneComplete = Boolean(minimumJobPrice && textStartingPrice);
  const phaseTwoComplete = onboardingCases.every((item) => item.min.trim() && item.max.trim());
  const phaseThreeComplete = reviewEstimates.every((item) => Boolean(reviewCases[item.id]));

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
          colorImpactPreference,
          coverUpImpactPreference,
          workStyleSensitivity,
          leadPreference,
          onboardingCases: onboardingCases.map((item) => ({
            id: item.id,
            min: toInputNumber(item.min),
            max: toInputNumber(item.max),
          })),
          reviewCases: Object.entries(reviewCases).map(([id, verdict]) => ({ id, verdict })),
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

  return (
    <Card className="surface-border overflow-hidden border-white/8 bg-[color:color-mix(in_srgb,var(--background)_95%,white_2.5%)] shadow-[0_16px_34px_rgba(0,0,0,0.14)]">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription className="mt-2 max-w-[56ch] text-[15px] leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
              {copy.description}
            </CardDescription>
          </div>
          <Badge variant="muted" className="w-fit">
            v2
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid gap-2 sm:grid-cols-3">
          {copy.phases.map((label, index) => {
            const active = phase === index + 1;
            return (
              <div
                key={label}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-[var(--accent)]/28 bg-[var(--accent)]/[0.11] text-white"
                    : "border-white/8 bg-white/[0.015] text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]",
                )}
              >
                {label}
              </div>
            );
          })}
        </div>

        {phase === 1 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <CurrencyInput
              value={minimumJobPrice}
              onChange={setMinimumJobPrice}
              label={copy.minimumJobPrice}
              suffix={copy.currency}
              helper={locale === "tr" ? "Minimum iş çizgini belirler." : "Sets the baseline for your smallest jobs."}
              normalizeOnBlur
            />
            <CurrencyInput
              value={textStartingPrice}
              onChange={setTextStartingPrice}
              label={copy.textStartingPrice}
              suffix={copy.currency}
              helper={locale === "tr" ? "Yazı ve en basit işler buna yakın davranır." : "Text and very simple jobs stay close to this."}
              normalizeOnBlur
            />
            <Field label={copy.colorImpact} className="lg:col-span-2">
              <ChoiceGroup
                value={colorImpactPreference}
                onChange={setColorImpactPreference}
                options={[
                  { value: "low", label: copy.colorOptions.low },
                  { value: "medium", label: copy.colorOptions.medium },
                  { value: "high", label: copy.colorOptions.high },
                ]}
              />
            </Field>
            <Field label={copy.coverUpImpact} className="lg:col-span-2">
              <ChoiceGroup
                value={coverUpImpactPreference}
                onChange={setCoverUpImpactPreference}
                options={[
                  { value: "medium", label: copy.coverUpOptions.medium },
                  { value: "high", label: copy.coverUpOptions.high },
                ]}
              />
            </Field>
            <div className="space-y-3 rounded-[24px] border border-white/8 bg-white/[0.02] p-4 lg:col-span-2">
              <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
                {copy.workStyleTitle}
              </p>
              <div className="space-y-4">
                {(
                  [
                    ["clean_line", copy.workStyleFields.clean_line],
                    ["shaded_detailed", copy.workStyleFields.shaded_detailed],
                    ["precision_symmetric", copy.workStyleFields.precision_symmetric],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <ChoiceGroup
                      value={workStyleSensitivity[key]}
                      onChange={(value) =>
                        setWorkStyleSensitivity((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                      options={[
                        { value: "low", label: copy.colorOptions.low },
                        { value: "medium", label: copy.colorOptions.medium },
                        { value: "high", label: copy.colorOptions.high },
                      ]}
                    />
                  </Field>
                ))}
              </div>
            </div>
            <Field label={copy.leadPreference} className="lg:col-span-2">
              <ChoiceGroup
                value={leadPreference}
                onChange={setLeadPreference}
                options={[
                  { value: "lead_friendly", label: copy.leadOptions.lead_friendly },
                  { value: "balanced", label: copy.leadOptions.balanced },
                  { value: "filtered", label: copy.leadOptions.filtered },
                ]}
              />
            </Field>
          </div>
        ) : null}

        {phase === 2 ? (
          <div className="space-y-3">
            <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
              {locale === "tr"
                ? "İstersen önerilen bandları düzenle. Tam oturması yeterli, milimetrik olmasına gerek yok."
                : "Adjust the suggested bands if you want. They only need to feel roughly right."}
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
            {PRICING_V2_ONBOARDING_CASES.map((item, index) => {
              const currentCase = onboardingCases[index];

              return (
                <div key={item.id} className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-[124px_minmax(0,1fr)] md:items-start">
                    <ImageSlotPreview
                      imageSlot={item.imageSlot}
                      placeholderAsset={copy.placeholderAsset}
                      placeholderHelp={copy.placeholderHelp}
                    />
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-[15px] font-semibold text-white">{item.title[locale]}</p>
                        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_90%,white_8%)]">
                          {item.metaLine[locale]}
                        </p>
                        <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
                          {copy.caseTitle}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
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
                      <p className="text-sm font-medium text-[color:color-mix(in_srgb,var(--foreground-muted)_92%,white_10%)]">
                        {`${toDisplayCurrency(toInputNumber(currentCase.min), locale)} – ${toDisplayCurrency(toInputNumber(currentCase.max), locale)}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        ) : null}

        {phase === 3 ? (
          <div className="space-y-3">
            <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
              {locale === "tr"
                ? "Burada sadece hissine güvenmen yeterli. Biraz düşük ya da biraz yüksek demen sistemi toparlar."
                : "Trust your instinct here. A quick low/high signal is enough to tune the system."}
            </p>
            <div className="grid gap-4 xl:grid-cols-2">
            {reviewEstimates.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)] md:items-start">
                  <ImageSlotPreview
                    imageSlot={item.imageSlot}
                    placeholderAsset={copy.placeholderAsset}
                    placeholderHelp={copy.placeholderHelp}
                  />
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-[15px] font-semibold text-white">{item.title[locale]}</p>
                      <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_90%,white_8%)]">
                        {item.metaLine[locale]}
                      </p>
                      <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_6%)]">
                        {copy.estimate}
                      </p>
                      <p className="text-2xl font-semibold tracking-tight text-white">{item.estimate.displayLabel}</p>
                    </div>
                    <Field label={copy.reviewTitle}>
                      <ChoiceGroup
                        value={reviewCases[item.id] ?? ""}
                        onChange={(value) =>
                          setReviewCases((current) => ({
                            ...current,
                            [item.id]: value,
                          }))
                        }
                        options={[
                          { value: "looks-right", label: copy.verdicts["looks-right"] },
                          { value: "slightly-low", label: copy.verdicts["slightly-low"] },
                          { value: "slightly-high", label: copy.verdicts["slightly-high"] },
                        ]}
                        columnsClassName="sm:grid-cols-3"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
          <p
            className={cn(
              "text-sm",
              statusTone === "success"
                ? "text-emerald-300"
                : statusTone === "error"
                  ? "text-rose-300"
                  : "text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_6%)]",
            )}
          >
            {statusMessage ?? ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {phase > 1 ? (
              <Button type="button" variant="ghost" onClick={() => setPhase((current) => Math.max(1, current - 1) as Phase)}>
                {copy.back}
              </Button>
            ) : null}
            {phase < 3 ? (
              <Button
                type="button"
                onClick={() => setPhase((current) => (current + 1) as Phase)}
                disabled={(phase === 1 && !phaseOneComplete) || (phase === 2 && !phaseTwoComplete)}
              >
                {copy.next}
              </Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={isSaving || !phaseThreeComplete}>
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                {isSaving ? copy.saving : copy.save}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
