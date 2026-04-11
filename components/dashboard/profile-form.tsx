"use client";

import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ImagePlus, LoaderCircle, Save, Upload, X } from "lucide-react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { currencyOptions } from "@/lib/constants/options";
import { profileSchema } from "@/lib/forms/schemas";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistProfile } from "@/lib/types";

type ProfileValues = z.infer<typeof profileSchema>;

const profileCopy = {
  en: {
    title: "Artist profile",
    description: "Control the public-facing details that show up on your bio page and result messages.",
    artistName: "Artist name",
    slug: "Public slug",
    slugHelp: "Your page will live at /artist-slug.",
    profileImage: "Profile image",
    profileImageHelp: "Upload directly or keep using a URL.",
    coverImage: "Cover image",
    coverImageHelp: "Shown in the public page hero.",
    noImage: "No image selected yet",
    upload: "Upload image",
    remove: "Remove image",
    imageUrlFallback: "Image URL fallback",
    shortBio: "Short bio",
    shortBioHelp: "Optional. If empty, the public page falls back to your funnel intro copy.",
    shortBioPlaceholder: "Optional short studio intro",
    welcomeHeadline: "Welcome headline",
    welcomeHeadlineHelp: "Optional. Leave empty if you want funnel copy or theme overrides to lead.",
    welcomeHeadlinePlaceholder: "Optional headline",
    whatsapp: "WhatsApp number",
    instagram: "Instagram handle",
    currency: "Currency",
    active: "Artist page is active",
    saving: "Saving",
    save: "Save profile",
    demoSaved: "Demo data refreshed.",
    saved: "Profile saved.",
    uploadUnavailable: "Image upload is unavailable in demo mode.",
    uploadType: "Only image files are allowed.",
    uploadSize: "Images must be 6 MB or smaller.",
    uploadQueued: "Image uploaded. Save profile to persist it.",
    uploadFailed: "Unable to upload image.",
    saveFailed: "Unable to save profile.",
  },
  tr: {
    title: "Sanatçı profili",
    description: "Sanatçı sayfanda ve sonuç mesajlarında görünen bilgileri buradan yönet.",
    artistName: "Sanatçı adı",
    slug: "Sayfa bağlantısı",
    slugHelp: "Sayfan `site-adresin.com/artist-slug` biçiminde yayınlanır.",
    profileImage: "Profil görseli",
    profileImageHelp: "Doğrudan yükleyebilir veya bağlantı kullanabilirsin.",
    coverImage: "Kapak görseli",
    coverImageHelp: "Sanatçı sayfanın üst bölümünde görünür.",
    noImage: "Henüz görsel seçilmedi",
    upload: "Görsel yükle",
    remove: "Görseli kaldır",
    imageUrlFallback: "Görsel bağlantısı",
    shortBio: "Kısa biyografi",
    shortBioHelp: "İsteğe bağlı. Boş bırakırsan sanatçı sayfası giriş metnini kullanır.",
    shortBioPlaceholder: "İsteğe bağlı kısa stüdyo tanıtımı",
    welcomeHeadline: "Karşılama başlığı",
    welcomeHeadlineHelp: "İsteğe bağlı. Boş bırakırsan akış metni veya tema ayarı öne çıkar.",
    welcomeHeadlinePlaceholder: "İsteğe bağlı başlık",
    whatsapp: "WhatsApp numarası",
    instagram: "Instagram kullanıcı adı",
    currency: "Para birimi",
    active: "Sanatçı sayfası aktif",
    saving: "Kaydediliyor",
    save: "Profili kaydet",
    demoSaved: "Demo verisi güncellendi.",
    saved: "Profil kaydedildi.",
    uploadUnavailable: "Demo modunda görsel yükleme kullanılamıyor.",
    uploadType: "Sadece görsel dosyaları yüklenebilir.",
    uploadSize: "Görseller en fazla 6 MB olabilir.",
    uploadQueued: "Görsel yüklendi. Kalıcı olması için profili kaydet.",
    uploadFailed: "Görsel yüklenemedi.",
    saveFailed: "Profil kaydedilemedi.",
  },
} as const;

function MediaUploadField({
  label,
  description,
  imageUrl,
  onUpload,
  onRemove,
  urlInput,
  emptyLabel,
  uploadLabel,
  removeLabel,
}: {
  label: string;
  description: string;
  imageUrl: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  urlInput: ReactNode;
  emptyLabel: string;
  uploadLabel: string;
  removeLabel: string;
}) {
  return (
    <Field label={label} description={description}>
      <div className="space-y-3">
        <div className="relative flex aspect-[5/4] min-h-[180px] items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-white/5 sm:aspect-[4/3] sm:min-h-[220px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--foreground-muted)]">
              <ImagePlus className="size-5" />
              <span>{emptyLabel}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-white transition hover:bg-white/10 sm:px-4 sm:text-sm">
            <Upload className="size-4" />
            {uploadLabel}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onUpload(file);
                }
                event.currentTarget.value = "";
              }}
            />
          </label>
          {imageUrl ? (
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-xs sm:text-sm">
              <X className="size-4" />
              {removeLabel}
            </Button>
          ) : null}
        </div>
        {urlInput}
      </div>
    </Field>
  );
}

