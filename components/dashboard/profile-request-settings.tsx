"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { CheckCircle2, ChevronDown, ImagePlus, LoaderCircle, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { DateCalendarPopover } from "@/components/ui/date-calendar-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          bookingTitle: "Şehir & randevu",
          stylesTitle: "Çalıştığın stiller",
          cityName: "Şehir",
          cityPlaceholder: "Adana",
          addCity: "Şehir ekle",
          noCities: "Henüz şehir eklenmedi.",
          dates: "Tarihler",
          addDate: "Tarih seç",
          noDates: "Tarih seçilmedi.",
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
          bookingTitle: "Cities & booking",
          stylesTitle: "Styles you work in",
          cityName: "City",
          cityPlaceholder: "Adana",
          addCity: "Add city",
          noCities: "No cities added yet.",
          dates: "Dates",
          addDate: "Pick dates",
          noDates: "No dates selected.",
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

  return (
    <div className="space-y-4">
      <details className="surface-border overflow-hidden rounded-[24px] border border-white/8 bg-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <p className="text-base font-medium text-white">{copy.bookingTitle}</p>
          <ChevronDown className="size-4 text-[var(--foreground-muted)] transition details-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-white/8 px-5 py-5">
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
                  <div key={field.id} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex-1">
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
                      <p className="text-sm font-medium text-white">{copy.dates}</p>
                      <DateCalendarPopover
                        locale={locale}
                        mode="multiple"
                        triggerLabel={copy.dates}
                        emptyLabel={copy.addDate}
                        selectedDates={availableDates}
                        onToggleDate={(date) => toggleBookingDate(index, date)}
                      />

                      {availableDates.length === 0 ? (
                        <p className="text-sm text-[var(--foreground-muted)]">{copy.noDates}</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {availableDates.map((date) => (
                            <button
                              key={date}
                              type="button"
                              onClick={() => removeBookingDate(index, date)}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white"
                            >
                              {date}
                              <X className="size-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </details>

      <details className="surface-border overflow-hidden rounded-[24px] border border-white/8 bg-black/20">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <p className="text-base font-medium text-white">{copy.stylesTitle}</p>
          <ChevronDown className="size-4 text-[var(--foreground-muted)] transition details-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-white/8 px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {builtInStyles.map((style) => {
              const active = selectedStyles.includes(style.styleKey);

              return (
                <div
                  key={style.id}
                  className={cn(
                    "flex items-center gap-1 rounded-full border pr-1.5 transition",
                    active
                      ? "border-[var(--accent)]/35 bg-[var(--accent)]/14 text-white"
                      : "border-white/8 bg-white/[0.03] text-[var(--foreground-muted)] hover:border-white/14",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleBuiltInStyle(style.styleKey)}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition",
                      active ? "text-white" : "text-[var(--foreground-muted)] hover:text-white",
                    )}
                  >
                    {style.styleKey === "realism" ? "Realistic" : style.label}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={copy.remove}
                    className="h-7 w-7 rounded-full px-0"
                    onClick={() => {
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
                </div>
              );
            })}

            <Button type="button" size="sm" variant="outline" onClick={resetStylesToDefault}>
              <RotateCcw className="size-4" />
              {copy.resetStyles}
            </Button>
          </div>

          {activeBuiltInStyleCards.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {activeBuiltInStyleCards.map((style) => {
                const styleIndex = builtInStyleCards.findIndex((item) => item.styleKey === style.styleKey);
                const hasImage = Boolean(style.imageUrl);
                const isUploading = uploadingStyleKey === `builtIn:${style.styleKey}`;

                return (
                  <div
                    key={style.styleKey}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {style.styleKey === "realism" ? "Realistic" : style.label}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleBuiltInStyle(style.styleKey)}
                      >
                        {copy.remove}
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-[108px_minmax(0,1fr)] sm:items-start">
                      <div className="overflow-hidden rounded-[18px] border border-white/8 bg-black/25 p-2">
                        <div className="flex h-[108px] items-center justify-center rounded-[14px] bg-white/[0.04]">
                          {hasImage ? (
                            <img
                              src={style.imageUrl ?? ""}
                              alt={style.label}
                              className="h-full w-full rounded-[10px] object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 px-3 text-center text-[var(--foreground-muted)]">
                              <ImagePlus className="size-5" />
                              <span className="text-xs leading-5">{copy.noStyleImage}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <label
                            className={cn(
                              "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 text-xs font-medium text-white transition hover:bg-white/12",
                              isUploading && "pointer-events-none opacity-50",
                            )}
                          >
                            <Upload className="size-4" />
                            {hasImage ? copy.replaceImage : copy.uploadImage}
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) {
                                  void handleStyleImageUpload({ kind: "builtIn", styleKey: style.styleKey }, file);
                                }
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                          {hasImage ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void removeStyleImage({ kind: "builtIn", styleKey: style.styleKey })}
                            >
                              <X className="size-4" />
                              {copy.removeImage}
                            </Button>
                          ) : null}
                        </div>

                        {!hasImage ? (
                          <p className="text-xs text-amber-200">{copy.styleImageRequired}</p>
                        ) : null}

                        <Textarea
                          value={style.description ?? ""}
                          onChange={(event) =>
                            form.setValue(`builtInStyles.${styleIndex}.description`, event.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          placeholder={copy.styleDescriptionPlaceholder}
                          className="min-h-[92px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="space-y-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={newStyleLabel}
                onChange={(event) => setNewStyleLabel(event.target.value)}
                placeholder={copy.newStylePlaceholder}
              />
              <Button type="button" onClick={addCustomStyle}>
                <Plus className="size-4" />
                {copy.addStyle}
              </Button>
            </div>

            {customStyleCards.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">{copy.noCustomStyles}</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {customStyleCards.map((style, index) => {
                  const styleIdentifier = style.id ?? style.styleKey ?? `custom-style-${index}`;
                  const hasImage = Boolean(style.imageUrl);
                  const isUploading = uploadingStyleKey === `custom:${styleIdentifier}`;

                  return (
                    <div
                      key={styleIdentifier}
                      className={cn(
                        "rounded-[22px] border p-4 transition",
                        style.enabled
                          ? "border-[var(--accent)]/18 bg-white/[0.04]"
                          : "border-white/8 bg-white/[0.02]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-white">{style.label}</p>
                          <Badge variant={style.enabled ? "accent" : "muted"}>
                            {style.enabled ? copy.enabled : copy.hidden}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCustomStyle(styleIdentifier)}
                          >
                            {style.enabled ? copy.remove : copy.enabled}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void removeCustomStyle(styleIdentifier)}
                          >
                            <Trash2 className="size-4" />
                            {copy.remove}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-[108px_minmax(0,1fr)] sm:items-start">
                        <div className="overflow-hidden rounded-[18px] border border-white/8 bg-black/25 p-2">
                          <div className="flex h-[108px] items-center justify-center rounded-[14px] bg-white/[0.04]">
                            {hasImage ? (
                              <img
                                src={style.imageUrl ?? ""}
                                alt={style.label}
                                className="h-full w-full rounded-[10px] object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 px-3 text-center text-[var(--foreground-muted)]">
                                <ImagePlus className="size-5" />
                                <span className="text-xs leading-5">{copy.noStyleImage}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <label
                              className={cn(
                                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 text-xs font-medium text-white transition hover:bg-white/12",
                                isUploading && "pointer-events-none opacity-50",
                              )}
                            >
                              <Upload className="size-4" />
                              {hasImage ? copy.replaceImage : copy.uploadImage}
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    void handleStyleImageUpload({ kind: "custom", styleKey: styleIdentifier }, file);
                                  }
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                            {hasImage ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => void removeStyleImage({ kind: "custom", styleKey: styleIdentifier })}
                              >
                                <X className="size-4" />
                                {copy.removeImage}
                              </Button>
                            ) : null}
                          </div>

                          {!hasImage ? (
                            <p className="text-xs text-amber-200">{copy.styleImageRequired}</p>
                          ) : null}

                          <Textarea
                            value={style.description ?? ""}
                            onChange={(event) =>
                              form.setValue(`customStyles.${index}.description`, event.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            placeholder={copy.styleDescriptionPlaceholder}
                            className="min-h-[92px]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </details>

      <div className="flex min-h-6 items-center gap-2 px-1 text-sm text-[var(--foreground-muted)]">
        {saveState === "saving" ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {saveState === "saved" ? <CheckCircle2 className="size-4 text-[var(--accent-soft)]" /> : null}
        {statusMessage}
      </div>
    </div>
  );
}
