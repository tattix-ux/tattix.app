"use client";

import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PublicLocale } from "@/lib/i18n/public";
import { estimateCustomRequestPrice } from "@/lib/pricing/v2/custom-request";
import { PRICING_V2_ONBOARDING_CASES, PRICING_V2_REVIEW_CASES } from "@/lib/pricing/v2/onboarding-cases";
import { buildPricingV2Profile, getArtistPricingV2Profile } from "@/lib/pricing/v2/profile";
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type Verdict = "looks-right" | "slightly-low" | "slightly-high";
type Phase = 1 | 2 | 3;

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat yapını tanıyalım",
      description: "Müşteriye göstereceğimiz başlangıç fiyatlarını birkaç kısa adımla oturt.",
      phases: [
        "1. Fiyat yapını tanıyalım",
        "2. Birkaç örnek üzerinden ilerleyelim",
        "3. Son bir kontrol yapalım",
      ],
      minimumJobPrice: "En küçük işlerde genelde başladığın fiyat",
      textStartingPrice: "Yazı gibi çok basit işlerde çoğu zaman başladığın fiyat",
      colorImpact: "Renkli işler genelde fiyatı ne kadar etkiler?",
      coverUpImpact: "Kapatma işleri genelde nasıl olur?",
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
      caseTitle: "Bu iş için müşteriye başlangıçta hangi bandı göstermek istersin?",
      min: "Alt sınır",
      max: "Üst sınır",
      placeholderAsset: "Görsel slotu hazır",
      placeholderHelp: "Gerçek görseli sonradan ekleyebilirsin.",
      reviewTitle: "Sence bu tahmin nasıl?",
      verdicts: {
        "looks-right": "Uygun",
        "slightly-low": "Biraz düşük",
        "slightly-high": "Biraz yüksek",
      },
      back: "Geri",
      next: "Devam",
      save: "Ayarları kaydet",
      saving: "Kaydediliyor",
      saved: "Yeni fiyat yapısı kaydedildi.",
      failed: "Fiyat ayarı kaydedilemedi.",
      estimate: "Sistemin göstereceği fiyat",
      currency: "TL",
    };
  }

  return {
    title: "Let’s learn your pricing style",
    description: "Set the starting prices clients will see in three short steps.",
    phases: [
      "1. Learn your pricing style",
      "2. Review a few example cases",
      "3. Do one final check",
    ],
    minimumJobPrice: "Where do your smallest jobs usually start?",
    textStartingPrice: "Where do very simple text jobs usually start?",
    colorImpact: "How much do color jobs usually affect the price?",
    coverUpImpact: "How do cover-up jobs usually feel?",
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
    caseTitle: "What starting band would you want to show for this case?",
    min: "Min",
    max: "Max",
    placeholderAsset: "Image slot ready",
    placeholderHelp: "You can attach the real image later.",
    reviewTitle: "How does this estimate feel?",
    verdicts: {
      "looks-right": "Looks right",
      "slightly-low": "A bit low",
      "slightly-high": "A bit high",
    },
    back: "Back",
    next: "Next",
    save: "Save settings",
    saving: "Saving",
    saved: "Pricing setup saved.",
    failed: "Pricing setup could not be saved.",
    estimate: "What the system would show",
    currency: "TRY",
  };
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

