"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { ImagePlus, LoaderCircle, Save, Upload, X } from "lucide-react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { currencyOptions } from "@/lib/constants/options";
import { profileSchema } from "@/lib/forms/schemas";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistProfile } from "@/lib/types";

type ProfileValues = z.infer<typeof profileSchema>;

const profileCopy = {
  en: {
    title: "Artist profile",
    description: "Clients see these details before they decide to message you. Keep your profile short, clear, and trustworthy.",
    artistName: "Artist name",
    artistNameHelp: "It works best when this matches your Instagram name.",
    slug: "Public slug",
    slugHelp: "This is the link you put in your Instagram bio. Clients arrive from here.",
    profileImage: "Profile image",
    profileImageHelp: "Use a clear face photo or an image that shows your signature style.",
    profileImageEmptyHint: "Artists with a profile photo usually get more messages.",
    coverImage: "Cover image",
    coverImageHelp: "Use the tattoo photo that shows your style best.",
    coverImageEmptyHint: "A strong cover image helps clients trust the page faster.",
    noImage: "No image selected yet",
    upload: "Upload image",
    remove: "Remove image",
    shortBio: "Short bio",
    shortBioHelp: "Optional. If empty, the public page falls back to your funnel intro copy.",
    shortBioPlaceholder: "Optional short studio intro",
    welcomeHeadline: "Welcome headline",
    welcomeHeadlineHelp: "Optional. Leave empty if you want funnel copy or theme overrides to lead.",
    welcomeHeadlinePlaceholder: "Optional headline",
    whatsapp: "WhatsApp number",
    whatsappHelp: "Clients will message you directly here.",
    whatsappEmptyHint: "Clients cannot reach you if this is empty.",
    instagram: "Instagram handle",
    instagramHelp: "Clients can check your profile from here.",
    currency: "Currency",
    active: "Artist page is active",
    saving: "Saving",
    save: "Save changes",
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
    description: "Müşteriler sana gelmeden önce bu bilgileri görür. Kısa, net ve güven veren bir profil oluştur.",
    artistName: "Sanatçı adı",
    artistNameHelp: "Instagram’daki adınla aynı olması önerilir.",
    slug: "Sayfa bağlantısı",
    slugHelp: "Instagram bio’na koyacağın link. Müşteriler buradan gelir.",
    profileImage: "Profil görseli",
    profileImageHelp: "Net bir yüz fotoğrafı veya imza stilini gösteren görsel kullan.",
    profileImageEmptyHint: "Profil fotoğrafı olan sanatçılar daha fazla mesaj alır.",
    coverImage: "Kapak görseli",
    coverImageHelp: "Tarzını gösteren en iyi dövme fotoğrafını kullan.",
    coverImageEmptyHint: "Tarzını gösteren bir kapak görseli eklemek güven verir.",
    noImage: "Henüz görsel seçilmedi",
    upload: "Görsel yükle",
    remove: "Görseli kaldır",
    shortBio: "Kısa biyografi",
    shortBioHelp: "İsteğe bağlı. Boş bırakırsan sanatçı sayfası giriş metnini kullanır.",
    shortBioPlaceholder: "İsteğe bağlı kısa stüdyo tanıtımı",
    welcomeHeadline: "Karşılama başlığı",
    welcomeHeadlineHelp: "İsteğe bağlı. Boş bırakırsan akış metni veya tema ayarı öne çıkar.",
    welcomeHeadlinePlaceholder: "İsteğe bağlı başlık",
    whatsapp: "WhatsApp numarası",
    whatsappHelp: "Müşteriler sana buradan direkt yazacak.",
    whatsappEmptyHint: "Müşteriler sana ulaşamaz.",
    instagram: "Instagram kullanıcı adı",
    instagramHelp: "Müşteriler profilini buradan inceleyebilir.",
    currency: "Para birimi",
    active: "Sanatçı sayfası aktif",
    saving: "Kaydediliyor",
    save: "Değişiklikleri kaydet",
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
  emptyLabel,
  uploadLabel,
  removeLabel,
  emptyHint,
}: {
  label: string;
  description: string;
  imageUrl: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  emptyLabel: string;
  uploadLabel: string;
  removeLabel: string;
  emptyHint?: string;
}) {
  return (
    <Field label={label} description={description}>
      <div className="space-y-3">
        <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/5 sm:h-36 sm:rounded-[20px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-sm text-[var(--foreground-muted)]">
              <ImagePlus className="size-5" />
              <span>{emptyLabel}</span>
              {emptyHint ? <span className="text-xs leading-5 text-[var(--accent-soft)]">{emptyHint}</span> : null}
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
  const router = useRouter();
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
    router.refresh();
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
            <Field
              label={copy.artistName}
              description={
                form.watch("artistName")?.trim().length
                  ? copy.artistNameHelp
                  : `${copy.artistNameHelp} ${locale === "tr" ? "Bu alan müşterilerin seni tanıması için gerekli." : "Clients need this to recognize you."}`
              }
              error={form.formState.errors.artistName?.message}
            >
              <Input {...form.register("artistName")} />
            </Field>
            <Field
              label={copy.slug}
              description={copy.slugHelp}
              error={form.formState.errors.slug?.message}
            >
              <div className="flex overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
                <div className="flex items-center border-r border-white/10 px-3 text-sm text-[var(--foreground-muted)]">
                  tattix.io/
                </div>
                <Input
                  {...form.register("slug")}
                  className="border-0 bg-transparent focus-visible:ring-0"
                />
              </div>
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
              emptyHint={!profileImageUrl ? copy.profileImageEmptyHint : undefined}
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
              emptyHint={!coverImageUrl ? copy.coverImageEmptyHint : undefined}
            />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Field
              label={copy.whatsapp}
              description={
                form.watch("whatsappNumber")?.trim().length
                  ? copy.whatsappHelp
                  : `${copy.whatsappHelp} ${copy.whatsappEmptyHint}`
              }
              error={form.formState.errors.whatsappNumber?.message}
            >
              <Input {...form.register("whatsappNumber")} />
            </Field>
            <Field
              label={copy.instagram}
              description={
                form.watch("instagramHandle")?.trim().length
                  ? copy.instagramHelp
                  : `${copy.instagramHelp} ${locale === "tr" ? "Bu alan müşterilerin seni görmesi için gerekli." : "Clients need this to review your work."}`
              }
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
          <input type="hidden" {...form.register("active")} />
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
