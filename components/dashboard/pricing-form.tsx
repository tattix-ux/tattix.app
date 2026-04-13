"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import { sizeOptions } from "@/lib/constants/options";
import { pricingSchema } from "@/lib/forms/schemas";
import {
  getPlacementCategoryLocaleLabel,
  getPlacementDetailLocaleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";

type PricingFormInput = z.input<typeof pricingSchema>;
type PricingValues = z.output<typeof pricingSchema>;

const detailLevelLabels = {
  simple: { en: "Low detail", tr: "Az detay" },
  standard: { en: "Medium detail", tr: "Orta detay" },
  detailed: { en: "High detail", tr: "Çok detay" },
} as const;

const colorModeLabels = {
  "black-only": { en: "Black only", tr: "Sadece siyah" },
  "black-grey": { en: "Black and grey", tr: "Siyah-gri" },
  "full-color": { en: "Color", tr: "Renkli" },
} as const;

const levelRangePresets = {
  low: { min: 0.95, max: 1.05 },
  medium: { min: 1.05, max: 1.2 },
  high: { min: 1.15, max: 1.35 },
} as const;

const detailPresetMap = {
  simple: "low",
  standard: "medium",
  detailed: "high",
} as const;

const colorPresetMap = {
  "black-only": "low",
  "black-grey": "medium",
  "full-color": "high",
} as const;

const placementDifficultyPresets = {
  standard: { min: 1, max: 1.08 },
  hard: { min: 1.1, max: 1.22 },
  veryHard: { min: 1.24, max: 1.4 },
} as const;

const sizePresetRanges = {
  tiny: {
    low: { min: 0.3, max: 0.5 },
    medium: { min: 0.4, max: 0.65 },
    high: { min: 0.5, max: 0.8 },
  },
  small: {
    low: { min: 0.5, max: 0.75 },
    medium: { min: 0.65, max: 0.95 },
    high: { min: 0.8, max: 1.1 },
  },
  medium: {
    low: { min: 0.9, max: 1.1 },
    medium: { min: 1, max: 1.2 },
    high: { min: 1.1, max: 1.35 },
  },
  large: {
    low: { min: 1.5, max: 1.95 },
    medium: { min: 1.8, max: 2.4 },
    high: { min: 2.2, max: 3 },
  },
} as const;

type StepKey = "low" | "medium" | "high";
type PlacementDifficultyKey = "standard" | "hard" | "veryHard";

function approxEqual(left: number, right: number) {
  return Math.abs(left - right) <= 0.08;
}

function detectStepKey(
  range: { min: number; max: number },
  presets: Record<StepKey, { min: number; max: number }>,
): StepKey {
  const found = (Object.entries(presets) as [StepKey, { min: number; max: number }][]).find(
    ([, preset]) => approxEqual(range.min, preset.min) && approxEqual(range.max, preset.max),
  );

  return found?.[0] ?? "medium";
}

function detectPlacementDifficultyKey(
  range: { min: number; max: number },
): PlacementDifficultyKey {
  const found = (
    Object.entries(placementDifficultyPresets) as [PlacementDifficultyKey, { min: number; max: number }][]
  ).find(([, preset]) => approxEqual(range.min, preset.min) && approxEqual(range.max, preset.max));

  return found?.[0] ?? "standard";
}

function coerceRange(value: unknown, fallback: { min: number; max: number }) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as { min?: unknown; max?: unknown };

  return {
    min: typeof candidate.min === "number" ? candidate.min : fallback.min,
    max: typeof candidate.max === "number" ? candidate.max : fallback.max,
  };
}