function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | "";
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition",
              active
                ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-white"
                : "border-white/8 bg-white/[0.02] text-[color:color-mix(in_srgb,var(--foreground-muted)_80%,white_10%)] hover:border-white/14 hover:bg-white/[0.04]",
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
  const [leadPreference, setLeadPreference] = useState(initialProfile.leadPreference);
  const [onboardingCases, setOnboardingCases] = useState(
    PRICING_V2_ONBOARDING_CASES.map((item) => {
      const existing = initialProfile.onboardingCases.find((caseItem) => caseItem.id === item.id);
      return {
        id: item.id,
        min: String(existing?.min ?? ""),
        max: String(existing?.max ?? ""),
      };
    }),
  );
  const [reviewCases, setReviewCases] = useState<Record<string, Verdict>>(
    Object.fromEntries(initialProfile.reviewCases.map((item) => [item.id, item.verdict])),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const derivedProfile = useMemo(
    () =>
      buildPricingV2Profile({
        minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
        textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
        colorImpactPreference,
        coverUpImpactPreference,
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

    try {
      const response = await fetch("/api/dashboard/pricing/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minimumJobPrice: toInputNumber(minimumJobPrice, initialProfile.minimumJobPrice),
          textStartingPrice: toInputNumber(textStartingPrice, initialProfile.textStartingPrice),
          colorImpactPreference,
          coverUpImpactPreference,
          leadPreference,
          onboardingCases: onboardingCases.map((item) => ({
            id: item.id,
            min: toInputNumber(item.min),
            max: toInputNumber(item.max),
          })),
          reviewCases: Object.entries(reviewCases).map(([id, verdict]) => ({ id, verdict })),
        }),
      });

      if (!response.ok) {
        throw new Error("save-failed");
      }

      setStatusMessage(copy.saved);
      router.refresh();
    } catch {
      setStatusMessage(copy.failed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="surface-border overflow-hidden border-white/8 bg-[color:color-mix(in_srgb,var(--background)_94%,white_3%)] shadow-[0_18px_42px_rgba(0,0,0,0.16)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{copy.title}</CardTitle>
            <CardDescription className="mt-2 max-w-[56ch] text-[15px] leading-7 text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_6%)]">
              {copy.description}
            </CardDescription>
          </div>
          <Badge variant="muted" className="w-fit">
            v2
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">
        <div className="grid gap-2 sm:grid-cols-3">
          {copy.phases.map((label, index) => {
            const active = phase === index + 1;
            return (
              <div
                key={label}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-[var(--accent)]/26 bg-[var(--accent)]/10 text-white"
                    : "border-white/8 bg-white/[0.02] text-[color:color-mix(in_srgb,var(--foreground-muted)_78%,white_10%)]",
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
            />
            <CurrencyInput
              value={textStartingPrice}
              onChange={setTextStartingPrice}
              label={copy.textStartingPrice}
              suffix={copy.currency}
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
          <div className="grid gap-4 xl:grid-cols-2">
            {PRICING_V2_ONBOARDING_CASES.map((item, index) => {
              const currentCase = onboardingCases[index];

              return (
                <div key={item.id} className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
                  <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="rounded-[18px] border border-dashed border-white/10 bg-[color:color-mix(in_srgb,var(--background)_92%,white_3%)] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">
                        {copy.placeholderAsset}
                      </p>
                      <p className="mt-3 text-sm text-white">{item.title[locale]}</p>
                      <p className="mt-2 text-xs leading-5 text-[var(--foreground-muted)]">{copy.placeholderHelp}</p>
                      <code className="mt-4 block break-all text-[11px] text-[var(--foreground-muted)]">
                        {item.imageSlot}
                      </code>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-base font-semibold text-white">{item.title[locale]}</p>
                        <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_6%)]">
                          {copy.caseTitle}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <CurrencyInput
                          value={currentCase.min}
                          onChange={(value) =>
                            setOnboardingCases((current) =>
                              current.map((entry) => (entry.id === item.id ? { ...entry, min: value } : entry)),
                            )
                          }
                          label={copy.min}
                          suffix={copy.currency}
                        />
                        <CurrencyInput
                          value={currentCase.max}
                          onChange={(value) =>
                            setOnboardingCases((current) =>
                              current.map((entry) => (entry.id === item.id ? { ...entry, max: value } : entry)),
                            )
                          }
                          label={copy.max}
                          suffix={copy.currency}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {phase === 3 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {reviewEstimates.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-white/8 bg-white/[0.02] p-4">
                <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="rounded-[18px] border border-dashed border-white/10 bg-[color:color-mix(in_srgb,var(--background)_92%,white_3%)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-soft)]">
                      {copy.placeholderAsset}
                    </p>
                    <p className="mt-3 text-sm text-white">{item.title[locale]}</p>
                    <code className="mt-4 block break-all text-[11px] text-[var(--foreground-muted)]">
                      {item.imageSlot}
                    </code>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-base font-semibold text-white">{item.title[locale]}</p>
                      <p className="mt-1 text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_6%)]">
                        {copy.estimate}
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">{item.estimate.displayLabel}</p>
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
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-2">
          <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_6%)]">
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
