"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { CheckCircle2, ChevronDown, ImagePlus, LoaderCircle, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { DateCalendarPopover } from "@/components/ui/date-calendar-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { requestSettingsSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFunnelSettings, ArtistStyleOption } from "@/lib/types";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

type RequestSettingsValues = z.infer<typeof requestSettingsSchema>;
type RequestSettingsInput = z.input<typeof requestSettingsSchema>;

export function ProfileRequestSettings({
  settings,
  styles,
  demoMode = false,
  locale = "en",
}: {
  settings: ArtistFunnelSettings;
  styles: ArtistStyleOption[];
  demoMode?: boolean;
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

  function normalizeValues(values: RequestSettingsValues) {
    const usedKeys = new Set(styles.filter((style) => !style.isCustom).map((style) => style.styleKey));

    return {
      ...values,
      enabledStyles: values.enabledStyles.filter((styleKey) => !hiddenBuiltInStyleKeys.has(styleKey)),
      removedBuiltInStyles: Array.from(
        new Set([...values.removedBuiltInStyles, ...Array.from(hiddenBuiltInStyleKeys)]),
      ),
      builtInStyles: values.builtInStyles.map((style) => ({
        ...style,
        description: style.description?.trim() ?? "",
        imageUrl: style.imageUrl?.trim() ?? "",
        imagePath: style.imagePath?.trim() ?? "",
      })),
      customStyles: values.customStyles.map((style) => {
        const existingKey = style.styleKey?.trim();
        if (existingKey) {
          usedKeys.add(existingKey);
        }

        return {
          ...style,
          styleKey: existingKey || buildStyleKey(style.label, usedKeys),
          description: style.description?.trim() ?? "",
          imageUrl: style.imageUrl?.trim() ?? "",
          imagePath: style.imagePath?.trim() ?? "",
        };
      }),
      bookingCities: values.bookingCities.map((city) => ({
        ...city,
        cityName: city.cityName.trim(),
        availableDates: Array.from(new Set(city.availableDates)).sort(),
      })),
    } satisfies RequestSettingsValues;
  }

  const copy =
    locale === "tr"
      ? {
          bookingTitle: "Müsait olduğun şehirler ve günler",
          bookingDescription: "Randevuya açık olduğun şehirleri ve müsait günlerini burada yönet.",
          stylesTitle: "Çalıştığın stiller",
          cityName: "Şehir",
          cityPlaceholder: "Şehir adı yaz",
          addCity: "Şehir ekle",
          noCities: "Henüz şehir eklenmedi.",
          dates: "Tarihler",
          datesDescription: "Bu şehirde randevu kabul ettiğin günleri seç.",
          addDate: "Tarih seç",
          noDates: "Tarih seçilmedi.",
          selectedDays: "gün seçili",
          openDays: "Günleri göster",
          closeDays: "Günleri gizle",
          remove: "Kaldır",
          resetStyles: "Sıfırla",
          addStyle: "Özel stil ekle",
          newStylePlaceholder: "Yeni stil adı",
          noCustomStyles: "Özel stil yok.",
          styleDescription: "Kısa açıklama",
          styleDescriptionPlaceholder: "İstersen kısa bir not ekle.",
          styleImageRequired:
            "Bu stil için en az 1 örnek görsel ekle. Müşteriler stil adını tek başına anlamayabilir.",
          uploadImage: "Görsel yükle",
          replaceImage: "Görseli değiştir",
          removeImage: "Görseli kaldır",
          noStyleImage: "Görsel yok",
          enabled: "Açık",
          hidden: "Kapalı",
          saving: "Kaydediliyor",
          saved: "Kaydedildi",
          saveFailed: "Kaydedilemedi.",
          uploadUnavailable: "Demo modunda görsel yükleme kapalı.",
          uploadType: "Lütfen görsel dosyası seç.",
          deleteConfirm: "Bu stili silmek istediğine emin misin?",
        }
      : {
          bookingTitle: "Cities and booking days",
          bookingDescription: "Choose the cities and available days you want to show clients in the request form.",
          stylesTitle: "Styles you work in",
          cityName: "City",
          cityPlaceholder: "Type city name",
          addCity: "Add city",
          noCities: "No cities added yet.",
          dates: "Dates",
          datesDescription: "Choose the days when you accept appointments in this city.",
          addDate: "Pick dates",
          noDates: "No dates selected.",
          selectedDays: "days selected",
          openDays: "Show days",
          closeDays: "Hide days",
          remove: "Remove",
          resetStyles: "Reset",
          addStyle: "Add custom style",
          newStylePlaceholder: "New style name",
          noCustomStyles: "No custom styles.",
          styleDescription: "Short description",
          styleDescriptionPlaceholder: "Add a short note if you want.",
          styleImageRequired:
            "Add at least one example image for this style. Clients may not understand the style name on its own.",
          uploadImage: "Upload image",
          replaceImage: "Replace image",
          removeImage: "Remove image",
          noStyleImage: "No image",
          enabled: "Visible",
          hidden: "Hidden",
          saving: "Saving",
          saved: "Saved",
          saveFailed: "Unable to save.",
          uploadUnavailable: "Image uploads are disabled in demo mode.",
          uploadType: "Please choose an image file.",
          deleteConfirm: "Are you sure you want to delete this style?",
        };

  const form = useForm<RequestSettingsInput, unknown, RequestSettingsValues>({
    resolver: zodResolver(requestSettingsSchema),
    defaultValues: {
      builtInStyles: styles
        .filter((style) => !style.isCustom && !hiddenBuiltInStyleKeys.has(style.styleKey))
        .map((style) => ({
          styleKey: style.styleKey,
          label: style.styleKey === "realism" ? "Realistic" : style.label,
          description: style.description ?? "",
          imageUrl: style.imageUrl ?? "",
          imagePath: style.imagePath ?? "",
        })),
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
          imageUrl: style.imageUrl ?? "",
          imagePath: style.imagePath ?? "",
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
  const [newStyleLabel, setNewStyleLabel] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadingStyleKey, setUploadingStyleKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});
  const initialSyncRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedStyles = useWatch({
    control: form.control,
    name: "enabledStyles",
    defaultValue: styles
      .filter((style) => style.enabled && !style.isCustom)
      .map((style) => style.styleKey),
  }) ?? [];
  const builtInStyleCards = useWatch({
    control: form.control,
    name: "builtInStyles",
    defaultValue: styles
      .filter((style) => !style.isCustom && !hiddenBuiltInStyleKeys.has(style.styleKey))
      .map((style) => ({
        styleKey: style.styleKey,
        label: style.styleKey === "realism" ? "Realistic" : style.label,
        description: style.description ?? "",
        imageUrl: style.imageUrl ?? "",
        imagePath: style.imagePath ?? "",
      })),
  }) ?? [];
  const removedBuiltInStyles = useWatch({
    control: form.control,
    name: "removedBuiltInStyles",
    defaultValue: styles.filter((style) => !style.isCustom && style.deleted).map((style) => style.styleKey),
  }) ?? [];
  const watchedValues = useWatch({ control: form.control });

  const normalizedWatchedValues = useMemo(() => {
    const parsed = requestSettingsSchema.safeParse(watchedValues);
    if (!parsed.success) {
      return null;
    }

    return normalizeValues(parsed.data);
  }, [watchedValues]);

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
        imageUrl: style.imageUrl ?? "",
        imagePath: style.imagePath ?? "",
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

  async function persistValues(values: RequestSettingsValues) {
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
      setSaveState("error");
      return;
    }

    form.reset(values);
    setStatusMessage(payload.message ?? copy.saved);
    setSaveState("saved");
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
      setSaveState("saving");
      setStatusMessage(copy.saving);
      await persistValues(normalizedWatchedValues);
    }, 800);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [copy.saving, form.formState.isDirty, normalizedWatchedValues]);

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
      imageUrl: "",
      imagePath: "",
      enabled: true,
    });
    setNewStyleLabel("");
  }

  async function removeCustomStyle(styleKey: string) {
    if (!window.confirm(copy.deleteConfirm)) {
      return;
    }

    const styleIndex = customStyleCards.findIndex((item) => (item.id ?? item.styleKey) === styleKey);
    if (styleIndex !== -1) {
      const imagePath = form.getValues(`customStyles.${styleIndex}.imagePath`);
      if (imagePath && !demoMode) {
        try {
          await removeArtistAsset(imagePath);
        } catch {
          setStatusMessage(copy.saveFailed);
        }
      }
      customStylesFieldArray.remove(styleIndex);
    }
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

  async function handleStyleImageUpload(
    target: { kind: "builtIn"; styleKey: string } | { kind: "custom"; styleKey: string },
    file: File,
  ) {
    if (!file.type.startsWith("image/")) {
      setStatusMessage(copy.uploadType);
      return;
    }

    if (demoMode) {
      setStatusMessage(copy.uploadUnavailable);
      return;
    }

    const styleToken = `${target.kind}:${target.styleKey}`;
    setUploadingStyleKey(styleToken);

    try {
      const uploaded = await uploadArtistAsset(file, {
        artistId: settings.artistId,
        prefix: `style-${target.styleKey}`,
      });

      if (target.kind === "builtIn") {
        const index = builtInStyleCards.findIndex((style) => style.styleKey === target.styleKey);
        if (index !== -1) {
          const previousPath = form.getValues(`builtInStyles.${index}.imagePath`);
          form.setValue(`builtInStyles.${index}.imageUrl`, uploaded.publicUrl, {
            shouldDirty: true,
            shouldValidate: true,
          });
          form.setValue(`builtInStyles.${index}.imagePath`, uploaded.path, {
            shouldDirty: true,
            shouldValidate: true,
          });
          if (previousPath && previousPath !== uploaded.path) {
            await removeArtistAsset(previousPath).catch(() => undefined);
          }
        }
      } else {
        const index = customStyleCards.findIndex((style) => (style.id ?? style.styleKey) === target.styleKey);
        if (index !== -1) {
          const previousPath = form.getValues(`customStyles.${index}.imagePath`);
          form.setValue(`customStyles.${index}.imageUrl`, uploaded.publicUrl, {
            shouldDirty: true,
            shouldValidate: true,
          });
          form.setValue(`customStyles.${index}.imagePath`, uploaded.path, {
            shouldDirty: true,
            shouldValidate: true,
          });
          if (previousPath && previousPath !== uploaded.path) {
            await removeArtistAsset(previousPath).catch(() => undefined);
          }
        }
      }

      setStatusMessage(null);
    } catch {
      setStatusMessage(copy.saveFailed);
    } finally {
      setUploadingStyleKey(null);
    }
  }

  async function removeStyleImage(target: { kind: "builtIn"; styleKey: string } | { kind: "custom"; styleKey: string }) {
    if (target.kind === "builtIn") {
      const index = builtInStyleCards.findIndex((style) => style.styleKey === target.styleKey);
      if (index === -1) {
        return;
      }

      const imagePath = form.getValues(`builtInStyles.${index}.imagePath`);
      if (imagePath && !demoMode) {
        await removeArtistAsset(imagePath).catch(() => undefined);
      }

      form.setValue(`builtInStyles.${index}.imageUrl`, "", { shouldDirty: true, shouldValidate: true });
      form.setValue(`builtInStyles.${index}.imagePath`, "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    const index = customStyleCards.findIndex((style) => (style.id ?? style.styleKey) === target.styleKey);
    if (index === -1) {
      return;
    }

    const imagePath = form.getValues(`customStyles.${index}.imagePath`);
    if (imagePath && !demoMode) {
      await removeArtistAsset(imagePath).catch(() => undefined);
    }

    form.setValue(`customStyles.${index}.imageUrl`, "", { shouldDirty: true, shouldValidate: true });
    form.setValue(`customStyles.${index}.imagePath`, "", { shouldDirty: true, shouldValidate: true });
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

  const activeBuiltInStyleCards = builtInStyleCards.filter((style) => selectedStyles.includes(style.styleKey));
  const bookingSummaryLabel =
    locale === "tr"
      ? bookingCities.length === 0
        ? "Henüz seçilmedi"
        : `${bookingCities.length} şehir seçili`
      : bookingCities.length === 0
        ? "Not set yet"
        : `${bookingCities.length} cities selected`;

  return (
    <div className="space-y-3">
      <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <CardHeader className="pb-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
            <div className="min-w-0">
              <CardTitle className="text-[1.02rem]">{copy.bookingTitle}</CardTitle>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {copy.bookingDescription}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Input
                value={pendingCity}
                onChange={(event) => setPendingCity(event.target.value)}
                placeholder={copy.cityPlaceholder}
                className="h-12 min-w-[220px]"
              />
              <Button type="button" onClick={addBookingCity} className="h-12">
                <Plus className="size-4" />
                {copy.addCity}
              </Button>
            </div>
          </div>
          <div className="mt-3">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
              {bookingSummaryLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookingCities.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-6 text-sm text-[var(--text-muted)]">
              {copy.noCities}
            </div>
          ) : (
            <div className="space-y-4">
              {bookingCitiesFieldArray.fields.map((field, index) => {
                const city = bookingCities[index];
                const availableDates = city?.availableDates ?? [];
                const isExpanded = expandedCities[field.id] ?? availableDates.length === 0;

                return (
                  <div key={field.id} className="rounded-[22px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.025)] p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Input
                              value={city?.cityName ?? ""}
                              onChange={(event) =>
                                form.setValue(`bookingCities.${index}.cityName`, event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              placeholder={copy.cityPlaceholder}
                              className="h-12"
                            />
                            <Badge variant="accent" className="w-fit border-[var(--border-strong)] bg-[rgba(214,177,122,0.12)] text-[var(--text-primary)]">
                              {availableDates.length} {copy.selectedDays}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn("rounded-full", isExpanded && "border-[var(--border-strong)] bg-white/[0.04]")}
                            onClick={() =>
                              setExpandedCities((current) => ({
                                ...current,
                                [field.id]: !isExpanded,
                              }))
                            }
                          >
                            <ChevronDown className={cn("size-4 transition", isExpanded && "rotate-180")} />
                            {isExpanded ? copy.closeDays : copy.openDays}
                          </Button>
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
                      </div>

                      {isExpanded ? (
                        <div className="mt-4 space-y-3 border-t border-[var(--border-soft)] pt-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-white">{copy.dates}</p>
                              <p className="text-sm text-[var(--foreground-muted)]">{copy.datesDescription}</p>
                            </div>
                            <DateCalendarPopover
                              locale={locale}
                              mode="multiple"
                              triggerLabel={copy.dates}
                              emptyLabel={copy.addDate}
                              selectedDates={availableDates}
                              onToggleDate={(date) => toggleBookingDate(index, date)}
                            />
                          </div>

                          {availableDates.length === 0 ? (
                            <p className="text-sm text-[var(--foreground-muted)]">{copy.noDates}</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {availableDates.map((date) => (
                                <button
                                  key={date}
                                  type="button"
                                  onClick={() => removeBookingDate(index, date)}
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/[0.04] px-3 py-1.5 text-xs text-white"
                                >
                                  {date}
                                  <X className="size-3" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                    ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex min-h-6 items-center gap-2 px-1 text-sm text-[var(--foreground-muted)]">
        {saveState === "saving" ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {saveState === "saved" ? <CheckCircle2 className="size-4 text-[var(--accent-soft)]" /> : null}
        {statusMessage}
      </div>
    </div>
  );
}
