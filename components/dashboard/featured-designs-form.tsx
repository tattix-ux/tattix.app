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
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { ArtistFeaturedDesign } from "@/lib/types";

type FeaturedDesignFormInput = z.input<typeof featuredDesignsSchema>;
type FeaturedDesignValues = z.output<typeof featuredDesignsSchema>;

export function FeaturedDesignsForm({
  designs,
  artistId,
  demoMode,
}: {
  designs: ArtistFeaturedDesign[];
  artistId: string;
  demoMode: boolean;
}) {
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
      form.setError("root", { message: "Image upload is unavailable in demo mode." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: "Only image files are allowed." });
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      form.setError("root", { message: "Image files must be 6 MB or smaller." });
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
      form.setError("root", { message: "Image uploaded. Save featured designs to persist." });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to upload image.",
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
    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? "Unable to save designs." });
      return;
    }

    form.setError("root", { message: payload.message ?? "Featured designs saved." });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>Featured designs</CardTitle>
        <CardDescription>
          Upload flash and discounted concepts that appear only when the client chooses a matching intent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {designsFieldArray.fields.map((field, index) => {
              const currentDesign = watchedDesigns?.[index];

              return (
                <div
                  key={field.id}
                  className="rounded-[28px] border border-white/8 bg-black/20 p-5"
                >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    Design {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => designsFieldArray.remove(index)}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Category">
                    <NativeSelect {...form.register(`designs.${index}.category`)}>
                      {featuredDesignCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field label="Title">
                    <Input {...form.register(`designs.${index}.title`)} />
                  </Field>
                </div>
                <Field className="mt-5" label="Short description">
                  <Textarea {...form.register(`designs.${index}.shortDescription`)} />
                </Field>
                <div className="mt-5 grid gap-5 md:grid-cols-[1.2fr_1fr]">
                  <Field
                    label="Design image"
                    description="Upload an image or keep using a pasted URL for backwards compatibility."
                  >
                    <div className="space-y-3">
                      <div
                        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-white/5"
                      >
                        {currentDesign?.imageUrl ? (
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${currentDesign.imageUrl})` }}
                            aria-label={currentDesign.title || `Design ${index + 1}`}
                            role="img"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--foreground-muted)]">
                            <ImagePlus className="size-5" />
                            <span>No image selected yet</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <input type="hidden" {...form.register(`designs.${index}.imagePath`)} />
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                          <Upload className="size-4" />
                          Upload image
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
                          <Button type="button" variant="ghost" size="sm" onClick={() => void handleImageRemove(index)}>
                            <X className="size-4" />
                            Remove image
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </Field>
                  <div className="space-y-5">
                    <Field label="Image URL fallback">
                      <Input placeholder="https://..." {...form.register(`designs.${index}.imageUrl`)} />
                    </Field>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--accent)]"
                        {...form.register(`designs.${index}.active`)}
                      />
                      <span className="text-sm text-white">Show this design publicly</span>
                    </label>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  <Field label="Optional price note">
                    <Input placeholder="From 2800 TRY" {...form.register(`designs.${index}.priceNote`)} />
                  </Field>
                  <Field label="Reference price min">
                    <Input type="number" {...form.register(`designs.${index}.referencePriceMin`)} />
                  </Field>
                  <Field label="Reference price max">
                    <Input type="number" {...form.register(`designs.${index}.referencePriceMax`)} />
                  </Field>
                </div>
                <Field className="mt-5" label="Sort order">
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
              Add design
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save featured designs
                </>
              )}
            </Button>
          </div>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {form.formState.errors.root.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
