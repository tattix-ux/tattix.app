"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { funnelSettingsSchema } from "@/lib/forms/schemas";
import type { ArtistFunnelSettings, ArtistStyleOption } from "@/lib/types";

type FunnelValues = z.infer<typeof funnelSettingsSchema>;
type FunnelFormInput = z.input<typeof funnelSettingsSchema>;

export function FunnelSettingsForm({
  settings,
  styles,
}: {
  settings: ArtistFunnelSettings;
  styles: ArtistStyleOption[];
}) {
  const form = useForm<FunnelFormInput, unknown, FunnelValues>({
    resolver: zodResolver(funnelSettingsSchema),
    defaultValues: {
      introEyebrow: settings.introEyebrow,
      introTitle: settings.introTitle,
      introDescription: settings.introDescription,
      showFeaturedDesigns: settings.showFeaturedDesigns,
      defaultLanguage: settings.defaultLanguage,
      enabledStyles: styles
        .filter((style) => style.enabled && !style.isCustom)
        .map((style) => style.styleKey),
      customStyles: styles
        .filter((style) => style.isCustom)
        .map((style) => ({
          id: style.id,
          styleKey: style.styleKey,
          label: style.label,
          enabled: style.enabled,
        })),
    },
  });
  const customStylesFieldArray = useFieldArray({
    control: form.control,
    name: "customStyles",
  });

  const selectedStyles = useWatch({
    control: form.control,
    name: "enabledStyles",
    defaultValue: styles
      .filter((style) => style.enabled && !style.isCustom)
      .map((style) => style.styleKey),
  }) ?? [];

  async function onSubmit(values: FunnelValues) {
    const response = await fetch("/api/dashboard/funnel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? "Unable to save funnel settings." });
      return;
    }

    form.setError("root", { message: payload.message ?? "Funnel settings saved." });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Funnel settings</CardTitle>
        <CardDescription>
          Tune the copy and enabled styles that shape your mobile intake flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label="Intro eyebrow" error={form.formState.errors.introEyebrow?.message}>
            <Input {...form.register("introEyebrow")} />
          </Field>
          <Field label="Intro title" error={form.formState.errors.introTitle?.message}>
            <Input {...form.register("introTitle")} />
          </Field>
          <Field
            label="Intro description"
            error={form.formState.errors.introDescription?.message}
          >
            <Textarea {...form.register("introDescription")} />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <input
              type="checkbox"
              className="size-4 accent-[var(--accent)]"
              {...form.register("showFeaturedDesigns")}
            />
            <span className="text-sm text-white">Show featured designs on the public page</span>
          </label>
          <Field label="Default public language" error={form.formState.errors.defaultLanguage?.message}>
            <NativeSelect {...form.register("defaultLanguage")}>
              <option value="en">English</option>
              <option value="tr">Turkce</option>
            </NativeSelect>
          </Field>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Field label="Enabled styles" className="gap-1">
                <div />
              </Field>
              <Badge variant="muted">{selectedStyles.length} active</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {styles.filter((style) => !style.isCustom).map((style) => {
                const active = selectedStyles.includes(style.styleKey);

                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      const nextStyles = active
                        ? selectedStyles.filter((item) => item !== style.styleKey)
                        : [...selectedStyles, style.styleKey];
                      form.setValue("enabledStyles", nextStyles, { shouldValidate: true });
                    }}
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/12"
                        : "border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/5"
                    }`}
                  >
                    <p className="font-medium text-white">{style.label}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      Multiplier set in pricing settings.
                    </p>
                  </button>
                );
              })}
            </div>
            {form.formState.errors.enabledStyles?.message ? (
              <p className="text-xs text-red-300">{form.formState.errors.enabledStyles.message}</p>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Field label="Custom styles" className="gap-1">
                <div />
              </Field>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  customStylesFieldArray.append({
                    styleKey: "",
                    label: "",
                    enabled: true,
                  })
                }
              >
                <Plus className="size-4" />
                Add style
              </Button>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              Add your own style names and control whether they appear in the public flow.
            </p>
            <div className="space-y-3">
              {customStylesFieldArray.fields.length === 0 ? (
                <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-[var(--foreground-muted)]">
                  No custom styles yet.
                </div>
              ) : null}
              {customStylesFieldArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-[24px] border border-white/8 bg-black/20 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                    <Field
                      label="Style label"
                      error={form.formState.errors.customStyles?.[index]?.label?.message}
                    >
                      <Input {...form.register(`customStyles.${index}.label`)} placeholder="Etching" />
                    </Field>
                    <Field
                      label="Style key"
                      description="Lowercase letters and hyphens only."
                      error={form.formState.errors.customStyles?.[index]?.styleKey?.message}
                    >
                      <Input {...form.register(`customStyles.${index}.styleKey`)} placeholder="etching" />
                    </Field>
                    <div className="flex items-end gap-3">
                      <label className="flex h-10 items-center gap-2 rounded-full border border-white/8 bg-black/20 px-4">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          {...form.register(`customStyles.${index}.enabled`)}
                        />
                        <span className="text-sm text-white">Enabled</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => customStylesFieldArray.remove(index)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
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
                Save settings
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
