"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { featuredDesignCategories } from "@/lib/constants/options";
import { featuredDesignsSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { ArtistFeaturedDesign } from "@/lib/types";
import { cn } from "@/lib/utils";

type FeaturedDesignFormInput = z.input<typeof featuredDesignsSchema>;
type FeaturedDesignValues = z.output<typeof featuredDesignsSchema>;

function DesignSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:p-6",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-white">{title}</h3>
        {description ? (
          <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_92%,white_4%)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const copy = {
  en: {
    uploadUnavailable: "Image upload is unavailable in demo mode.",
    invalidType: "Only image files are allowed.",
    invalidSize: "Image files must be 6 MB or smaller.",
    uploaded: "Image uploaded. Save designs to persist.",
    uploadFailed: "Unable to upload image.",
    saveFailed: "Unable to save designs.",
    saved: "Designs saved.",
    title: "Designs",
    description: "Manage the designs clients can see, with a clear visual and reference price range.",
    item: "Design",
    newItem: "New design",
    remove: "Remove",
    removeConfirm: "Remove this design?",
    category: "Category",
    categoryHelp: "Choose a category to keep designs organized.",
    customCategory: "Custom category",
    customCategoryPlaceholder: "e.g. Floral",
    titleLabel: "Design name",
    titleHelp: "Clients see this name in the selection screen.",
    titlePlaceholder: "e.g. Fine line butterfly",
    shortDescription: "Short description",
    shortDescriptionPlaceholder: "e.g. Fine line piece that works well on the forearm or upper arm.",
    shortDescriptionHelp: "Add a short note clients can read before they choose it.",
    shortDescriptionHints: "Style · Best placement · Overall look",
    image: "Design image",
    imageDescription: "Clients see this image in the selection screen.",
    noImage: "No image selected yet",
    uploadImage: "Upload image",
    removeImage: "Remove image",
    sectionGeneral: "Design overview",
    sectionGeneralHelp: "Set the name, category, and client visibility.",
    sectionImage: "Visual",
    sectionImageHelp: "Use the image clients will see before they choose the design.",
    sectionPricing: "Price reference",
    sectionPricingHelp: "Set the reference size, detail level, and example price range.",
    sectionClientCopy: "Client-facing description",
    sectionClientCopyHelp: "Add a short note that helps clients understand the design.",
    liveLabel: "Show to clients",
    liveHelp: "If this is on, the design appears in the client screen.",
    liveOn: "Live",
    liveOff: "Hidden",
    priceNote: "Example size",
    priceNoteHelp: "The longest reference measurement for this design.",
    detailLevel: "Detail level",
    detailLevelHelp: "More workmanship usually means a higher price.",
    detailLow: "Low detail",
    detailMedium: "Medium detail",
    detailHigh: "High detail",
    detailHintLow: "Simpler and faster to tattoo",
    detailHintMedium: "Balanced amount of work",
    detailHintHigh: "Denser work and more time",
    priceRange: "Price range for this design",
    priceRangeHelp: "Clients see this range for the example size and detail level above.",
    priceRangeNote: "Final price can still change after placement and final brief.",
    summaryPrefix: "Example",
    priceMin: "Min price",
    priceMax: "Max price",
    sizePlaceholder: "e.g. 10",
    addDesign: "Add new design",
    saving: "Saving",
    save: "Save changes",
    flash: "Flash designs",
    discounted: "Discounted designs",
    customOption: "Custom category",
    dragHint: "Drag to reorder",
    currencyPrefix: "TRY",
    replaceImage: "Replace image",
    unsavedChanges: "You have unsaved changes.",
    savedState: "All changes are saved.",
  },
  tr: {
    uploadUnavailable: "Demo modunda görsel yükleme kullanılamıyor.",
    invalidType: "Yalnızca görsel dosyaları yükleyebilirsin.",
    invalidSize: "Görseller en fazla 6 MB olabilir.",
    uploaded: "Görsel yüklendi. Kaydettiğinde kalıcı olur.",
    uploadFailed: "Görsel yüklenemedi.",
    saveFailed: "Tasarımlar kaydedilemedi.",
    saved: "Tasarımlar kaydedildi.",
    title: "Tasarımlar",
    description: "Müşteriye göstereceğin tasarımları, referans fiyat aralığıyla birlikte düzenle.",
    item: "Tasarım",
    newItem: "Yeni tasarım",
    remove: "Kaldır",
    removeConfirm: "Bu tasarımı kaldırmak istiyor musun?",
    category: "Kategori",
    categoryHelp: "Tasarımı düzenli tutmak için kategori seç.",
    customCategory: "Özel kategori",
    customCategoryPlaceholder: "Örn. Floral",
    titleLabel: "Tasarım adı",
    titleHelp: "Müşteri bu adı seçim ekranında görür.",
    titlePlaceholder: "Örn. Minimal gül",
    shortDescription: "Kısa açıklama",
    shortDescriptionPlaceholder: "Örn. İnce çizgi çalışılır. Ön kol ve üst kolda iyi durur.",
    shortDescriptionHelp: "Müşteriye bu tasarım hakkında kısa bir not gösterebilirsin.",
    shortDescriptionHints: "Stil · Uygun bölgeler · Genel görünüm",
    image: "Tasarım görseli",
    imageDescription: "Müşteri bu görseli seçim ekranında görür.",
    noImage: "Henüz görsel seçilmedi",
    uploadImage: "Görsel yükle",
    removeImage: "Görseli kaldır",
    sectionGeneral: "Tasarım genel",
    sectionGeneralHelp: "Tasarım adı, kategori ve görünürlüğü burada belirlenir.",
    sectionImage: "Görsel",
    sectionImageHelp: "Müşterinin seçim ekranında göreceği görseli kullan.",
    sectionPricing: "Fiyat referansı",
    sectionPricingHelp: "Örnek boyut, detay seviyesi ve fiyat aralığını birlikte belirle.",
    sectionClientCopy: "Müşteriye gösterilecek açıklama",
    sectionClientCopyHelp: "Müşterinin tasarımı daha hızlı anlaması için kısa bir not ekle.",
    liveLabel: "Müşteriye göster",
    liveHelp: "Açıksa bu tasarım müşteri ekranında görünür.",
    liveOn: "Yayında",
    liveOff: "Yayında değil",
    priceNote: "Örnek boyut",
    priceNoteHelp: "Bu tasarım için referans alınan en uzun ölçü.",
    detailLevel: "Detay seviyesi",
    detailLevelHelp: "İşçilik yoğunluğu arttıkça fiyat da artabilir.",
    detailLow: "Az detay",
    detailMedium: "Orta detay",
    detailHigh: "Çok detay",
    detailHintLow: "Daha sade ve hızlı uygulanır",
    detailHintMedium: "Standart yoğunlukta çalışma",
    detailHintHigh: "Daha yoğun işçilik ve süre gerektirir",
    priceRange: "Bu tasarım için fiyat aralığı",
    priceRangeHelp: "Müşteriye, yukarıdaki örnek boyut ve detay seviyesi için bu aralık gösterilir.",
    priceRangeNote: "Kesin fiyat, yerleşim ve son brief’e göre değişebilir.",
    summaryPrefix: "Örnek",
    priceMin: "Min fiyat",
    priceMax: "Maks fiyat",
    sizePlaceholder: "Örn. 10",
    addDesign: "Yeni tasarım ekle",
    saving: "Kaydediliyor",
    save: "Değişiklikleri kaydet",
    flash: "Flash tasarımlar",
    discounted: "İndirimli tasarımlar",
    customOption: "Özel kategori",
    dragHint: "Sıralamak için sürükle",
    currencyPrefix: "₺",
    replaceImage: "Görseli değiştir",
    unsavedChanges: "Kaydedilmemiş değişiklikler var.",
    savedState: "Tüm değişiklikler kaydedildi.",
  },
} as const;

export function FeaturedDesignsForm({
  designs,
  artistId,
  demoMode,
  locale = "en",
}: {
  designs: ArtistFeaturedDesign[];
  artistId: string;
  demoMode: boolean;
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const labels = copy[locale];
  const [expandedId, setExpandedId] = useState<string | null>(designs[0]?.id ?? null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [expandLatestCard, setExpandLatestCard] = useState(false);
  const form = useForm<FeaturedDesignFormInput, unknown, FeaturedDesignValues>({
    resolver: zodResolver(featuredDesignsSchema),
    defaultValues: {
      designs: designs.map((design) => ({
        id: design.id,
        category: design.category,
        title: design.title,
        shortDescription: design.shortDescription,
        imageUrl: design.imageUrl ?? "",
        imagePath: design.imagePath ?? "",
        priceNote: design.priceNote ?? "",
        referenceDetailLevel: design.referenceDetailLevel ?? "standard",
        referencePriceMin: design.referencePriceMin,
        referencePriceMax: design.referencePriceMax,
        active: design.active,
        sortOrder: design.sortOrder,
      })),
    } satisfies FeaturedDesignFormInput,
  });

  const designsFieldArray = useFieldArray({
    control: form.control,
    name: "designs",
  });
  const watchedDesigns = useWatch({
    control: form.control,
    name: "designs",
    defaultValue: form.getValues("designs"),
  });

  useEffect(() => {
    if (!expandLatestCard) {
      return;
    }

    const latestField = designsFieldArray.fields.at(-1);
    if (latestField) {
      setExpandedId(latestField.id);
      setExpandLatestCard(false);
    }
  }, [designsFieldArray.fields, expandLatestCard]);

  function getCategorySelectValue(category: string) {
    return featuredDesignCategories.some((item) => item.value === category) ? category : "__custom__";
  }

  function getCategoryLabel(category: string) {
    if (category === "flash-designs") {
      return labels.flash;
    }

    if (category === "discounted-designs") {
      return labels.discounted;
    }

    return category;
  }

  function handleRemove(index: number) {
    if (typeof window !== "undefined" && !window.confirm(labels.removeConfirm)) {
      return;
    }

    designsFieldArray.remove(index);
  }

  async function handleImageUpload(index: number, file: File) {
    if (demoMode) {
      form.setError("root", { message: labels.uploadUnavailable });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: labels.invalidType });
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      form.setError("root", { message: labels.invalidSize });
      return;
    }

    const previousPath = form.getValues(`designs.${index}.imagePath`) || "";

    try {
      const uploaded = await uploadArtistAsset(file, {
        artistId,
        bucket: "artist-designs",
        prefix: "featured-design",
      });

      if (previousPath) {
        await removeArtistAsset(previousPath, { bucket: "artist-designs" }).catch(() => undefined);
      }

      form.setValue(`designs.${index}.imageUrl`, uploaded.publicUrl, { shouldDirty: true });
      form.setValue(`designs.${index}.imagePath`, uploaded.path, { shouldDirty: true });
      form.setError("root", { message: labels.uploaded });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : labels.uploadFailed,
      });
    }
  }

  async function handleImageRemove(index: number) {
    const existingPath = form.getValues(`designs.${index}.imagePath`) || "";

    if (existingPath && !demoMode) {
      await removeArtistAsset(existingPath, { bucket: "artist-designs" }).catch(() => undefined);
    }

    form.setValue(`designs.${index}.imageUrl`, "", { shouldDirty: true });
    form.setValue(`designs.${index}.imagePath`, "", { shouldDirty: true });
  }

  async function onSubmit(values: FeaturedDesignValues) {
    const response = await fetch("/api/dashboard/designs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    await response.json().catch(() => null);

    if (!response.ok) {
      form.setError("root", { message: labels.saveFailed });
      return;
    }

    form.setError("root", { message: labels.saved });
    router.refresh();
  }

  function formatPrice(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return null;
    }

    return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US").format(value);
  }

  function toNullableNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  const detailOptions = [
    { value: "simple", label: labels.detailLow, hint: labels.detailHintLow },
    { value: "standard", label: labels.detailMedium, hint: labels.detailHintMedium },
    { value: "detailed", label: labels.detailHigh, hint: labels.detailHintHigh },
  ] as const;

  const statusMessage = form.formState.errors.root?.message ?? (form.formState.isDirty ? labels.unsavedChanges : labels.savedState);

  return (
    <Card className="surface-border overflow-hidden border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] shadow-[0_32px_120px_rgba(0,0,0,0.28)]">
      <CardHeader className="relative overflow-hidden pb-4">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(247,177,93,0.10),transparent_72%)]" />
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription className="max-w-[62ch] text-[15px] leading-7 text-[color:color-mix(in_srgb,var(--foreground-muted)_92%,white_4%)]">
          {labels.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {designsFieldArray.fields.map((field, index) => {
              const currentDesign = watchedDesigns?.[index];
              const isExpanded = expandedId === field.id;
              const cardTitle = currentDesign?.title?.trim() || `${labels.newItem} ${index + 1}`;
              const isCustomCategory = getCategorySelectValue(currentDesign?.category || "") === "__custom__";
              const detailLabel =
                currentDesign?.referenceDetailLevel === "simple"
                  ? labels.detailLow
                  : currentDesign?.referenceDetailLevel === "detailed"
                    ? labels.detailHigh
                    : labels.detailMedium;
              const formattedMin = formatPrice(toNullableNumber(currentDesign?.referencePriceMin));
              const formattedMax = formatPrice(toNullableNumber(currentDesign?.referencePriceMax));

              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null || dragIndex === index) {
                      setDragIndex(null);
                      return;
                    }

                    designsFieldArray.move(dragIndex, index);
                    setDragIndex(null);
                  }}
                  className="group rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.16)] transition sm:p-5"
                >
                  <div
                    className="flex cursor-pointer flex-wrap items-start justify-between gap-4"
                    onClick={() => setExpandedId((current) => (current === field.id ? null : field.id))}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/60 transition hover:border-white/16 hover:text-white/90"
                        aria-label={labels.dragHint}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-black/25">
                        {currentDesign?.imageUrl ? (
                          <img
                            src={currentDesign.imageUrl}
                            alt={currentDesign.title || cardTitle}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[var(--foreground-muted)]">
                            <ImagePlus className="size-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/35" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[1.02rem] font-semibold tracking-[-0.02em] text-white">
                          {cardTitle}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/8 bg-black/20 px-2.5 py-1 text-[11px] text-[var(--foreground-muted)]">
                            {getCategoryLabel(currentDesign?.category || "flash-designs")}
                          </span>
                          <span className="text-xs text-[var(--foreground-muted)]">
                            {currentDesign?.priceNote?.trim()
                              ? `${currentDesign.priceNote} cm`
                              : labels.priceNote}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start justify-end gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-3 py-2 text-xs font-medium",
                          currentDesign?.active
                            ? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent-soft)]"
                            : "border-white/8 bg-black/25 text-[var(--foreground-muted)]",
                        )}
                      >
                        {currentDesign?.active ? labels.liveOn : labels.liveOff}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[var(--foreground-muted)] hover:text-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemove(index);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <>
                      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
                        <div className="space-y-5">
                          <DesignSection title={labels.sectionImage} description={labels.sectionImageHelp}>
                            <Field label={labels.image} description={labels.imageDescription}>
                              <div className="space-y-4">
                                <div className="group/preview relative min-h-[280px] overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] sm:min-h-[360px]">
                                  {currentDesign?.imageUrl ? (
                                    <>
                                      <img
                                        src={currentDesign.imageUrl}
                                        alt={currentDesign.title || `${labels.item} ${index + 1}`}
                                        className="absolute inset-0 h-full w-full object-contain p-6 transition duration-300 group-hover/preview:scale-[1.02]"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/45" />
                                      <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2 opacity-100 sm:opacity-0 sm:transition sm:duration-200 sm:group-hover/preview:opacity-100">
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/14 bg-black/55 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-black/70">
                                          <Upload className="size-4" />
                                          {labels.replaceImage}
                                          <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/gif"
                                            className="hidden"
                                            onChange={(event) => {
                                              const file = event.target.files?.[0];
                                              if (file) {
                                                void handleImageUpload(index, file);
                                              }
                                              event.currentTarget.value = "";
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-[var(--foreground-muted)] sm:min-h-[360px]">
                                      <div className="rounded-full border border-white/10 bg-white/6 p-4">
                                        <ImagePlus className="size-7" />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium text-white/90">{labels.noImage}</p>
                                        <p className="text-xs text-[var(--foreground-muted)]">{labels.imageDescription}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <input type="hidden" {...form.register(`designs.${index}.imagePath`)} />
                                  <input type="hidden" {...form.register(`designs.${index}.imageUrl`)} />
                                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                                    <Upload className="size-4" />
                                    {currentDesign?.imageUrl ? labels.replaceImage : labels.uploadImage}
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp,image/gif"
                                      className="hidden"
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                          void handleImageUpload(index, file);
                                        }
                                        event.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                  {currentDesign?.imageUrl ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-sm text-[var(--foreground-muted)] hover:text-white"
                                      onClick={() => void handleImageRemove(index)}
                                    >
                                      <X className="size-4" />
                                      {labels.removeImage}
                                    </Button>
                                  ) : null}
                                </div>
                              </div>
                            </Field>
                          </DesignSection>

                          <DesignSection title={labels.sectionClientCopy} description={labels.sectionClientCopyHelp}>
                            <Field label={labels.shortDescription} description={labels.shortDescriptionHelp}>
                              <Textarea
                                className="min-h-[164px]"
                                placeholder={labels.shortDescriptionPlaceholder}
                                {...form.register(`designs.${index}.shortDescription`)}
                              />
                              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                                {labels.shortDescriptionHints}
                              </p>
                            </Field>
                          </DesignSection>
                        </div>

                        <div className="space-y-5">
                          <DesignSection title={labels.sectionGeneral} description={labels.sectionGeneralHelp}>
                            <div className="space-y-5">
                              <Field
                                label={labels.titleLabel}
                                description={labels.titleHelp}
                                error={form.formState.errors.designs?.[index]?.title?.message}
                              >
                                <Input
                                  className="h-12 rounded-[20px] bg-black/22"
                                  placeholder={labels.titlePlaceholder}
                                  {...form.register(`designs.${index}.title`)}
                                />
                              </Field>

                              <div className="grid gap-5">
                                <Field label={labels.category} description={labels.categoryHelp}>
                                  <NativeSelect
                                    className="h-12 rounded-[20px] bg-black/22"
                                    value={getCategorySelectValue(currentDesign?.category || "")}
                                    onChange={(event) =>
                                      form.setValue(
                                        `designs.${index}.category`,
                                        event.target.value === "__custom__" ? "" : event.target.value,
                                        { shouldDirty: true, shouldValidate: true },
                                      )
                                    }
                                  >
                                    <option value="flash-designs">{labels.flash}</option>
                                    <option value="discounted-designs">{labels.discounted}</option>
                                    <option value="__custom__">{labels.customOption}</option>
                                  </NativeSelect>
                                </Field>

                                {isCustomCategory ? (
                                  <Field label={labels.customCategory}>
                                    <Input
                                      className="h-12 rounded-[20px] bg-black/22"
                                      placeholder={labels.customCategoryPlaceholder}
                                      value={currentDesign?.category || ""}
                                      onChange={(event) =>
                                        form.setValue(`designs.${index}.category`, event.target.value, {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        })
                                      }
                                    />
                                  </Field>
                                ) : null}
                              </div>

                              <label className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-black/22 px-4 py-4">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">{labels.liveLabel}</p>
                                  <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">{labels.liveHelp}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={cn(
                                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                      currentDesign?.active
                                        ? "bg-[var(--accent)]/12 text-[var(--accent-soft)]"
                                        : "bg-white/8 text-[var(--foreground-muted)]",
                                    )}
                                  >
                                    {currentDesign?.active ? labels.liveOn : labels.liveOff}
                                  </span>
                                  <span className="relative inline-flex items-center">
                                    <input
                                      type="checkbox"
                                      className="peer sr-only"
                                      {...form.register(`designs.${index}.active`)}
                                    />
                                    <span className="h-7 w-12 rounded-full bg-white/10 transition peer-checked:bg-[var(--accent)]/35" />
                                    <span className="pointer-events-none absolute left-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-[var(--accent)]" />
                                  </span>
                                </div>
                              </label>
                            </div>
                          </DesignSection>

                          <DesignSection title={labels.sectionPricing} description={labels.sectionPricingHelp}>
                            <div className="space-y-5">
                              <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                  label={labels.priceNote}
                                  description={labels.priceNoteHelp}
                                  error={form.formState.errors.designs?.[index]?.priceNote?.message}
                                >
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder={labels.sizePlaceholder}
                                      className="h-12 rounded-[20px] bg-black/22 pr-12"
                                      {...form.register(`designs.${index}.priceNote`)}
                                    />
                                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground-muted)]">
                                      cm
                                    </span>
                                  </div>
                                </Field>

                                <Field label={labels.detailLevel} description={labels.detailLevelHelp}>
                                  <div className="grid gap-2">
                                    {detailOptions.map((option) => {
                                      const active = currentDesign?.referenceDetailLevel === option.value;
                                      return (
                                        <button
                                          key={option.value}
                                          type="button"
                                          onClick={() =>
                                            form.setValue(`designs.${index}.referenceDetailLevel`, option.value, {
                                              shouldDirty: true,
                                              shouldValidate: true,
                                            })
                                          }
                                          className={cn(
                                            "rounded-[20px] border px-4 py-3 text-left transition",
                                            active
                                              ? "border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(247,177,93,0.08),0_18px_40px_rgba(0,0,0,0.16)]"
                                              : "border-white/8 bg-black/22 hover:border-white/14 hover:bg-white/5",
                                          )}
                                        >
                                          <p className="text-sm font-medium text-white">{option.label}</p>
                                          <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">{option.hint}</p>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </Field>
                              </div>

                              <Field label={labels.priceRange} description={labels.priceRangeHelp}>
                                <div className="rounded-[22px] border border-white/8 bg-black/25 px-4 py-4 text-sm text-white">
                                  {labels.summaryPrefix}:{" "}
                                  {currentDesign?.priceNote?.trim() || "—"} cm · {detailLabel} ·{" "}
                                  {formattedMin ? `${labels.currencyPrefix}${formattedMin}` : "—"}
                                  {" – "}
                                  {formattedMax ? `${labels.currencyPrefix}${formattedMax}` : "—"}
                                </div>

                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end">
                                  <Field
                                    label={labels.priceMin}
                                    className="gap-2"
                                    error={form.formState.errors.designs?.[index]?.referencePriceMin?.message}
                                  >
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        placeholder="2500"
                                        className="h-12 rounded-[20px] bg-black/22 pl-10"
                                        {...form.register(`designs.${index}.referencePriceMin`)}
                                      />
                                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground-muted)]">
                                        {labels.currencyPrefix}
                                      </span>
                                    </div>
                                  </Field>
                                  <div className="hidden h-12 items-center justify-center text-sm text-[var(--foreground-muted)] md:flex">
                                    —
                                  </div>
                                  <Field
                                    label={labels.priceMax}
                                    className="gap-2"
                                    error={form.formState.errors.designs?.[index]?.referencePriceMax?.message}
                                  >
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        placeholder="3800"
                                        className="h-12 rounded-[20px] bg-black/22 pl-10"
                                        {...form.register(`designs.${index}.referencePriceMax`)}
                                      />
                                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground-muted)]">
                                        {labels.currencyPrefix}
                                      </span>
                                    </div>
                                  </Field>
                                </div>
                                <p className="text-sm text-[var(--foreground-muted)]">{labels.priceRangeNote}</p>
                              </Field>
                            </div>
                          </DesignSection>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-4 z-20 pt-2">
            <div className="rounded-[24px] border border-white/10 bg-[color:color-mix(in_srgb,var(--background)_72%,black)]/90 px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{statusMessage}</p>
                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                    {designsFieldArray.fields.length} {labels.item.toLowerCase()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      designsFieldArray.append({
                        category: "flash-designs",
                        title: "",
                        shortDescription: "",
                  imageUrl: "",
                  imagePath: "",
                  priceNote: "",
                  referenceDetailLevel: "standard",
                  referencePriceMin: null,
                  referencePriceMax: null,
                  active: true,
                        sortOrder: designsFieldArray.fields.length,
                      });
                      setExpandLatestCard(true);
                    }}
                  >
                    <Plus className="size-4" />
                    {labels.addDesign}
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        {labels.saving}
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        {labels.save}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