function uniquePricingPlacementGroups() {
  const seen = new Set<string>();

  return bodyPlacementGroups
    .map((group) => ({
      ...group,
      details: group.details.filter((detail) => {
        if (detail.value === "placement-not-sure") {
          return false;
        }

        if (seen.has(detail.value)) {
          return false;
        }

        seen.add(detail.value);
        return true;
      }),
    }))
    .filter((group) => group.details.length > 0);
}

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat ayarları",
      description:
        "Temel fiyatı ve fiyatı etkileyen ana başlıkları belirle. Tattix buna göre tahmini aralık üretir.",
      sectionHelp: "Bir alanı açmak için başlığa dokun.",
      basePrice: "Temel fiyat",
      basePriceHelp: "Küçük ve standart bir dövmeyi genelde kaçtan başlatıyorsun?",
      minimumCharge: "Minimum ücret",
      minimumChargeHelp: "En küçük işte bile alacağın minimum ücret",
      minimumChargeNote: "Sistem daha düşük hesaplasa bile bu değerin altına düşmez.",
      sizeModifiers: "Boyuta göre fiyat etkisi",
      sizeModifiersHelp: "Her boyut için fiyat etkisini kademeli olarak seç.",
      placementModifiers: "Yerleşim zorluğu",
      placementHelp: "Aynı bölge bir kez görünür. Ana bölgeye dokunarak alt yerleşimleri aç.",
      detailLevelModifiers: "Detay seviyesi",
      colorModeModifiers: "Renk etkisi",
      addonFees: "Ek ücretler",
      addonHelp: "Bunlar tahmine sonradan eklenen sabit ücret aralıklarıdır.",
      coverUp: "Kapatma işi",
      customDesign: "Özel tasarım hazırlığı",
      coverUpHelp: "Varsa mevcut dövme kapatma için ek ücret uygular.",
      customDesignHelp: "Hazır tasarım yoksa özel çizim hazırlığı için ek ücret uygular.",
      styleContext: "Fiyat tahmini esas olarak boyut, bölge, detay ve renge göre hesaplanır.",
      low: "Az",
      medium: "Orta",
      high: "Yüksek",
      standard: "Standart",
      hard: "Zor",
      veryHard: "Çok zor",
      tinyLabel: "Çok küçük",
      tinyHelp: "Parmak, minik sembol veya kısa vurgu dövmeleri.",
      smallLabel: "Küçük",
      smallHelp: "Avuç içi boyutuna yakın sade işler.",
      mediumLabel: "Orta",
      mediumHelp: "Ön kol, baldır veya göğüs ölçüsünde dengeli işler.",
      largeLabel: "Büyük",
      largeHelp: "Daha geniş alana yayılan iddialı çalışmalar.",
      min: "Alt değer",
      max: "Üst değer",
      save: "Fiyatlamayı kaydet",
      saving: "Kaydediliyor",
      saveFailed: "Fiyatlama kaydedilemedi.",
      saved: "Fiyatlama kaydedildi.",
    };
  }

  return {
    title: "Pricing settings",
    description:
      "Set your base price and the main factors that shape the quote range.",
    sectionHelp: "Tap a section title to expand it.",
    basePrice: "Base price",
    basePriceHelp: "What do you usually start a small, standard tattoo at?",
    minimumCharge: "Minimum charge",
    minimumChargeHelp: "The minimum you would charge even for the smallest job.",
    minimumChargeNote: "Even if the system calculates lower, it will not go below this amount.",
    sizeModifiers: "Price effect by size",
    sizeModifiersHelp: "Choose a simple pricing level for each size.",
    placementModifiers: "Placement difficulty",
    placementHelp: "Each area appears once. Tap a main area to reveal detailed placements.",
    detailLevelModifiers: "Detail level",
    colorModeModifiers: "Color effect",
    addonFees: "Addon fees",
    addonHelp: "These are fixed fees added on top of the quote.",
    coverUp: "Cover-up work",
    customDesign: "Custom design prep",
    coverUpHelp: "Adds an extra fee when the tattoo covers an older one.",
    customDesignHelp: "Adds an extra fee when the artist needs to prepare a custom design.",
    styleContext: "The quote is mainly calculated from size, placement, detail, and color.",
    low: "Low",
    medium: "Medium",
    high: "High",
    standard: "Standard",
    hard: "Hard",
    veryHard: "Very hard",
    tinyLabel: "Very small",
    tinyHelp: "Finger-scale symbols and tiny accents.",
    smallLabel: "Small",
    smallHelp: "Palm-size and simple small tattoos.",
    mediumLabel: "Medium",
    mediumHelp: "Balanced work around forearm, calf, or chest size.",
    largeLabel: "Large",
    largeHelp: "Statement pieces across a wider area.",
    min: "Min",
    max: "Max",
    save: "Save pricing",
    saving: "Saving",
    saveFailed: "Unable to save pricing.",
    saved: "Pricing saved.",
  };
}

