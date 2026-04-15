"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { GripVertical, ImagePlus, LoaderCircle, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";
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
    title: "Designs",
    description: "Manage your designs.",
    item: "Design",
    remove: "Remove",
    category: "Category",
    customCategory: "Custom category",
    customCategoryPlaceholder: "e.g. Floral",
    titleLabel: "Title",
    shortDescription: "Short description",
    image: "Design image",
    imageDescription: "Upload an image for this design.",
    noImage: "No image selected yet",
    uploadImage: "Upload image",
    removeImage: "Remove image",
    showPublicly: "Show this design publicly",
    priceNote: "Reference size",
    priceMin: "Min price",
    priceMax: "Max price",
    addDesign: "Add design",
    saving: "Saving",
    save: "Save designs",
    pricePlaceholder: "From 2800 TRY",
    flash: "Flash designs",
    discounted: "Discounted designs",
    customOption: "Custom category",
    dragHint: "Drag to reorder",
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
    description: "Tasarımlarını yönet.",
    item: "Tasarım",
    remove: "Kaldır",
    category: "Kategori",
    customCategory: "Özel kategori",
    customCategoryPlaceholder: "Örn. Floral",
    titleLabel: "Başlık",
    shortDescription: "Kısa açıklama",
    image: "Tasarım görseli",
    imageDescription: "Bu tasarım için görsel yükle.",
    noImage: "Henüz görsel seçilmedi",
    uploadImage: "Görsel yükle",
    removeImage: "Görseli kaldır",
    showPublicly: "Bu tasarımı herkese açık sayfada göster",
    priceNote: "Referans boyut",
    priceMin: "Min fiyat",
    priceMax: "Maks fiyat",
    addDesign: "Tasarım ekle",
    saving: "Kaydediliyor",
    save: "Tasarımları kaydet",
    pricePlaceholder: "2800 TRY'den başlayan fiyatlarla",
    flash: "Flash tasarımlar",
    discounted: "İndirimli tasarımlar",
    customOption: "Özel kategori",
    dragHint: "Sıralamak için sürükle",
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
                    className="flex cursor-pointer flex-wrap items-center justify-between gap-3"
                    onClick={() =>
                      setExpandedId((current) => (current === field.id ? null : field.id))
                    }
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70"
                        aria-label={labels.dragHint}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                          {labels.item} {index + 1}
                        </p>
                        <p className="mt-1 text-base font-medium text-white">
                          {currentDesign?.title || labels.titleLabel}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {getCategoryLabel(currentDesign?.category || "flash-designs")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-3 py-2">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          {...form.register(`designs.${index}.active`)}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <span className="text-sm text-white">{labels.showPublicly}</span>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          designsFieldArray.remove(index);
                        }}
                      >
                        <Trash2 className="size-4" />
                        {labels.remove}
                      </Button>
                    </div>
                  </div>

                  {expandedId === field.id ? (
                    <>
                      <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
                        <Field label={labels.titleLabel}>
                          <Input {...form.register(`designs.${index}.title`)} />
                        </Field>
                      </div>

                      {getCategorySelectValue(currentDesign?.category || "") === "__custom__" ? (
                        <Field className="mt-5" label={labels.customCategory}>
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

                      <Field className="mt-5" label={labels.shortDescription}>
                        <Textarea {...form.register(`designs.${index}.shortDescription`)} />
                      </Field>

                      <div className="mt-5 space-y-5">
                        <Field label={labels.image} description={labels.imageDescription}>
                          <div className="space-y-3">
                            <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/5 sm:h-36 sm:rounded-[20px]">
                              {currentDesign?.imageUrl ? (
                                <div
                                  className="absolute inset-0 bg-cover bg-center"
                                  style={{ backgroundImage: `url(${currentDesign.imageUrl})` }}
                                  aria-label={currentDesign.title || `${labels.item} ${index + 1}`}
                                  role="img"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--foreground-muted)]">
                                  <ImagePlus className="size-5" />
                                  <span>{labels.noImage}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <input type="hidden" {...form.register(`designs.${index}.imagePath`)} />
                              <input type="hidden" {...form.register(`designs.${index}.imageUrl`)} />
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-white transition hover:bg-white/10 sm:px-4 sm:text-sm">
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
                                  className="text-xs sm:text-sm"
                                  onClick={() => void handleImageRemove(index)}
                                >
                                  <X className="size-4" />
                                  {labels.removeImage}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </Field>
                      </div>

                      <div className="mt-5 grid gap-5 lg:grid-cols-3">
                        <Field label={labels.priceNote}>
                          <Input
                            placeholder="12 cm"
                            {...form.register(`designs.${index}.priceNote`)}
                          />
                        </Field>
                        <Field label={labels.priceMin}>
                          <Input type="number" {...form.register(`designs.${index}.referencePriceMin`)} />
                        </Field>
                        <Field label={labels.priceMax}>
                          <Input type="number" {...form.register(`designs.${index}.referencePriceMax`)} />
                        </Field>
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
                designsFieldArray.append({
                  category: "flash-designs",
                  title: "",
                  shortDescription: "",
                  imageUrl: "",
                  imagePath: "",
                  priceNote: "",
                  referencePriceMin: null,
                  referencePriceMax: null,
                  active: true,
                  sortOrder: designsFieldArray.fields.length,
                })
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
