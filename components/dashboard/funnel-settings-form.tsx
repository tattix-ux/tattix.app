"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateCalendarPopover } from "@/components/ui/date-calendar-popover";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { turkeyCities } from "@/lib/constants/cities";
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
  function buildStyleKey(label: string, usedKeys: Set<string>) {
    const base =
      label
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "custom-style";

    let candidate = base;
    let suffix = 2;
    while (usedKeys.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    usedKeys.add(candidate);
    return candidate;
  }

  function normalizeValues(values: FunnelValues) {
    const usedKeys = new Set(styles.filter((style) => !style.isCustom).map((style) => style.styleKey));

    return {
      ...values,
      customStyles: values.customStyles.map((style) => ({
        ...style,
        styleKey: buildStyleKey(style.label, usedKeys),
        description: style.description?.trim() ?? "",
      })),
      bookingCities: values.bookingCities.map((city) => ({
        ...city,
        cityName: city.cityName.trim(),
        availableDates: Array.from(new Set(city.availableDates)).sort(),
      })),
    } satisfies FunnelValues;
  }

  const copy =
    locale === "tr"
      ? {
          title: "Akış ayarları",
          description: "Müşteri akışının metinlerini ve görünür stil seçeneklerini buradan yönet.",
          introEyebrow: "Üst kısa etiket",
          introTitle: "Giriş başlığı",
          introDescription: "Giriş açıklaması",
          showFeatured: "Hazır tasarım kartlarını sanatçı sayfasında göster",
          activeStyles: "Çalıştığın stiller",
          activeCount: "aktif",
          customStyles: "Özel stiller",
          addStyle: "Stil ekle",
          customStylesHelp: "Eklediğin özel stiller burada görünür ve aktifse public akış ile fiyatlama ekranına yansır.",
          customStyleDescription: "Stil açıklaması",
          customStyleDescriptionHelp: "Public bilgi butonunda kısa açıklama olarak görünür.",
          emptyStyles: "Henüz özel stil eklenmedi.",
          styleLabel: "Stil adı",
          enabled: "Aktif",
          remove: "Kaldır",
          resetDefaults: "Varsayılan stillere dön",
          saving: "Kaydediliyor",
          saveFailed: "Akış ayarları kaydedilemedi.",
          saved: "Akış ayarları kaydedildi.",
          bookingTitle: "Çalıştığın şehirler",
          bookingDescription: "Müşteri yalnızca burada tanımladığın şehirleri ve tarihleri görür.",
          addCity: "Şehir ekle",
          cityName: "Şehir",
          cityPlaceholder: "Şehir seç",
          noCities: "Henüz şehir eklenmedi.",
          availabilityTitle: "Bu şehir için müsait olduğun tarihleri seç",
          addDate: "Tarih seç",
          removeDate: "Tarihi kaldır",
          noDates: "Henüz tarih eklenmedi.",
        }
      : {
          title: "Funnel settings",
          description: "Tune the copy and visible styles that shape your intake flow.",
          introEyebrow: "Intro eyebrow",
          introTitle: "Intro title",
          introDescription: "Intro description",
          showFeatured: "Show featured designs on the public page",
          activeStyles: "Working styles",
          activeCount: "active",
          customStyles: "Custom styles",
          addStyle: "Add style",
          customStylesHelp: "New styles appear here automatically and flow into the public step and pricing when enabled.",
          customStyleDescription: "Style description",
          customStyleDescriptionHelp: "Shown inside the public style info modal.",
          emptyStyles: "No custom styles yet.",
          styleLabel: "Style label",
          enabled: "Enabled",
          remove: "Remove",
          resetDefaults: "Reset styles",
          saving: "Saving",
          saveFailed: "Unable to save funnel settings.",
          saved: "Funnel settings saved.",
          bookingTitle: "Working cities",
          bookingDescription: "Customers only see the cities and dates you define here.",
          addCity: "Add city",
          cityName: "City",
          cityPlaceholder: "Select city",
          noCities: "No cities added yet.",
          availabilityTitle: "Select the dates you are available in this city",
          addDate: "Select dates",
          removeDate: "Remove date",
          noDates: "No dates added yet.",
        };
  const form = useForm<FunnelFormInput, unknown, FunnelValues>({
    resolver: zodResolver(funnelSettingsSchema),
    defaultValues: {
      introEyebrow: settings.introEyebrow,
      introTitle: settings.introTitle,
      introDescription: settings.introDescription,
      showFeaturedDesigns: settings.showFeaturedDesigns,
      defaultLanguage: "tr",
      enabledStyles: styles
        .filter((style) => style.enabled && !style.isCustom && !style.deleted)
        .map((style) => style.styleKey),
      removedBuiltInStyles: styles
        .filter((style) => !style.isCustom && style.deleted)
        .map((style) => style.styleKey),
      customStyles: styles
        .filter((style) => style.isCustom)
        .map((style) => ({
          id: style.id,
          styleKey: style.styleKey,
          label: style.label,
          description: style.description ?? "",
          enabled: style.enabled,
        })),
      bookingCities: settings.bookingCities.map((city) => ({
        id: city.id,
        cityName: city.cityName,
        availableDates: city.availableDates,
      })),
    },
  });
  const customStylesFieldArray = useFieldArray({
    control: form.control,
    name: "customStyles",
  });
  const bookingCitiesFieldArray = useFieldArray({
    control: form.control,
    name: "bookingCities",
  });
  const [pendingCity, setPendingCity] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const initialSyncRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedStyles = useWatch({
    control: form.control,
    name: "enabledStyles",
    defaultValue: styles
      .filter((style) => style.enabled && !style.isCustom)
      .map((style) => style.styleKey),
  }) ?? [];
  const removedBuiltInStyles = useWatch({
    control: form.control,
    name: "removedBuiltInStyles",
    defaultValue: styles.filter((style) => !style.isCustom && style.deleted).map((style) => style.styleKey),
  }) ?? [];
  const watchedValues = useWatch({ control: form.control });

  const normalizedWatchedValues = useMemo(() => {
    const parsed = funnelSettingsSchema.safeParse(watchedValues);
    if (!parsed.success) {
      return null;
    }

    return normalizeValues(parsed.data);
  }, [watchedValues]);

  async function persistValues(values: FunnelValues) {
    const response = await fetch("/api/dashboard/funnel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      setStatusMessage(payload.message ?? copy.saveFailed);
      return;
    }

    form.reset(values);
      setStatusMessage(null);
  }

  function resetStylesToDefault() {
    form.setValue("enabledStyles", ["blackwork", "fine-line", "micro-realism"], {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("removedBuiltInStyles", [], {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const builtInStyles = styles
    .filter((style) => !style.isCustom && !style.deleted && !removedBuiltInStyles.includes(style.styleKey))
    .sort((left, right) => {
      const preferredOrder = ["blackwork", "fine-line", "micro-realism"];
      const leftRank = preferredOrder.indexOf(left.styleKey);
      const rightRank = preferredOrder.indexOf(right.styleKey);

      if (leftRank !== -1 || rightRank !== -1) {
        return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
      }

      return left.label.localeCompare(right.label);
    });
  const customStyleCards = useWatch({
    control: form.control,
    name: "customStyles",
    defaultValue: styles
      .filter((style) => style.isCustom)
      .map((style) => ({
        id: style.id,
        styleKey: style.styleKey,
        label: style.label,
        description: style.description ?? "",
        enabled: style.enabled,
      })),
  }) ?? [];
  const bookingCities = useWatch({
    control: form.control,
    name: "bookingCities",
    defaultValue: settings.bookingCities.map((city) => ({
      id: city.id,
      cityName: city.cityName,
      availableDates: city.availableDates,
    })),
  }) ?? [];

  function addBookingCity() {
    const nextCity = pendingCity.trim();
    if (!nextCity) {
      return;
    }

    bookingCitiesFieldArray.append({
      cityName: nextCity,
      availableDates: [],
    });
    setPendingCity("");
  }

  function toggleBookingDate(index: number, date: string) {
    const currentDates = form.getValues(`bookingCities.${index}.availableDates`) ?? [];
    const nextDates = currentDates.includes(date)
      ? currentDates.filter((item) => item !== date)
      : [...currentDates, date];

    form.setValue(
      `bookingCities.${index}.availableDates`,
      Array.from(new Set(nextDates)).sort(),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function removeBookingDate(index: number, date: string) {
    const currentDates = form.getValues(`bookingCities.${index}.availableDates`) ?? [];
    form.setValue(
      `bookingCities.${index}.availableDates`,
      currentDates.filter((item) => item !== date),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  useEffect(() => {
    if (initialSyncRef.current) {
      initialSyncRef.current = false;
      return;
    }

    if (!normalizedWatchedValues || !form.formState.isDirty) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await persistValues(normalizedWatchedValues);
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [form.formState.isDirty, normalizedWatchedValues]);

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
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
            <Textarea
              {...form.register("introDescription")}
              placeholder={
                locale === "tr"
                  ? "Bölgeyi, boyutu ve aklındaki fikri birkaç adımda paylaş."
                  : "Share the placement, size, and your idea in a few quick steps."
              }
            />
          </Field>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <input
              type="checkbox"
              className="size-4 accent-[var(--accent)]"
              {...form.register("showFeaturedDesigns")}
            />
            <span className="text-sm text-white">{copy.showFeatured}</span>
          </label>
          <input type="hidden" {...form.register("defaultLanguage")} value="tr" />
          <div className="space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="space-y-1">
              <p className="text-base font-medium text-white">{copy.bookingTitle}</p>
              <p className="text-sm text-[var(--foreground-muted)]">{copy.bookingDescription}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <NativeSelect value={pendingCity} onChange={(event) => setPendingCity(event.target.value)}>
                <option value="">{copy.cityPlaceholder}</option>
                {turkeyCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </NativeSelect>
              <Button type="button" onClick={addBookingCity}>
                <Plus className="size-4" />
                {copy.addCity}
              </Button>
            </div>

            {bookingCities.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">{copy.noCities}</p>
            ) : (
              <div className="space-y-4">
                {bookingCitiesFieldArray.fields.map((field, index) => {
                  const city = bookingCities[index];
                  const availableDates = city?.availableDates ?? [];

                  return (
                    <div key={field.id} className="rounded-[20px] border border-white/8 bg-black/20 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="flex-1">
                          <Field
                            label={copy.cityName}
                            error={form.formState.errors.bookingCities?.[index]?.cityName?.message}
                          >
                            <NativeSelect
                              value={city?.cityName ?? ""}
                              onChange={(event) =>
                                form.setValue(`bookingCities.${index}.cityName`, event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            >
                              <option value="">{copy.cityPlaceholder}</option>
                              {turkeyCities.map((cityOption) => (
                                <option key={cityOption} value={cityOption}>
                                  {cityOption}
                                </option>
                              ))}
                            </NativeSelect>
                          </Field>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => bookingCitiesFieldArray.remove(index)}
                        >
                          <Trash2 className="size-4" />
                          {copy.remove}
                        </Button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-white">{copy.availabilityTitle}</p>
                        <DateCalendarPopover
                          locale={locale}
                          mode="multiple"
                          triggerLabel={copy.availabilityTitle}
                          emptyLabel={copy.addDate}
                          selectedDates={availableDates}
                          onToggleDate={(date) => toggleBookingDate(index, date)}
                        />

                        {availableDates.length === 0 ? (
                          <p className="text-sm text-[var(--foreground-muted)]">{copy.noDates}</p>
                        ) : (
                          <p className="text-sm text-[var(--foreground-muted)]">
                            {locale === "tr"
                              ? `${availableDates.length} tarih seçildi`
                              : `${availableDates.length} dates selected`}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Field label={copy.activeStyles} className="gap-1">
                <div />
              </Field>
              <div className="flex items-center gap-2">
                <Badge variant="muted">{selectedStyles.length} {copy.activeCount}</Badge>
                <Button type="button" size="sm" variant="outline" onClick={resetStylesToDefault}>
                  <RotateCcw className="size-4" />
                  {copy.resetDefaults}
                </Button>
              </div>
            </div>
            <div className="grid gap-2 lg:grid-cols-6 xl:grid-cols-7">
              {builtInStyles.map((style) => {
                const active = selectedStyles.includes(style.styleKey);

                return (
                  <div
                    key={style.id}
                    className={`rounded-[12px] border px-2 py-1.5 text-left transition ${
                      active
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/12"
                        : "border-white/8 bg-black/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStyles = active
                            ? selectedStyles.filter((item) => item !== style.styleKey)
                            : [...selectedStyles, style.styleKey];
                          form.setValue("enabledStyles", nextStyles, { shouldValidate: true });
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-xs font-medium leading-4 text-white">{style.label}</p>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={copy.remove}
                        className="h-6 w-6 px-0"
                        onClick={() => {
                          form.setValue(
                            "enabledStyles",
                            selectedStyles.filter((item) => item !== style.styleKey),
                            { shouldValidate: true },
                          );
                          form.setValue(
                            "removedBuiltInStyles",
                            Array.from(new Set([...removedBuiltInStyles, style.styleKey])),
                            { shouldValidate: true, shouldDirty: true },
                          );
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {customStyleCards.map((style) => (
                <div
                  key={style.id ?? style.styleKey}
                    className={`rounded-[12px] border px-2 py-1.5 text-left transition ${
                    style.enabled
                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/12"
                      : "border-white/8 bg-black/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-medium leading-4 text-white">{style.label || copy.styleLabel}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={copy.remove}
                      className="h-6 w-6 px-0"
                      onClick={() => {
                        const styleIndex = customStyleCards.findIndex(
                          (item) => (item.id ?? item.styleKey) === (style.id ?? style.styleKey),
                        );
                        if (styleIndex !== -1) {
                          customStylesFieldArray.remove(styleIndex);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  {style.description ? (
                    <p className="mt-1 text-[10px] leading-4 text-[var(--foreground-muted)]">
                      {style.description}
                    </p>
                  ) : null}
                </div>
              ))}
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
                  <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                    <Field
                      label={copy.styleLabel}
                      error={form.formState.errors.customStyles?.[index]?.label?.message}
                    >
                      <Input {...form.register(`customStyles.${index}.label`)} placeholder="Etching" />
                    </Field>
                    <input type="hidden" {...form.register(`customStyles.${index}.styleKey`)} />
                    <div className="flex items-end gap-3">
                      <label className="flex h-10 items-center gap-2 rounded-full border border-white/8 bg-black/20 px-4">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          {...form.register(`customStyles.${index}.enabled`)}
                        />
                        <span className="text-sm text-white">{copy.enabled}</span>
                      </label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => customStylesFieldArray.remove(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Field
                    className="mt-4"
                    label={copy.customStyleDescription}
                    description={copy.customStyleDescriptionHelp}
                    error={form.formState.errors.customStyles?.[index]?.description?.message}
                  >
                    <Textarea
                      {...form.register(`customStyles.${index}.description`)}
                      placeholder={locale === "tr" ? "İnce dokular ve oyma hissi veren çizgiler." : "Fine textures with an engraved feel."}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </div>
          {statusMessage && !isSaving ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {statusMessage}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
