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
  const hiddenBuiltInStyleKeys = new Set([
    "fine-line",
    "traditional",
    "neo-traditional",
    "lettering",
    "custom",
    "ornamental",
    "not-sure-style",
  ]);

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
      showFeaturedDesigns: false,
      enabledStyles: values.enabledStyles.filter((styleKey) => !hiddenBuiltInStyleKeys.has(styleKey)),
      removedBuiltInStyles: Array.from(
        new Set([...values.removedBuiltInStyles, ...Array.from(hiddenBuiltInStyleKeys)]),
      ),
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
          description: "",
          introEyebrow: "Üst kısa etiket",
          introTitle: "Giriş başlığı",
          introDescription: "Giriş açıklaması",
          activeStyles: "Müşteriye hangi tarzları sunmak istiyorsun?",
          activeStylesHelp: "Müşteri sadece seçtiğin tarzları görür.",
          activeCount: "seçili",
          customStyles: "Kendi eklediğin tarzlar",
          addStyle: "Kendi stilini ekle",
          customStylesHelp: "Listede yoksa kendi tarzını ekleyebilirsin.",
          emptyStyles: "Özel bir tarzın varsa ekleyebilirsin.",
          styleLabel: "Stil adı",
          enabled: "Aktif",
          remove: "Kaldır",
          deleteConfirm: "Bu özel tarzı silmek istediğine emin misin?",
          addStyleTitle: "Kendi stilini ekle",
          resetDefaults: "Varsayılan stillere dön",
          saving: "Kaydediliyor",
          saveFailed: "Akış ayarları kaydedilemedi.",
          saved: "Akış ayarları kaydedildi.",
          bookingTitle: "Çalıştığın şehirler",
          bookingDescription: "Müşteri yalnızca burada tanımladığın şehirleri ve tarihleri görür.",
          addCity: "Şehir ekle",
          cityName: "Şehir",
          cityPlaceholder: "Örn. Adana",
          noCities: "Henüz şehir eklenmedi.",
          availabilityTitle: "Bu şehir için müsait olduğun tarihleri seç",
          addDate: "Tarih seç",
          removeDate: "Tarihi kaldır",
          noDates: "Henüz tarih eklenmedi.",
        }
      : {
          title: "Funnel settings",
          description: "",
          introEyebrow: "Intro eyebrow",
          introTitle: "Intro title",
          introDescription: "Intro description",
          activeStyles: "Which styles do you want to show customers?",
          activeStylesHelp: "Customers only see the styles you select.",
          activeCount: "selected",
          customStyles: "Custom styles",
          addStyle: "Add your own style",
          customStylesHelp: "If it is not listed, you can add your own style.",
          emptyStyles: "Add a custom style if you have one.",
          styleLabel: "Style label",
          enabled: "Enabled",
          remove: "Remove",
          deleteConfirm: "Are you sure you want to delete this custom style?",
          addStyleTitle: "Add your own style",
          resetDefaults: "Reset styles",
          saving: "Saving",
          saveFailed: "Unable to save funnel settings.",
          saved: "Funnel settings saved.",
          bookingTitle: "Working cities",
          bookingDescription: "Customers only see the cities and dates you define here.",
          addCity: "Add city",
          cityName: "City",
          cityPlaceholder: "e.g. Adana",
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
  const [isAddStyleModalOpen, setIsAddStyleModalOpen] = useState(false);
  const [newStyleLabel, setNewStyleLabel] = useState("");
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
    form.setValue("enabledStyles", ["blackwork", "minimal", "micro-realism", "realism"], {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue("removedBuiltInStyles", Array.from(hiddenBuiltInStyleKeys), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const builtInStyles = styles
    .filter(
      (style) =>
        !style.isCustom &&
        !style.deleted &&
        !removedBuiltInStyles.includes(style.styleKey) &&
        !hiddenBuiltInStyleKeys.has(style.styleKey),
    )
    .sort((left, right) => {
      const preferredOrder = ["blackwork", "minimal", "micro-realism", "realism"];
      const leftRank = preferredOrder.indexOf(left.styleKey);
      const rightRank = preferredOrder.indexOf(right.styleKey);

      if (leftRank !== -1 || rightRank !== -1) {
        return (leftRank === -1 ? 99 : leftRank) - (rightRank === -1 ? 99 : rightRank);
      }

      const leftLabel = left.styleKey === "realism" ? "Realistic" : left.label;
      const rightLabel = right.styleKey === "realism" ? "Realistic" : right.label;
      return leftLabel.localeCompare(rightLabel);
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

  function toggleBuiltInStyle(styleKey: string) {
    const active = selectedStyles.includes(styleKey);
    const nextStyles = active
      ? selectedStyles.filter((item) => item !== styleKey)
      : [...selectedStyles, styleKey];

    form.setValue("enabledStyles", nextStyles, { shouldValidate: true, shouldDirty: true });
  }

  function toggleCustomStyle(styleKey: string) {
    const styleIndex = customStyleCards.findIndex((item) => (item.id ?? item.styleKey) === styleKey);
    if (styleIndex === -1) {
      return;
    }

    const current = form.getValues(`customStyles.${styleIndex}.enabled`);
    form.setValue(`customStyles.${styleIndex}.enabled`, !current, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function addCustomStyle() {
    const label = newStyleLabel.trim();
    if (label.length < 2) {
      return;
    }

    customStylesFieldArray.append({
      styleKey: "",
      label,
      description: "",
      enabled: true,
    });
    setNewStyleLabel("");
    setIsAddStyleModalOpen(false);
  }

  function removeCustomStyle(styleKey: string) {
    if (!window.confirm(copy.deleteConfirm)) {
      return;
    }

    const styleIndex = customStyleCards.findIndex((item) => (item.id ?? item.styleKey) === styleKey);
    if (styleIndex !== -1) {
      customStylesFieldArray.remove(styleIndex);
    }
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
        {copy.description ? <CardDescription>{copy.description}</CardDescription> : null}
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
          <input type="hidden" {...form.register("defaultLanguage")} value="tr" />
          <div className="space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="space-y-1">
              <p className="text-base font-medium text-white">{copy.bookingTitle}</p>
              <p className="text-sm text-[var(--foreground-muted)]">{copy.bookingDescription}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={pendingCity}
                onChange={(event) => setPendingCity(event.target.value)}
                placeholder={copy.cityPlaceholder}
              />
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
                            <Input
                              value={city?.cityName ?? ""}
                              onChange={(event) =>
                                form.setValue(`bookingCities.${index}.cityName`, event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              placeholder={copy.cityPlaceholder}
                            />
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
              <Field label={copy.activeStyles} description={copy.activeStylesHelp} className="gap-1">
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
            <div className="flex flex-wrap gap-2">
              {builtInStyles.map((style) => {
                const active = selectedStyles.includes(style.styleKey);

                return (
                  <button
                    type="button"
                    key={style.id}
                    onClick={() => toggleBuiltInStyle(style.styleKey)}
                    className={`flex items-center gap-2 rounded-[12px] border px-2 py-1.5 text-left transition ${
                      active
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/12"
                        : "border-white/8 bg-black/20 text-[var(--foreground-muted)]"
                    }`}
                  >
                    <span className={`text-xs font-medium leading-4 ${active ? "text-white" : "text-[var(--foreground-muted)]"}`}>
                      {style.styleKey === "realism" ? "Realistic" : style.label}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={copy.remove}
                      className="h-6 w-6 px-0"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!window.confirm(copy.deleteConfirm)) {
                          return;
                        }
                        form.setValue(
                          "removedBuiltInStyles",
                          Array.from(new Set([...removedBuiltInStyles, style.styleKey])),
                          { shouldValidate: true, shouldDirty: true },
                        );
                        form.setValue(
                          "enabledStyles",
                          selectedStyles.filter((item) => item !== style.styleKey),
                          { shouldValidate: true, shouldDirty: true },
                        );
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
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
              <Field label={copy.customStyles} description={copy.customStylesHelp} className="gap-1">
                <div />
              </Field>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsAddStyleModalOpen(true)}
              >
                <Plus className="size-4" />
                {copy.addStyle}
              </Button>
            </div>
            {customStyleCards.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-4 text-sm text-[var(--foreground-muted)]">
                {copy.emptyStyles}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {customStyleCards.map((style, index) => {
                  const styleIdentifier = style.id ?? style.styleKey ?? `custom-style-${index}`;

                  return (
                  <div
                    key={styleIdentifier}
                    className={`flex items-center gap-2 rounded-[12px] border px-2 py-1.5 text-left transition ${
                    style.enabled
                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/12"
                      : "border-white/8 bg-black/20"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCustomStyle(styleIdentifier)}
                      className="text-left"
                    >
                      <p className={`text-xs font-medium leading-4 ${style.enabled ? "text-white" : "text-[var(--foreground-muted)]"}`}>
                        {style.label || copy.styleLabel}
                      </p>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={copy.remove}
                      className="h-6 w-6 px-0"
                      onClick={() => removeCustomStyle(styleIdentifier)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          {statusMessage && !isSaving ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {statusMessage}
            </p>
          ) : null}
        </form>

        {isAddStyleModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#171515] p-5 shadow-2xl">
              <div className="space-y-1">
                <p className="text-base font-medium text-white">{copy.addStyleTitle}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{copy.customStylesHelp}</p>
              </div>
              <div className="mt-4 space-y-4">
                <Field label={copy.styleLabel}>
                  <Input
                    value={newStyleLabel}
                    onChange={(event) => setNewStyleLabel(event.target.value)}
                    placeholder={locale === "tr" ? "Örn. Etching" : "e.g. Etching"}
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setNewStyleLabel("");
                      setIsAddStyleModalOpen(false);
                    }}
                  >
                    {locale === "tr" ? "Vazgeç" : "Cancel"}
                  </Button>
                  <Button type="button" onClick={addCustomStyle} disabled={newStyleLabel.trim().length < 2}>
                    {copy.addStyle}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
