"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ImagePlus, LoaderCircle, Plus, Save, Trash2, Upload, X } from "lucide-react";
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
    description:
      "Manage flash and discounted designs. These cards appear only when the client selects a matching intent.",
    item: "Design",
    remove: "Remove",
    category: "Category",
    titleLabel: "Title",
    shortDescription: "Short description",
    image: "Design image",
    imageDescription: "Upload an image or keep using a URL for backwards compatibility.",
    noImage: "No image selected yet",
    uploadImage: "Upload image",
    removeImage: "Remove image",
    imageUrlFallback: "Image URL fallback",
    showPublicly: "Show this design publicly",
    priceNote: "Optional price note",
    priceMin: "Reference price min",
    priceMax: "Reference price max",
    sortOrder: "Sort order",
    addDesign: "Add design",
    saving: "Saving",
    save: "Save designs",
    pricePlaceholder: "From 2800 TRY",
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
    description:
      "Flash ve indirimli tasarımları yönet. Bu kartlar yalnızca müşteri eşleşen intent’i seçtiğinde görünür.",
    item: "Tasarım",
    remove: "Kaldır",
    category: "Kategori",
    titleLabel: "Başlık",
    shortDescription: "Kısa açıklama",
    image: "Tasarım görseli",
    imageDescription: "Görsel yükleyebilir veya geriye dönük uyumluluk için URL kullanabilirsin.",
    noImage: "Henüz görsel seçilmedi",
    uploadImage: "Görsel yükle",
    removeImage: "Görseli kaldır",
    imageUrlFallback: "Yedek görsel URL'si",
    showPublicly: "Bu tasarımı herkese açık sayfada göster",
    priceNote: "Opsiyonel fiyat notu",
    priceMin: "Referans min fiyat",
    priceMax: "Referans maks fiyat",
    sortOrder: "Sıralama",
    addDesign: "Tasarım ekle",
    saving: "Kaydediliyor",
    save: "Tasarımları kaydet",
    pricePlaceholder: "2800 TRY'den başlayan fiyatlarla",
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
  const labels = copy[locale];
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
                <div key={field.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:rounded-[28px] sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                      {labels.item} {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => designsFieldArray.remove(index)}
                    >
                      <Trash2 className="size-4" />
                      {labels.remove}
                    </Button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label={labels.category}>
                      <NativeSelect {...form.register(`designs.${index}.category`)}>
                        {featuredDesignCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {locale === "tr"
                              ? category.value === "discounted-designs"
                                ? "İndirimli tasarımlar"
                                : "Flash tasarımlar"
                              : category.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label={labels.titleLabel}>
                      <Input {...form.register(`designs.${index}.title`)} />
                    </Field>
                  </div>

                  <Field className="mt-5" label={labels.shortDescription}>
                    <Textarea {...form.register(`designs.${index}.shortDescription`)} />
                  </Field>

                  <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_1fr]">
                    <Field label={labels.image} description={labels.imageDescription}>
                      <div className="space-y-3">
                        <div className="relative flex aspect-[5/4] min-h-[180px] items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/5 sm:aspect-[4/3] sm:min-h-[220px]">
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

                    <div className="space-y-5">
                      <Field label={labels.imageUrlFallback}>
                        <Input placeholder="https://..." {...form.register(`designs.${index}.imageUrl`)} />
                      </Field>
                      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--accent)]"
                          {...form.register(`designs.${index}.active`)}
                        />
                        <span className="text-sm text-white">{labels.showPublicly}</span>
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-3">
                    <Field label={labels.priceNote}>
                      <Input
                        placeholder={labels.pricePlaceholder}
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

                  <Field className="mt-5" label={labels.sortOrder}>
                    <Input type="number" {...form.register(`designs.${index}.sortOrder`)} />
                  </Field>
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
