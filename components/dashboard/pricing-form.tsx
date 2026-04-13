"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat ayarları",
      description:
        "Temel fiyatı ve fiyatı etkileyen ana başlıkları belirle. Tattix buna göre tahmini aralık üretir.",
      sectionHelp: "Bir alanı açmak için başlığa dokun.",
      basePrice: "Temel fiyat",
      basePriceHelp: "Orta ölçekte, standart zorluktaki temiz bir dövme için başlangıç seviyesi.",
      minimumCharge: "Minimum ücret",
      minimumChargeHelp: "Tahmin bu tutarın altına düşmez.",
      sizeModifiers: "Boyuta göre fiyat etkisi",
      sizeModifiersHelp: "Her boyut için tahmin aralığının ne kadar genişleyeceğini belirle.",
      placementModifiers: "Yerleşime göre fiyat etkisi",
      placementHelp: "Ana bölgeye dokunarak alt yerleşimleri aç.",
      detailLevelModifiers: "Detay seviyesine göre fiyat etkisi",
      colorModeModifiers: "Renk yönüne göre fiyat etkisi",
      addonFees: "Ek ücretler",
      addonHelp: "Bunlar çarpan değil, tahmine eklenen sabit aralıklardır.",
      coverUp: "Kapatma işi",
      customDesign: "Özel tasarım hazırlığı",
      styleContext: "Stil ve talep türü artık sadece sınıflandırma amaçlıdır; fiyatın ana belirleyicisi değildir.",
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
    basePriceHelp: "Starting point for a medium-size, standard-difficulty tattoo on clean skin.",
    minimumCharge: "Minimum charge",
    minimumChargeHelp: "The estimate will never drop below this amount.",
    sizeModifiers: "Price effect by size",
    sizeModifiersHelp: "Define how much each size expands the estimate range.",
    placementModifiers: "Price effect by placement",
    placementHelp: "Tap a main area to reveal detailed placements.",
    detailLevelModifiers: "Price effect by detail level",
    colorModeModifiers: "Price effect by color mode",
    addonFees: "Addon fees",
    addonHelp: "These are fixed ranges added on top of the quote, not style multipliers.",
    coverUp: "Cover-up work",
    customDesign: "Custom design prep",
    styleContext: "Style and design type now stay as classification only, not as the main quote driver.",
    min: "Min",
    max: "Max",
    save: "Save pricing",
    saving: "Saving",
    saveFailed: "Unable to save pricing.",
    saved: "Pricing saved.",
  };
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

  const form = useForm<PricingFormInput, unknown, PricingValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      basePrice: pricingRules.basePrice,
      minimumCharge: pricingRules.minimumCharge,
      sizeModifiers: pricingRules.sizeModifiers,
      placementModifiers: {
        ...Object.fromEntries(
          bodyPlacementGroups.flatMap((group) =>
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
                      <p className="font-medium text-white">{size.label}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{size.detail}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label={copy.min}>
                          <Input type="number" step="0.05" {...form.register(`sizeModifiers.${size.value}.min`)} />
                        </Field>
                        <Field label={copy.max}>
                          <Input type="number" step="0.05" {...form.register(`sizeModifiers.${size.value}.max`)} />
                        </Field>
                      </div>
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
                  {bodyPlacementGroups.map((group) => (
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
                            <div key={detail.value} className="grid gap-3 lg:grid-cols-2">
                              <Field label={`${getPlacementDetailLocaleLabel(detail.value, locale)} · ${copy.min}`}>
                                <Input type="number" step="0.05" {...form.register(`placementModifiers.${detail.value}.min`)} />
                              </Field>
                              <Field label={`${getPlacementDetailLocaleLabel(detail.value, locale)} · ${copy.max}`}>
                                <Input type="number" step="0.05" {...form.register(`placementModifiers.${detail.value}.max`)} />
                              </Field>
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
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label={copy.min}>
                          <Input type="number" step="0.05" {...form.register(`detailLevelModifiers.${key as keyof PricingValues["detailLevelModifiers"]}.min`)} />
                        </Field>
                        <Field label={copy.max}>
                          <Input type="number" step="0.05" {...form.register(`detailLevelModifiers.${key as keyof PricingValues["detailLevelModifiers"]}.max`)} />
                        </Field>
                      </div>
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
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label={copy.min}>
                          <Input type="number" step="0.05" {...form.register(`colorModeModifiers.${key as keyof PricingValues["colorModeModifiers"]}.min`)} />
                        </Field>
                        <Field label={copy.max}>
                          <Input type="number" step="0.05" {...form.register(`colorModeModifiers.${key as keyof PricingValues["colorModeModifiers"]}.max`)} />
                        </Field>
                      </div>
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
                    ["coverUp", copy.coverUp],
                    ["customDesign", copy.customDesign],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-white">{label}</p>
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