export function ProfileForm({
  profile,
  demoMode,
  locale,
}: {
  profile: ArtistProfile;
  demoMode: boolean;
  locale: PublicLocale;
}) {
  const copy = profileCopy[locale];
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      artistName: profile.artistName,
      slug: profile.slug,
      profileImageUrl: profile.profileImageUrl ?? "",
      coverImageUrl: profile.coverImageUrl ?? "",
      shortBio: profile.shortBio,
      welcomeHeadline: profile.welcomeHeadline,
      whatsappNumber: profile.whatsappNumber,
      instagramHandle: profile.instagramHandle,
      currency: profile.currency,
      active: profile.active,
    },
  });
  const profileImageUrl = useWatch({ control: form.control, name: "profileImageUrl" }) ?? "";
  const coverImageUrl = useWatch({ control: form.control, name: "coverImageUrl" }) ?? "";

  async function onSubmit(values: ProfileValues) {
    const response = await fetch("/api/dashboard/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json()) as { message?: string };

    if (!response.ok) {
      form.setError("root", { message: payload.message ?? copy.saveFailed });
      return;
    }

    form.setError("root", {
      message: payload.message ?? (demoMode ? copy.demoSaved : copy.saved),
    });
  }

  async function handleMediaUpload(field: "profileImageUrl" | "coverImageUrl", file: File) {
    if (demoMode) {
      form.setError("root", { message: copy.uploadUnavailable });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: copy.uploadType });
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      form.setError("root", { message: copy.uploadSize });
      return;
    }

    try {
      const previousUrl = form.getValues(field);
      const uploaded = await uploadArtistAsset(file, {
        artistId: profile.id,
        bucket: "artist-assets",
        prefix: field === "profileImageUrl" ? "profile-image" : "cover-image",
      });
      if (previousUrl?.includes("/storage/v1/object/public/artist-assets/")) {
        const previousPath = previousUrl.split("/artist-assets/")[1];
        if (previousPath) {
          await removeArtistAsset(previousPath, { bucket: "artist-assets" }).catch(() => undefined);
        }
      }
      form.setValue(field, uploaded.publicUrl, { shouldDirty: true, shouldValidate: true });
      form.setError("root", { message: copy.uploadQueued });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : copy.uploadFailed,
      });
    }
  }

  async function handleMediaRemove(field: "profileImageUrl" | "coverImageUrl") {
    const currentUrl = form.getValues(field);
    if (!demoMode && currentUrl?.includes("/storage/v1/object/public/artist-assets/")) {
      const currentPath = currentUrl.split("/artist-assets/")[1];
      if (currentPath) {
        await removeArtistAsset(currentPath, { bucket: "artist-assets" }).catch(() => undefined);
      }
    }
    form.setValue(field, "", { shouldDirty: true, shouldValidate: true });
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label={copy.artistName} error={form.formState.errors.artistName?.message}>
              <Input {...form.register("artistName")} />
            </Field>
            <Field
              label={copy.slug}
              description={copy.slugHelp}
              error={form.formState.errors.slug?.message}
            >
              <Input {...form.register("slug")} />
            </Field>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <MediaUploadField
              label={copy.profileImage}
              description={copy.profileImageHelp}
              imageUrl={profileImageUrl}
              onUpload={(file) => void handleMediaUpload("profileImageUrl", file)}
              onRemove={() => void handleMediaRemove("profileImageUrl")}
              emptyLabel={copy.noImage}
              uploadLabel={copy.upload}
              removeLabel={copy.remove}
              urlInput={
                <Input
                  placeholder="https://..."
                  {...form.register("profileImageUrl")}
                />
              }
            />
            <MediaUploadField
              label={copy.coverImage}
              description={copy.coverImageHelp}
              imageUrl={coverImageUrl}
              onUpload={(file) => void handleMediaUpload("coverImageUrl", file)}
              onRemove={() => void handleMediaRemove("coverImageUrl")}
              emptyLabel={copy.noImage}
              uploadLabel={copy.upload}
              removeLabel={copy.remove}
              urlInput={
                <Input
                  placeholder="https://..."
                  {...form.register("coverImageUrl")}
                />
              }
            />
          </div>
          <Field
            label={copy.shortBio}
            description={copy.shortBioHelp}
            error={form.formState.errors.shortBio?.message}
          >
            <Textarea {...form.register("shortBio")} placeholder={copy.shortBioPlaceholder} />
          </Field>
          <Field
            label={copy.welcomeHeadline}
            description={copy.welcomeHeadlineHelp}
            error={form.formState.errors.welcomeHeadline?.message}
          >
            <Input {...form.register("welcomeHeadline")} placeholder={copy.welcomeHeadlinePlaceholder} />
          </Field>
          <div className="grid gap-5 lg:grid-cols-3">
            <Field
              label={copy.whatsapp}
              error={form.formState.errors.whatsappNumber?.message}
            >
              <Input {...form.register("whatsappNumber")} />
            </Field>
            <Field
              label={copy.instagram}
              error={form.formState.errors.instagramHandle?.message}
            >
              <Input {...form.register("instagramHandle")} />
            </Field>
            <Field label={copy.currency} error={form.formState.errors.currency?.message}>
              <NativeSelect {...form.register("currency")}>
                {currencyOptions.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" {...form.register("active")} />
            <span className="text-sm text-white">{copy.active}</span>
          </label>
          {form.formState.errors.root?.message ? (
            <p className="text-sm text-[var(--accent-soft)]">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                {copy.saving}
              </>
            ) : (
              <>
                <Save className="size-4" />
                {copy.save}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
