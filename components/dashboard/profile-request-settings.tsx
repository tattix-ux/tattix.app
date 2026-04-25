"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { CheckCircle2, ChevronDown, ImagePlus, LoaderCircle, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
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

  function getTodayIsoDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function sanitizeAvailableDates(dates: string[]) {
    const todayIso = getTodayIsoDate();

    return Array.from(new Set(dates))
      .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= todayIso)
      .sort();
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
        availableDates: sanitizeAvailableDates(city.availableDates),
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
        availableDates: sanitizeAvailableDates(city.availableDates),
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

  const [newStyleLabel, setNewStyleLabel] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadingStyleKey, setUploadingStyleKey] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [expandedCities, setExpandedCities] = useState<Record<string, boolean>>({});
  const [pendingFocusCityKey, setPendingFocusCityKey] = useState<"__last__" | null>(null);
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

  useEffect(() => {
    if (!pendingFocusCityKey) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const lastField = bookingCitiesFieldArray.fields.at(-1);
      if (lastField) {
        setExpandedCities((current) => ({
          ...current,
          [lastField.id]: true,
        }));
      }
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>("[data-city-input-key]"),
      );
      const target = inputs.at(-1) ?? null;
      target?.focus();
      target?.select();
      setPendingFocusCityKey(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingFocusCityKey, bookingCitiesFieldArray.fields.length]);

  function addBookingCity() {
    bookingCitiesFieldArray.append({
      cityName: "",
      availableDates: [],
    });
    setPendingFocusCityKey("__last__");
  }

  function setBookingDates(index: number, dates: string[]) {
    form.setValue(
      `bookingCities.${index}.availableDates`,
      Array.from(new Set(dates)).sort(),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function toggleBookingDate(index: number, date: string) {
    const currentDates = form.getValues(`bookingCities.${index}.availableDates`) ?? [];
    const nextDates = currentDates.includes(date)
      ? currentDates.filter((item) => item !== date)
      : [...currentDates, date];

    setBookingDates(index, nextDates);
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
  const nonEmptyBookingCities = bookingCities.filter((city) => city.cityName.trim());
  const bookingSummaryLabel =
    locale === "tr"
      ? nonEmptyBookingCities.length === 0
        ? "Henüz seçilmedi"
        : `${nonEmptyBookingCities.length} şehir seçili`
      : nonEmptyBookingCities.length === 0
        ? "Not set yet"
        : `${nonEmptyBookingCities.length} cities selected`;

  return (
    <div className="space-y-2 xl:space-y-1.5">
      <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
        <CardHeader className="pb-2.5 xl:pb-2">
          <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="min-w-0">
              <CardTitle className="text-[0.98rem]">{copy.bookingTitle}</CardTitle>
              <p className="mt-1 text-[11.5px] leading-[1.4] text-[var(--text-secondary)]">
                {copy.bookingDescription}
              </p>
            </div>
            <Button type="button" onClick={addBookingCity} className="h-8 text-[13px]">
              <Plus className="size-3.5" />
              {copy.addCity}
            </Button>
          </div>
          <div className="mt-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
              {bookingSummaryLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {bookingCities.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-4 text-[12px] text-[var(--text-muted)]">
              {copy.noCities}
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookingCitiesFieldArray.fields.map((field, index) => {
                const city = bookingCities[index];
                const availableDates = city?.availableDates ?? [];
                const isExpanded = expandedCities[field.id] ?? false;
                const cityLabel = city?.cityName?.trim() || copy.cityPlaceholder;

                return (
                  <div key={field.id} className="rounded-[16px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.025)] p-2.5 xl:p-3">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={cn(
                            "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[14px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.02)] px-3 py-2 text-left transition hover:border-[var(--border-strong)] hover:bg-white/[0.035]",
                            isExpanded && "border-[var(--border-strong)] bg-white/[0.04]",
                          )}
                          onClick={() =>
                            setExpandedCities((current) => ({
                              ...current,
                              [field.id]: !isExpanded,
                            }))
                          }
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-white">{cityLabel}</p>
                            <p className="mt-0.5 text-[10.5px] text-[var(--foreground-muted)]">
                              {availableDates.length === 0
                                ? copy.noDates
                                : `${availableDates.length} ${copy.selectedDays}`}
                            </p>
                          </div>
                          <ChevronDown className={cn("size-3.5 shrink-0 text-[var(--foreground-muted)] transition", isExpanded && "rotate-180")} />
                        </button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-[12px]"
                          onClick={() => bookingCitiesFieldArray.remove(index)}
                        >
                          <Trash2 className="size-3.5" />
                          {copy.remove}
                        </Button>
                      </div>

                      {isExpanded ? (
                        <div className="space-y-2 border-t border-[var(--border-soft)] pt-2.5">
                          <Input
                            data-city-input-key={field.id}
                            value={city?.cityName ?? ""}
                            onChange={(event) =>
                              form.setValue(`bookingCities.${index}.cityName`, event.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            placeholder={copy.cityPlaceholder}
                            className="h-8 text-[13px]"
                          />

                          <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-0.5">
                              <p className="text-[12px] font-medium text-white">{copy.dates}</p>
                              <p className="text-[11px] leading-[1.35] text-[var(--foreground-muted)]">{copy.datesDescription}</p>
                            </div>
                            <DateCalendarPopover
                              locale={locale}
                              mode="multiple"
                              triggerLabel={copy.dates}
                              emptyLabel={copy.addDate}
                              selectedDates={availableDates}
                              onChangeDates={(dates) => setBookingDates(index, dates)}
                              onToggleDate={(date) => toggleBookingDate(index, date)}
                            />
                          </div>
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

      <div className="flex min-h-5 items-center gap-1.5 px-1 text-[10.5px] text-[var(--foreground-muted)]">
        {saveState === "saving" ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {saveState === "saved" ? <CheckCircle2 className="size-4 text-[var(--accent-soft)]" /> : null}
        {statusMessage}
      </div>
    </div>
  );
}
