"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LoaderCircle, Save } from "lucide-react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import { intentOptions, sizeOptions } from "@/lib/constants/options";
import { pricingSchema } from "@/lib/forms/schemas";
import type { ArtistPricingRules, ArtistStyleOption } from "@/lib/types";

type PricingFormInput = z.input<typeof pricingSchema>;
type PricingValues = z.output<typeof pricingSchema>;

export function PricingForm({
  pricingRules,
  styles,
}: {
  pricingRules: ArtistPricingRules;
  styles: ArtistStyleOption[];
}) {
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
          styles.map((style) => [
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
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? "Unable to save pricing." });
      return;
    }

    form.setError("root", { message: payload.message ?? "Pricing saved." });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Pricing engine</CardTitle>
        <CardDescription>
          Define your base ranges and multipliers so the public estimate stays consistent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          <Field
            label="Minimum session price"
            description="Acts as the floor after multipliers are applied."
            error={form.formState.errors.minimumSessionPrice?.message}
          >
            <Input type="number" {...form.register("minimumSessionPrice")} />
          </Field>
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Base price ranges by size
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {sizeOptions.map((size) => (
                <div key={size.value} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="font-medium text-white">{size.label}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">{size.detail}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field label="Min">
                      <Input type="number" {...form.register(`sizeBaseRanges.${size.value}.min`)} />
                    </Field>
                    <Field label="Max">
                      <Input type="number" {...form.register(`sizeBaseRanges.${size.value}.max`)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Style multipliers
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {styles.map((style) => (
                <Field key={style.styleKey} label={style.label}>
                  <Input
                    type="number"
                    step="0.05"
                    {...form.register(`styleMultipliers.${style.styleKey}`)}
                  />
                </Field>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Approximate time ranges by size
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {sizeOptions.map((size) => (
                <div key={size.value} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="font-medium text-white">{size.label}</p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Used in the public size guidance panel.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field label="Min hours">
                      <Input type="number" step="0.5" {...form.register(`sizeTimeRanges.${size.value}.minHours`)} />
                    </Field>
                    <Field label="Max hours">
                      <Input type="number" step="0.5" {...form.register(`sizeTimeRanges.${size.value}.maxHours`)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Intent multipliers
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {intentOptions.map((intent) => (
                <Field key={intent.value} label={intent.label}>
                  <Input
                    type="number"
                    step="0.05"
                    {...form.register(`intentMultipliers.${intent.value}`)}
                  />
                </Field>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              Placement multipliers
            </h3>
            <div className="grid gap-5 lg:grid-cols-2">
              {bodyPlacementGroups.map((group) => (
                <div key={group.value} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="font-medium text-white">{group.label}</p>
                  <div className="mt-4 grid gap-3">
                    {group.details.map((detail) => (
                      <Field key={detail.value} label={detail.label}>
                        <Input
                          type="number"
                          step="0.05"
                          {...form.register(`placementMultipliers.${detail.value}`)}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}
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
                Saving
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save pricing
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
