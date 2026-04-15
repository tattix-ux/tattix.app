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

type FeaturedDesignFormInput = z.input<typeof featuredDesignsSchema>;
type FeaturedDesignValues = z.output<typeof featuredDesignsSchema>;

const copy = {
  en: {
    uploadUnavailable: "Image upload is unavailable in demo mode.",
    invalidType: "Only image files are allowed.",
    invalidSize: "Image files must be 6 MB or smaller.",
    uploaded: "Image uploaded. Save designs to persist.",
    uploadFailed: "Unable to upload image.",
    saveFailed: "Unable to save designs.",
    saved: "Designs saved.",
    title: "Manage the designs clients will see.",
    description: "Designs added here appear in the client selection flow.",
    item: "Design",
    newItem: "New design",
    remove: "Remove",
    removeConfirm: "Remove this design?",
    category: "Category",
    customCategory: "Custom category",
    customCategoryPlaceholder: "e.g. Floral",
    titleLabel: "Title",
    titlePlaceholder: "e.g. Koi fish",
    shortDescription: "Short description",
    shortDescriptionPlaceholder: "e.g. Fine line piece that works well in a smaller size.",
    shortDescriptionHelp: "Optional",
    image: "Design image",
    imageDescription: "Clients see this image in the selection screen.",
    noImage: "No image selected yet",
    uploadImage: "Upload image",
    removeImage: "Remove image",
    liveLabel: "Live",
    liveHelp: "If off, clients do not see this design.",
    liveOn: "Live",
    liveOff: "Hidden",
    priceNote: "Example size (cm)",
    priceNoteHelp: "How large is this design usually tattooed?",
    detailLevel: "Detail level",
    detailLevelHelp: "Detail level affects price.",
    priceRange: "Price range for this design",
    priceRangeHelp: "Clients see this range for this size.",
    priceMin: "Min price",
    priceMax: "Max price",
    addDesign: "Add new design",
    saving: "Saving",
    save: "Save changes",
    flash: "Flash designs",
    discounted: "Discounted designs",
    customOption: "Custom category",
    dragHint: "Drag to reorder",
    preview: "Client preview",
    previewEmptyTitle: "Title will appear here",
    currencyPrefix: "TRY",
  },
  tr: {
    uploadUnavailable: "Demo modunda görsel yükleme kullanılamıyor.",
    invalidType: "Yalnızca görsel dosyaları yükleyebilirsin.",
    invalidSize: "Görseller en fazla 6 MB olabilir.",
    uploaded: "Görsel yüklendi. Kaydettiğinde kalıcı olur.",
    uploadFailed: "Görsel yüklenemedi.",
    saveFailed: "Tasarımlar kaydedilemedi.",
    saved: "Tasarımlar kaydedildi.",
    title: "Müşteriye göstereceğin tasarımları yönet.",
    description: "Buraya eklediğin tasarımlar, müşteri seçim ekranında gösterilir ve doğrudan talep oluşturmaya yardımcı olur.",
    item: "Tasarım",
    newItem: "Yeni tasarım",
    remove: "Kaldır",
    removeConfirm: "Bu tasarımı kaldırmak istiyor musun?",
    category: "Kategori",
    customCategory: "Özel kategori",
    customCategoryPlaceholder: "Örn. Floral",
    titleLabel: "Başlık",
    titlePlaceholder: "Örn. Koi balığı",
    shortDescription: "Kısa açıklama",
    shortDescriptionPlaceholder: "Örn. İnce çizgi, küçük boyutta iyi görünür.",
    shortDescriptionHelp: "İsteğe bağlı",
    image: "Tasarım görseli",
    imageDescription: "Müşteri bu görseli seçim ekranında görür.",
    noImage: "Henüz görsel seçilmedi",
    uploadImage: "Görsel yükle",
    removeImage: "Görseli kaldır",
    liveLabel: "Yayında",
    liveHelp: "Kapalıysa müşteri bu tasarımı görmez.",
    liveOn: "Yayında",
    liveOff: "Yayında değil",
    priceNote: "Örnek boyut (cm)",
    priceNoteHelp: "Bu tasarım genelde kaç cm yapılır?",
    detailLevel: "Detay seviyesi",
    detailLevelHelp: "Detay seviyesi fiyatı etkiler.",
    priceRange: "Bu tasarım için fiyat aralığı",
    priceRangeHelp: "Müşteriye bu boyut için bu aralık gösterilir.",
    priceMin: "Min fiyat",
    priceMax: "Maks fiyat",
    addDesign: "Yeni tasarım ekle",
    saving: "Kaydediliyor",
    save: "Değişiklikleri kaydet",
    flash: "Flash tasarımlar",
    discounted: "İndirimli tasarımlar",
    customOption: "Özel kategori",
    dragHint: "Sıralamak için sürükle",
    preview: "Müşteri önizlemesi",
    previewEmptyTitle: "Başlık burada görünür",
    currencyPrefix: "₺",
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

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {designsFieldArray.fields.map((field, index) => {
              const currentDesign = watchedDesigns?.[index];
              const isExpanded = expandedId === field.id;
              const cardTitle = currentDesign?.title?.trim() || `${labels.newItem} ${index + 1}`;
              const isCustomCategory = getCategorySelectValue(currentDesign?.category || "") === "__custom__";

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
                  className="rounded-[22px] border border-white/8 bg-black/20 p-3.5 sm:rounded-[24px] sm:p-4"
                >
                  <div
                    className="flex cursor-pointer flex-wrap items-start justify-between gap-3"
                    onClick={() => setExpandedId((current) => (current === field.id ? null : field.id))}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70"
                        aria-label={labels.dragHint}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                          {labels.item} {index + 1}
                        </p>
                        <p className="mt-1 truncate text-base font-medium text-white">
                          {cardTitle}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {getCategoryLabel(currentDesign?.category || "flash-designs")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start justify-end gap-2">
                      <label
                        className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-black/25 px-3 py-2.5"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{labels.liveLabel}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{labels.liveHelp}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--foreground-muted)]">
                            {currentDesign?.active ? labels.liveOn : labels.liveOff}
                          </span>
                          <input
                            type="checkbox"
                            className="size-4 accent-[var(--accent)]"
                            {...form.register(`designs.${index}.active`)}
                          />
                        </div>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
                        <div className="space-y-5">
                          <Field label={labels.image} description={labels.imageDescription}>
                            <div className="space-y-3">
                              <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/5 sm:min-h-[280px]">
                                {currentDesign?.imageUrl ? (
                                  <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${currentDesign.imageUrl})` }}
                                    aria-label={currentDesign.title || `${labels.item} ${index + 1}`}
                                    role="img"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-[var(--foreground-muted)]">
                                    <ImagePlus className="size-6" />
                                    <span>{labels.noImage}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <input type="hidden" {...form.register(`designs.${index}.imagePath`)} />
                                <input type="hidden" {...form.register(`designs.${index}.imageUrl`)} />
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                                  <Upload className="size-4" />
                                  {labels.uploadImage}
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
                                    className="text-sm"
                                    onClick={() => void handleImageRemove(index)}
                                  >
                                    <X className="size-4" />
                                    {labels.removeImage}
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </Field>

                          <div className="grid gap-5 md:grid-cols-2">
                            <Field label={labels.priceNote} description={labels.priceNoteHelp}>
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="12"
                                  className="pr-12"
                                  {...form.register(`designs.${index}.priceNote`)}
                                />
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground-muted)]">
                                  cm
                                </span>
                              </div>
                            </Field>

                            <Field label={labels.detailLevel} description={labels.detailLevelHelp}>
                              <NativeSelect {...form.register(`designs.${index}.referenceDetailLevel`)}>
                                <option value="simple">{locale === "tr" ? "Az detay" : "Low detail"}</option>
                                <option value="standard">{locale === "tr" ? "Orta detay" : "Medium detail"}</option>
                                <option value="detailed">{locale === "tr" ? "Çok detay" : "High detail"}</option>
                              </NativeSelect>
                            </Field>
                          </div>

                          <div className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                            <Field label={labels.priceRange} description={labels.priceRangeHelp}>
                              <div className="grid gap-4 md:grid-cols-2">
                                <Field label={labels.priceMin} className="gap-2">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder="2500"
                                      className="pl-10"
                                      {...form.register(`designs.${index}.referencePriceMin`)}
                                    />
                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground-muted)]">
                                      {labels.currencyPrefix}
                                    </span>
                                  </div>
                                </Field>
                                <Field label={labels.priceMax} className="gap-2">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder="3800"
                                      className="pl-10"
                                      {...form.register(`designs.${index}.referencePriceMax`)}
                                    />
                                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground-muted)]">
                                      {labels.currencyPrefix}
                                    </span>
                                  </div>
                                </Field>
                              </div>
                            </Field>
                          </div>

                          <div className="grid gap-5">
                            <Field label={labels.titleLabel}>
                              <Input
                                placeholder={labels.titlePlaceholder}
                                {...form.register(`designs.${index}.title`)}
                              />
                            </Field>

                            <Field label={labels.shortDescription} description={labels.shortDescriptionHelp}>
                              <Textarea
                                placeholder={labels.shortDescriptionPlaceholder}
                                {...form.register(`designs.${index}.shortDescription`)}
                              />
                            </Field>

                            <Field label={labels.category}>
                              <NativeSelect
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
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-[22px] border border-white/8 bg-black/20 p-4 xl:sticky xl:top-24">
                            <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                              {labels.preview}
                            </p>
                            <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10 bg-white/5">
                              <div className="relative flex aspect-[4/5] items-end overflow-hidden bg-black/10 p-4">
                                {currentDesign?.imageUrl ? (
                                  <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${currentDesign.imageUrl})` }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--foreground-muted)]">
                                    <ImagePlus className="size-5" />
                                    <span>{labels.noImage}</span>
                                  </div>
                                )}
                                {currentDesign?.imageUrl ? (
                                  <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/55" />
                                ) : null}
                                <span className="relative z-10 inline-flex rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white">
                                  {getCategoryLabel(currentDesign?.category || "flash-designs")}
                                </span>
                              </div>
                              <div className="space-y-2 p-4">
                                <p className="min-w-0 truncate text-base font-medium text-white">
                                  {currentDesign?.title?.trim() || labels.previewEmptyTitle}
                                </p>
                                <p className="text-sm text-[var(--foreground-muted)]">
                                  {currentDesign?.shortDescription?.trim() || " "}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                {
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
                }
              }
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

          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">{form.formState.errors.root.message}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