function SegmentedRangeButtons({
  options,
  active,
  onSelect,
}: {
  options: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {options.map((option) => {
        const selected = option.key === active;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.key)}
            className="rounded-[16px] border px-3 py-2 text-sm transition"
            style={{
              borderColor: selected ? "var(--primary)" : "rgba(255,255,255,0.08)",
              backgroundColor: selected
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    sizeModifiers: false,
    placementModifiers: false,
    detailLevelModifiers: false,
    colorModeModifiers: false,
    addonFees: false,
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(bodyPlacementGroups.map((group) => [group.value, false])),
  );
  const copy = getText(locale);
  const pricingPlacementGroups = useMemo(() => uniquePricingPlacementGroups(), []);

  const form = useForm<PricingFormInput, unknown, PricingValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      basePrice: pricingRules.basePrice,
      minimumCharge: pricingRules.minimumCharge,
      sizeModifiers: pricingRules.sizeModifiers,
      placementModifiers: {
        ...Object.fromEntries(
          pricingPlacementGroups.flatMap((group) =>
            group.details.map((detail) => [
              detail.value,
              pricingRules.placementModifiers[detail.value] ?? { min: 1, max: 1 },
            ]),
          ),
        ),
      },
      detailLevelModifiers: pricingRules.detailLevelModifiers,
      colorModeModifiers: pricingRules.colorModeModifiers,
      addonFees: pricingRules.addonFees,
    } satisfies PricingFormInput,
  });

  function setSizePreset(size: keyof typeof sizePresetRanges, preset: StepKey) {
    form.setValue(`sizeModifiers.${size}`, sizePresetRanges[size][preset], { shouldDirty: true });
  }

  function setDetailPreset(level: keyof typeof detailPresetMap, preset: StepKey) {
    form.setValue(`detailLevelModifiers.${level}`, levelRangePresets[preset], { shouldDirty: true });
  }

  function setColorPreset(mode: keyof typeof colorPresetMap, preset: StepKey) {
    form.setValue(`colorModeModifiers.${mode}`, levelRangePresets[preset], { shouldDirty: true });
  }

  function setPlacementPreset(detailValue: string, preset: PlacementDifficultyKey) {
    form.setValue(`placementModifiers.${detailValue}`, placementDifficultyPresets[preset], {
      shouldDirty: true,
    });
  }

  async function onSubmit(values: PricingValues) {
    const response = await fetch("/api/dashboard/pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    await response.json().catch(() => null);

    if (!response.ok) {
      form.setError("root", { message: copy.saveFailed });
      return;
    }

    form.setError("root", { message: copy.saved });
    router.refresh();
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <p className="text-sm text-[var(--foreground-muted)]">{copy.sectionHelp}</p>

          <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-[var(--foreground-muted)]">
            {copy.styleContext}
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("core")}
              >
                <div>
                  <p className="font-medium text-white">{copy.basePrice}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.basePriceHelp}</p>
                </div>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.core ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.core ? (
                <div className="grid gap-4 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  <Field label={copy.basePrice} error={form.formState.errors.basePrice?.message}>
                    <Input type="number" {...form.register("basePrice")} />
                  </Field>
                  <Field label={copy.minimumCharge} error={form.formState.errors.minimumCharge?.message}>
                    <Input type="number" {...form.register("minimumCharge")} />
                  </Field>
                  <p className="lg:col-span-2 text-sm text-[var(--foreground-muted)]">{copy.minimumChargeNote}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("sizeModifiers")}
              >
                <div>
                  <p className="font-medium text-white">{copy.sizeModifiers}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.sizeModifiersHelp}</p>
                </div>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.sizeModifiers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.sizeModifiers ? (
                <div className="grid gap-4 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  {sizeOptions.map((size) => (
                    <div key={size.value} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-white">
                        {copy[`${size.value}Label` as const]}
                      </p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {copy[`${size.value}Help` as const]}
                      </p>
                      <SegmentedRangeButtons
                        active={detectStepKey(
                          coerceRange(form.watch(`sizeModifiers.${size.value}`), sizePresetRanges[size.value].medium),
                          sizePresetRanges[size.value],
                        )}
                        onSelect={(preset) => setSizePreset(size.value, preset as StepKey)}
                        options={[
                          { key: "low", label: copy.low },
                          { key: "medium", label: copy.medium },
                          { key: "high", label: copy.high },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("placementModifiers")}
              >
                <div>
                  <p className="font-medium text-white">{copy.placementModifiers}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.placementHelp}</p>
                </div>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.placementModifiers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.placementModifiers ? (
                <div className="grid gap-4 border-t border-white/8 px-4 pb-4 pt-4">
                  {pricingPlacementGroups.map((group) => (
                    <div key={group.value} className="rounded-[20px] border border-white/8 bg-black/20">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                        onClick={() =>
                          setExpandedGroups((current) => ({
                            ...current,
                            [group.value]: !current[group.value],
                          }))
                        }
                      >
                        <p className="font-medium text-white">{getPlacementCategoryLocaleLabel(group.value, locale)}</p>
                        <ChevronDown
                          className={`size-4 text-[var(--foreground-muted)] transition ${
                            expandedGroups[group.value] ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {expandedGroups[group.value] ? (
                        <div className="grid gap-3 border-t border-white/8 px-4 pb-4 pt-4">
                          {group.details.map((detail) => (
                            <div key={detail.value} className="rounded-[16px] border border-white/8 bg-black/20 p-4">
                              <p className="font-medium text-white">
                                {getPlacementDetailLocaleLabel(detail.value, locale)}
                              </p>
                              <SegmentedRangeButtons
                                active={detectPlacementDifficultyKey(
                                  coerceRange(
                                    form.watch(`placementModifiers.${detail.value}`),
                                    placementDifficultyPresets.standard,
                                  ),
                                )}
                                onSelect={(preset) =>
                                  setPlacementPreset(detail.value, preset as PlacementDifficultyKey)
                                }
                                options={[
                                  { key: "standard", label: copy.standard },
                                  { key: "hard", label: copy.hard },
                                  { key: "veryHard", label: copy.veryHard },
                                ]}
                              />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("detailLevelModifiers")}
              >
                <p className="font-medium text-white">{copy.detailLevelModifiers}</p>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.detailLevelModifiers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.detailLevelModifiers ? (
                <div className="grid gap-3 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  {Object.entries(detailLevelLabels).map(([key, label]) => (
                    <div key={key} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-white">{label[locale]}</p>
                      <SegmentedRangeButtons
                        active={detectStepKey(
                          coerceRange(
                            form.watch(`detailLevelModifiers.${key as keyof PricingValues["detailLevelModifiers"]}`),
                            levelRangePresets.medium,
                          ),
                          levelRangePresets,
                        )}
                        onSelect={(preset) => setDetailPreset(key as keyof typeof detailPresetMap, preset as StepKey)}
                        options={[
                          { key: "low", label: copy.low },
                          { key: "medium", label: copy.medium },
                          { key: "high", label: copy.high },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("colorModeModifiers")}
              >
                <p className="font-medium text-white">{copy.colorModeModifiers}</p>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.colorModeModifiers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.colorModeModifiers ? (
                <div className="grid gap-3 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  {Object.entries(colorModeLabels).map(([key, label]) => (
                    <div key={key} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-white">{label[locale]}</p>
                      <SegmentedRangeButtons
                        active={detectStepKey(
                          coerceRange(
                            form.watch(`colorModeModifiers.${key as keyof PricingValues["colorModeModifiers"]}`),
                            levelRangePresets.medium,
                          ),
                          levelRangePresets,
                        )}
                        onSelect={(preset) => setColorPreset(key as keyof typeof colorPresetMap, preset as StepKey)}
                        options={[
                          { key: "low", label: copy.low },
                          { key: "medium", label: copy.medium },
                          { key: "high", label: copy.high },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("addonFees")}
              >
                <div>
                  <p className="font-medium text-white">{copy.addonFees}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.addonHelp}</p>
                </div>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.addonFees ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.addonFees ? (
                <div className="grid gap-3 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  {([
                    ["coverUp", copy.coverUp, copy.coverUpHelp],
                    ["customDesign", copy.customDesign, copy.customDesignHelp],
                  ] as const).map(([key, label, help]) => (
                    <div key={key} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-white">{label}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{help}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label={copy.min}>
                          <Input type="number" {...form.register(`addonFees.${key}.min`)} />
                        </Field>
                        <Field label={copy.max}>
                          <Input type="number" {...form.register(`addonFees.${key}.max`)} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">{form.formState.errors.root.message}</p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
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
        </form>
      </CardContent>
    </Card>
  );
}
