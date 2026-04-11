"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import { intentOptions, sizeOptions } from "@/lib/constants/options";
import { pricingSchema } from "@/lib/forms/schemas";
import {
  getPlacementCategoryLocaleLabel,
  getPlacementDetailLocaleLabel,
  getIntentLabel,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";

type PricingFormInput = z.input<typeof pricingSchema>;
type PricingValues = z.output<typeof pricingSchema>;

export function PricingForm({
  pricingRules,
  styles,
  locale = "en",
}: {
  pricingRules: ArtistPricingRules;
  styles: ArtistStyleOption[];
  locale?: PublicLocale;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    minimum: true,
    baseRanges: false,
    styleMultipliers: false,
    intentMultipliers: false,
    placementMultipliers: false,
  });
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(bodyPlacementGroups.map((group) => [group.value, false])),
  );
  const copy =
    locale === "tr"
      ? {
          title: "Fiyat motoru",
          description: "Taban aralıkları ve çarpanları belirleyerek tahminlerin tutarlı kalmasını sağla.",
          minimumSessionPrice: "Minimum seans ücreti",
          minimumSessionHelp: "Çarpanlar uygulandıktan sonra alt sınır olarak kullanılır.",
          baseRanges: "Boyuta göre taban fiyat aralıkları",
          styleMultipliers: "Stil çarpanları",
          intentMultipliers: "Talep türü çarpanları",
          placementMultipliers: "Yerleşim çarpanları",
          placementHelp: "Ana bölgeye dokunarak alt yerleşimleri aç.",
          sectionHelp: "İlgili fiyatlama alanını açmak için başlığa dokun.",
          min: "Min",
          max: "Maks",
          save: "Fiyatlamayı kaydet",
          saving: "Kaydediliyor",
          saveFailed: "Fiyatlama kaydedilemedi.",
          saved: "Fiyatlama kaydedildi.",
          noActiveStyles: "Aktif stil yok. Önce akış ayarlarından görünür stilleri seç.",
        }
      : {
          title: "Pricing engine",
          description: "Define your base ranges and multipliers so the public estimate stays consistent.",
          minimumSessionPrice: "Minimum session price",
          minimumSessionHelp: "Acts as the floor after multipliers are applied.",
          baseRanges: "Base price ranges by size",
          styleMultipliers: "Style multipliers",
          intentMultipliers: "Intent multipliers",
          placementMultipliers: "Placement multipliers",
          placementHelp: "Tap a main area to reveal its detailed placements.",
          sectionHelp: "Tap a pricing section title to expand it.",
          min: "Min",
          max: "Max",
          save: "Save pricing",
          saving: "Saving",
          saveFailed: "Unable to save pricing.",
          saved: "Pricing saved.",
          noActiveStyles: "No active styles yet. Enable styles from funnel settings first.",
        };
  const activeStyles = styles.filter((style) => style.enabled);
  const form = useForm<PricingFormInput, unknown, PricingValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      minimumSessionPrice: pricingRules.minimumSessionPrice,
      sizeBaseRanges: pricingRules.sizeBaseRanges,
      placementMultipliers: {
        ...Object.fromEntries(
          bodyPlacementGroups.flatMap((group) =>
            group.details.map((detail) => [detail.value, pricingRules.placementMultipliers[detail.value] ?? 1]),
          ),
        ),
      },
      intentMultipliers: {
        ...Object.fromEntries(
          intentOptions.map((intent) => [intent.value, pricingRules.intentMultipliers[intent.value] ?? 1]),
        ),
      },
      styleMultipliers: {
        ...Object.fromEntries(
          activeStyles.map((style) => [
            style.styleKey,
            style.multiplier ?? 1,
          ]),
        ),
      },
      sizeTimeRanges: pricingRules.sizeTimeRanges,
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

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("minimum")}
              >
                <div>
                  <p className="font-medium text-white">{copy.minimumSessionPrice}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.minimumSessionHelp}</p>
                </div>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.minimum ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.minimum ? (
                <div className="border-t border-white/8 px-4 pb-4 pt-4">
                  <Field
                    label={copy.minimumSessionPrice}
                    error={form.formState.errors.minimumSessionPrice?.message}
                  >
                    <Input type="number" {...form.register("minimumSessionPrice")} />
                  </Field>
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("baseRanges")}
              >
                <p className="font-medium text-white">{copy.baseRanges}</p>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.baseRanges ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.baseRanges ? (
                <div className="grid gap-4 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  {sizeOptions.map((size) => (
                    <div key={size.value} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <p className="font-medium text-white">{size.label}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{size.detail}</p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Field label={copy.min}>
                          <Input type="number" {...form.register(`sizeBaseRanges.${size.value}.min`)} />
                        </Field>
                        <Field label={copy.max}>
                          <Input type="number" {...form.register(`sizeBaseRanges.${size.value}.max`)} />
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
                onClick={() => toggleSection("styleMultipliers")}
              >
                <p className="font-medium text-white">{copy.styleMultipliers}</p>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.styleMultipliers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.styleMultipliers ? (
                <div className="border-t border-white/8 px-4 pb-4 pt-4">
                  {activeStyles.length === 0 ? (
                    <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-[var(--foreground-muted)]">
                      {copy.noActiveStyles}
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {activeStyles.map((style) => (
                        <Field
                          key={style.styleKey}
                          label={style.isCustom ? style.label : getStyleLabel(style.styleKey, locale)}
                        >
                          <Input
                            type="number"
                            step="0.05"
                            {...form.register(`styleMultipliers.${style.styleKey}`)}
                          />
                        </Field>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("intentMultipliers")}
              >
                <p className="font-medium text-white">{copy.intentMultipliers}</p>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.intentMultipliers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.intentMultipliers ? (
                <div className="grid gap-3 border-t border-white/8 px-4 pb-4 pt-4 lg:grid-cols-2">
                  {intentOptions.map((intent) => (
                    <Field key={intent.value} label={getIntentLabel(intent.value, locale)}>
                      <Input
                        type="number"
                        step="0.05"
                        {...form.register(`intentMultipliers.${intent.value}`)}
                      />
                    </Field>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                onClick={() => toggleSection("placementMultipliers")}
              >
                <div>
                  <p className="font-medium text-white">{copy.placementMultipliers}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.placementHelp}</p>
                </div>
                <ChevronDown
                  className={`size-4 text-[var(--foreground-muted)] transition ${
                    expandedSections.placementMultipliers ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSections.placementMultipliers ? (
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
                            <Field key={detail.value} label={getPlacementDetailLocaleLabel(detail.value, locale)}>
                              <Input
                                type="number"
                                step="0.05"
                                {...form.register(`placementMultipliers.${detail.value}`)}
                              />
                            </Field>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {form.formState.errors.root.message}
            </p>
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
