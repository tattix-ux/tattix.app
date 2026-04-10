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
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFunnelSettings, ArtistStyleOption } from "@/lib/types";

type FunnelValues = z.infer<typeof funnelSettingsSchema>;
type FunnelFormInput = z.input<typeof funnelSettingsSchema>;

export function FunnelSettingsForm({
  settings,
  styles,
  locale = "en",
}: {
  settings: ArtistFunnelSettings;
  styles: ArtistStyleOption[];
  locale?: PublicLocale;
}) {
  const copy =
    locale === "tr"
      ? {
          title: "Akış ayarları",
          description: "Müşteri akışının metinlerini, dilini ve görünür stil seçeneklerini buradan yönet.",
          introEyebrow: "Üst kısa etiket",
          introTitle: "Giriş başlığı",
          introDescription: "Giriş açıklaması",
          showFeatured: "Hazır tasarım kartlarını sanatçı sayfasında göster",
          defaultLanguage: "Varsayılan public dil",
          activeStyles: "Görünür stiller",
          activeCount: "aktif",
          customStyles: "Özel stiller",
          addStyle: "Stil ekle",
          customStylesHelp: "Eklediğin özel stiller burada görünür ve aktifse public akış ile fiyatlama ekranına yansır.",
          emptyStyles: "Henüz özel stil eklenmedi.",
          styleLabel: "Stil adı",
          styleKey: "Stil anahtarı",
          styleKeyHelp: "Sadece küçük harf ve tire kullan.",
          enabled: "Aktif",
          remove: "Kaldır",
          save: "Ayarları kaydet",
          saving: "Kaydediliyor",
          saveFailed: "Akış ayarları kaydedilemedi.",
          saved: "Akış ayarları kaydedildi.",
        }
      : {
          title: "Funnel settings",
          description: "Tune the copy, language, and visible styles that shape your intake flow.",
          introEyebrow: "Intro eyebrow",
          introTitle: "Intro title",
          introDescription: "Intro description",
          showFeatured: "Show featured designs on the public page",
          defaultLanguage: "Default public language",
          activeStyles: "Visible styles",
          activeCount: "active",
          customStyles: "Custom styles",
          addStyle: "Add style",
          customStylesHelp: "New styles appear here automatically and flow into the public step and pricing when enabled.",
          emptyStyles: "No custom styles yet.",
          styleLabel: "Style label",
          styleKey: "Style key",
          styleKeyHelp: "Lowercase letters and hyphens only.",
          enabled: "Enabled",
          remove: "Remove",
          save: "Save settings",
          saving: "Saving",
          saveFailed: "Unable to save funnel settings.",
          saved: "Funnel settings saved.",
        };
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
      form.setError("root", { message: payload.message ?? copy.saveFailed });
      return;
    }

    form.setError("root", { message: payload.message ?? copy.saved });
  }

  const builtInStyles = styles
    .filter((style) => !style.isCustom)
    .sort((left, right) => {
      const preferredOrder = ["blackwork", "fine-line", "micro-realism"];
      const leftRank = preferredOrder.indexOf(left.styleKey);
      const rightRank = preferredOrder.indexOf(right.styleKey);

      if (leftRank !== -1 || rightRank !== -1) {
        return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
      }

      return left.label.localeCompare(right.label);
    });

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <Field label={copy.introEyebrow} error={form.formState.errors.introEyebrow?.message}>
            <Input {...form.register("introEyebrow")} />
          </Field>
          <Field label={copy.introTitle} error={form.formState.errors.introTitle?.message}>
            <Input {...form.register("introTitle")} />
          </Field>
          <Field
            label={copy.introDescription}
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
            <span className="text-sm text-white">{copy.showFeatured}</span>
          </label>
          <Field label={copy.defaultLanguage} error={form.formState.errors.defaultLanguage?.message}>
            <NativeSelect {...form.register("defaultLanguage")}>
              <option value="en">English</option>
              <option value="tr">Türkçe</option>
            </NativeSelect>
          </Field>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Field label={copy.activeStyles} className="gap-1">
                <div />
              </Field>
              <Badge variant="muted">{selectedStyles.length} {copy.activeCount}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {builtInStyles.map((style) => {
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
              <Field label={copy.customStyles} className="gap-1">
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
                {copy.addStyle}
              </Button>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">
              {copy.customStylesHelp}
            </p>
            <div className="space-y-3">
              {customStylesFieldArray.fields.length === 0 ? (
                <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-[var(--foreground-muted)]">
                  {copy.emptyStyles}
                </div>
              ) : null}
              {customStylesFieldArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-[24px] border border-white/8 bg-black/20 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                    <Field
                      label={copy.styleLabel}
                      error={form.formState.errors.customStyles?.[index]?.label?.message}
                    >
                      <Input {...form.register(`customStyles.${index}.label`)} placeholder="Etching" />
                    </Field>
                    <Field
                      label={copy.styleKey}
                      description={copy.styleKeyHelp}
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
                        <span className="text-sm text-white">{copy.enabled}</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => customStylesFieldArray.remove(index)}
                      >
                        <Trash2 className="size-4" />
                        {copy.remove}
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
