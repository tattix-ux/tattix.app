"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ImagePlus, Plus, RotateCcw, Trash2, Upload, X } from "lucide-react";
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
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

type FunnelValues = z.infer<typeof funnelSettingsSchema>;
type FunnelFormInput = z.input<typeof funnelSettingsSchema>;

export function FunnelSettingsForm({
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

  function normalizeValues(values: FunnelValues) {
    const usedKeys = new Set(styles.filter((style) => !style.isCustom).map((style) => style.styleKey));

    return {
      ...values,
      showFeaturedDesigns: false,
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
    } satisfies FunnelValues;
  }

  const copy =
    locale === "tr"
      ? {
          title: "Talep ayarları",
          description: "Müşterinin talep gönderirken gördüğü alanları burada düzenle.",
          introEyebrow: "Kısa üst yazı",
          introEyebrowHelp: "Müşterinin ilk gördüğü kısa açıklama.",
          introEyebrowPlaceholder: "Örn: Minimal ve fine line dövmeler",
          introTitleHelp: "Müşterinin ilk göreceği soru.",
          introTitle: "Karşılama başlığı",
          introTitlePlaceholder: "Nasıl bir dövme yaptırmak istiyorsun?",
          introTitleWarning: "Müşteriye ilk soruyu yazmalısın.",
          activeStyles: "Hangi stillerde çalışıyorsun?",
          activeStylesHelp: "Müşteri sadece örneği olan bu stillerde sana yazabilir.",
          activeStylesTip: "Az ve net seçim yapmak daha doğru müşteri getirir.",
          activeCount: "seçili",
          customStyles: "Özel stiller",
          addStyle: "Kendi stilini ekle",
          customStylesHelp: "Listede yoksa kendi tarzını ekle.",
          customStylesTip: "Kullanmadığın tarzları ekleme.",
          emptyStyles: "Özel bir tarzın varsa ekleyebilirsin.",
          styleLabel: "Stil adı",
          styleImage: "Örnek görsel",
          styleImageHelp: "Müşterinin bu stili anlaması için en az 1 örnek görsel ekle.",
          styleDescription: "Kısa açıklama",
          styleDescriptionHelp: "İstersen bu stilin nasıl bir his verdiğini kısa bir notla anlat.",
          styleDescriptionPlaceholder: "Örn. İnce çizgiler, sade kompozisyonlar ve temiz bitiş.",
          styleExampleRequired:
            "Bu stil için en az 1 örnek görsel ekle. Müşteriler stil adını tek başına anlamayabilir.",
          uploadStyleImage: "Görsel yükle",
          replaceStyleImage: "Görseli değiştir",
          removeStyleImage: "Görseli kaldır",
          noStyleImage: "Henüz örnek görsel eklenmedi",
          activeStyleExamples: "Müşteriye gösterilecek stiller",
          activeStyleExamplesHelp: "Seçtiğin her stil için küçük bir örnek ekle. Müşteri seçim ekranında bunu görür.",
          enabled: "Aktif",
          remove: "Kaldır",
          deleteConfirm: "Bu özel tarzı silmek istediğine emin misin?",
          addStyleTitle: "Kendi stilini ekle",
          resetDefaults: "Varsayılan stillere dön",
          saving: "Kaydediliyor",
          saveFailed: "Talep ayarları kaydedilemedi.",
          saved: "Talep ayarları kaydedildi.",
          bookingTitle: "Çalıştığın şehirler",
          bookingDescription: "Müşteriler sadece burada seçtiğin şehir ve tarihleri görebilir.",
          bookingEmptyWarning: "En az bir şehir eklemelisin.",
          addCity: "Şehir ekle",
          cityName: "Şehir",
          cityPlaceholder: "Örn. Adana",
          noCities: "Henüz şehir eklenmedi.",
          availabilityTitle: "Bu şehir için müsait olduğun tarihleri seç",
          availabilityHint: "Tarih seçmezsen müşteriler bu şehir için uygunluk göremez.",
          availabilityWarning: "Bu şehir için tarih seçmelisin.",
          dateEmptyWarning: "Bu şehir için tarih seçmelisin.",
          addDate: "Tarih seç",
          removeDate: "Tarihi kaldır",
          noDates: "Henüz tarih eklenmedi.",
          styleEmptyWarning: "En az bir tarz seçmelisin.",
        }
      : {
          title: "Request settings",
          description: "Adjust the fields clients see while sending you a request.",
          introEyebrow: "Short top line",
          introEyebrowHelp: "The short line clients see first.",
          introEyebrowPlaceholder: "e.g. Minimal and fine line tattoos",
          introTitleHelp: "The first question your client sees.",
          introTitle: "Welcome heading",
          introTitlePlaceholder: "What kind of tattoo do you want?",
          introTitleWarning: "Add the first question clients should answer.",
          activeStyles: "Which styles do you work in?",
          activeStylesHelp: "Clients can only message you in the styles that have an example.",
          activeStylesTip: "Fewer, clearer choices bring better-fit clients.",
          activeCount: "selected",
          customStyles: "Custom styles",
          addStyle: "Add your own style",
          customStylesHelp: "If it is not listed, add your own style.",
          customStylesTip: "Do not add styles you do not actually take.",
          emptyStyles: "Add a custom style if you have one.",
          styleLabel: "Style label",
          styleImage: "Example image",
          styleImageHelp: "Add at least one image so clients understand this style.",
          styleDescription: "Short description",
          styleDescriptionHelp: "Optionally explain the feel of this style in one short line.",
          styleDescriptionPlaceholder: "e.g. Clean linework, simple compositions, and a lighter overall feel.",
          styleExampleRequired:
            "Add at least one example image for this style. Clients may not understand the style name on its own.",
          uploadStyleImage: "Upload image",
          replaceStyleImage: "Replace image",
          removeStyleImage: "Remove image",
          noStyleImage: "No example image added yet",
          activeStyleExamples: "Styles shown to clients",
          activeStyleExamplesHelp: "Add a small example for each selected style. Clients see this in the request step.",
          enabled: "Enabled",
          remove: "Remove",
          deleteConfirm: "Are you sure you want to delete this custom style?",
          addStyleTitle: "Add your own style",
          resetDefaults: "Reset styles",
          saving: "Saving",
          saveFailed: "Unable to save request settings.",
          saved: "Request settings saved.",
          bookingTitle: "Working cities",
          bookingDescription: "Clients can only see the cities and dates you pick here.",
          bookingEmptyWarning: "Add at least one city.",
          addCity: "Add city",
          cityName: "City",
          cityPlaceholder: "e.g. Adana",
          noCities: "No cities added yet.",
          availabilityTitle: "Select the dates you are available in this city",
          availabilityHint: "If you do not pick dates, clients will not see availability for this city.",
          availabilityWarning: "Pick dates for this city.",
          dateEmptyWarning: "Pick dates for this city.",
          addDate: "Select dates",
          removeDate: "Remove date",
          noDates: "No dates added yet.",
          styleEmptyWarning: "Select at least one style.",
        };
  const form = useForm<FunnelFormInput, unknown, FunnelValues>({
    resolver: zodResolver(funnelSettingsSchema),
    defaultValues: {
      introEyebrow: settings.introEyebrow,
      introTitle: settings.introTitle,
      introDescription: settings.introDescription,
      showFeaturedDesigns: settings.showFeaturedDesigns,
      defaultLanguage: "tr",
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddStyleModalOpen, setIsAddStyleModalOpen] = useState(false);
  const [newStyleLabel, setNewStyleLabel] = useState("");
  const [uploadingStyleKey, setUploadingStyleKey] = useState<string | null>(null);
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
  const activeBuiltInStyleCount = selectedStyles.length;
  const activeCustomStyleCount = customStyleCards.filter((style) => style.enabled).length;
  const activeStyleCount = activeBuiltInStyleCount + activeCustomStyleCount;
  const activeBuiltInStyleCards = builtInStyleCards.filter((style) => selectedStyles.includes(style.styleKey));

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
    setIsAddStyleModalOpen(false);
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

  async function handleStyleImageUpload(
    target: { kind: "builtIn"; styleKey: string } | { kind: "custom"; styleKey: string },
    file: File,
  ) {
    if (!file.type.startsWith("image/")) {
      setStatusMessage(locale === "tr" ? "Lütfen görsel dosyası seç." : "Please choose an image file.");
      return;
    }

    if (demoMode) {
      setStatusMessage(
        locale === "tr"
          ? "Demo modunda görsel yükleme kapalı."
          : "Image uploads are disabled in demo mode.",
      );
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
          <Field
            label={copy.introEyebrow}
            description={copy.introEyebrowHelp}
            error={form.formState.errors.introEyebrow?.message}
          >
            <Input
              {...form.register("introEyebrow")}
              placeholder={copy.introEyebrowPlaceholder}
            />
          </Field>
          <Field
            label={copy.introTitle}
            description={
              form.watch("introTitle")?.trim().length ? copy.introTitleHelp : copy.introTitleWarning
            }
            error={form.formState.errors.introTitle?.message}
          >
            <Input
              {...form.register("introTitle")}
              placeholder={copy.introTitlePlaceholder}
            />
          </Field>
          <input type="hidden" {...form.register("introDescription")} />
          <input type="hidden" {...form.register("defaultLanguage")} value="tr" />
          <div className="space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="space-y-1">
              <p className="text-base font-medium text-white">{copy.bookingTitle}</p>
              <p className="text-sm text-[var(--foreground-muted)]">{copy.bookingDescription}</p>
            </div>
            {bookingCities.length === 0 ? (
              <p className="text-sm text-[var(--accent-soft)]">{copy.bookingEmptyWarning}</p>
            ) : null}

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
                        <p className="text-sm text-[var(--foreground-muted)]">{copy.availabilityHint}</p>
                        <DateCalendarPopover
                          locale={locale}
                          mode="multiple"
                          triggerLabel={copy.availabilityTitle}
                          emptyLabel={copy.addDate}
                          selectedDates={availableDates}
                          onToggleDate={(date) => toggleBookingDate(index, date)}
                        />

                        {availableDates.length === 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-[var(--foreground-muted)]">{copy.noDates}</p>
                            <p className="text-sm text-[var(--accent-soft)]">{copy.availabilityWarning}</p>
                            <p className="text-sm text-[var(--accent-soft)]">{copy.dateEmptyWarning}</p>
                          </div>
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

          <div className="space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-base font-medium text-white">{copy.activeStyles}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{copy.activeStylesHelp}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="muted">{selectedStyles.length} {copy.activeCount}</Badge>
                <Button type="button" size="sm" variant="outline" onClick={resetStylesToDefault}>
                  <RotateCcw className="size-4" />
                  {copy.resetDefaults}
                </Button>
              </div>
            </div>
            <p className="text-sm text-[var(--foreground-muted)]">{copy.activeStylesTip}</p>

            <div className="flex flex-wrap gap-2.5">
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
                  </div>
                );
              })}
            </div>

            {form.formState.errors.enabledStyles?.message ? (
              <p className="text-xs text-red-300">{form.formState.errors.enabledStyles.message}</p>
            ) : null}
            {activeStyleCount === 0 ? (
              <p className="text-sm text-[var(--accent-soft)]">{copy.styleEmptyWarning}</p>
            ) : null}

            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{copy.activeStyleExamples}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{copy.activeStyleExamplesHelp}</p>
              </div>
              {activeBuiltInStyleCards.length === 0 ? (
                <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-[var(--foreground-muted)]">
                  {copy.styleEmptyWarning}
                </div>
              ) : (
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
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {style.styleKey === "realism" ? "Realistic" : style.label}
                            </p>
                            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{copy.styleImageHelp}</p>
                          </div>
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
                                {hasImage ? copy.replaceStyleImage : copy.uploadStyleImage}
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
                                  {copy.removeStyleImage}
                                </Button>
                              ) : null}
                            </div>

                            {!hasImage ? (
                              <p className="text-xs text-amber-200">{copy.styleExampleRequired}</p>
                            ) : null}

                            <div className="space-y-2">
                              <p className="text-sm font-medium text-white">{copy.styleDescription}</p>
                              <Textarea
                                value={style.description ?? ""}
                                onChange={(event) =>
                                  form.setValue(`builtInStyles.${styleIndex}.description`, event.target.value, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                }
                                placeholder={copy.styleDescriptionPlaceholder}
                                className="min-h-[96px]"
                              />
                              <p className="text-xs text-[var(--foreground-muted)]">{copy.styleDescriptionHelp}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-base font-medium text-white">{copy.customStyles}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{copy.customStylesHelp}</p>
              </div>
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
            <p className="text-sm text-[var(--foreground-muted)]">{copy.customStylesTip}</p>
            {customStyleCards.length === 0 ? (
              <div className="rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-[var(--foreground-muted)]">
                {copy.emptyStyles}
              </div>
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
                          <p className="text-sm font-semibold text-white">{style.label || copy.styleLabel}</p>
                          <Badge variant={style.enabled ? "accent" : "muted"}>
                            {style.enabled ? copy.enabled : locale === "tr" ? "Kapalı" : "Hidden"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCustomStyle(styleIdentifier)}
                          >
                            {style.enabled ? (locale === "tr" ? "Gizle" : "Hide") : (locale === "tr" ? "Göster" : "Show")}
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
                              {hasImage ? copy.replaceStyleImage : copy.uploadStyleImage}
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
                                {copy.removeStyleImage}
                              </Button>
                            ) : null}
                          </div>

                          {!hasImage ? (
                            <p className="text-xs text-amber-200">{copy.styleExampleRequired}</p>
                          ) : null}

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-white">{copy.styleDescription}</p>
                            <Textarea
                              value={style.description ?? ""}
                              onChange={(event) =>
                                form.setValue(`customStyles.${index}.description`, event.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                              placeholder={copy.styleDescriptionPlaceholder}
                              className="min-h-[96px]"
                            />
                            <p className="text-xs text-[var(--foreground-muted)]">{copy.styleDescriptionHelp}</p>
                          </div>
                        </div>
                      </div>
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
                <p className="text-sm text-[var(--accent-soft)]">{copy.customStylesTip}</p>
              </div>
              <div className="mt-4 space-y-4">
                <Field label={copy.styleLabel}>
                  <Input
                    value={newStyleLabel}
                    onChange={(event) => setNewStyleLabel(event.target.value)}
                    placeholder={
                      locale === "tr"
                        ? "Özel bir tarzın varsa ekleyebilirsin."
                        : "Add a custom style if you need one."
                    }
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
