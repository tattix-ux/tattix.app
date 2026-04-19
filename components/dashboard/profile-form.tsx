"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Copy, ExternalLink, ImagePlus, LoaderCircle, Save, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAppOrigin } from "@/lib/config/site";
import { profileSchema } from "@/lib/forms/schemas";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistProfile } from "@/lib/types";

type ProfileValues = z.infer<typeof profileSchema>;

const profileCopy = {
  en: {
    title: "Profile overview",
    description: "This is what clients see before they message you.",
    profileSection: "Visible on your profile",
    profileSectionHelp: "Shown at the top of your client page.",
    linkSection: "Your page link",
    linkSectionHelp: "You can place this in your Instagram bio.",
    contactSection: "Contact",
    contactSectionHelp: "Clients can reach you here.",
    artistName: "Name shown to clients",
    artistNameHelp: "Shown on the page.",
    slug: "Link for your Instagram bio",
    slugHelp: undefined,
    copyLink: "Copy",
    copied: "Copied",
    profileImage: "Profile photo",
    profileImageHelp: undefined,
    profileImageEmptyHint: undefined,
    coverImage: "Cover image",
    coverImageHelp: undefined,
    coverImageEmptyHint: undefined,
    noImage: "No image selected yet",
    upload: "Upload image",
    remove: "Remove image",
    shortBio: "Short bio",
    shortBioHelp: "Shown under the heading.",
    shortBioPlaceholder: "Minimal and fine line tattoos.",
    welcomeHeadline: "Welcome heading (optional)",
    welcomeHeadlineHelp: "Shown at the top.",
    welcomeHeadlinePlaceholder: "Welcome heading",
    whatsapp: "WhatsApp number",
    whatsappHelp: "Clients message you here.",
    whatsappEmptyHint: undefined,
    instagram: "Instagram username",
    instagramHelp: "Clients can open your profile here.",
    active: "Artist page is active",
    saving: "Saving",
    save: "Update profile",
    saveHint: "Clients see these changes right away.",
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
    title: "Profil görünümü",
    description: "Müşteri seni görmeden önce bunları görür.",
    profileSection: "Profilde görünenler",
    profileSectionHelp: "Sayfanın üst kısmında görünür.",
    linkSection: "Sayfa linkin",
    linkSectionHelp: "Instagram bio’ya bunu koyarsın.",
    contactSection: "İletişim",
    contactSectionHelp: "Müşteri sana buradan ulaşır.",
    artistName: "Müşteri tarafında görünen isim",
    artistNameHelp: "Sayfada görünür.",
    slug: "Instagram bio’ya koyacağın link",
    slugHelp: undefined,
    copyLink: "Kopyala",
    copied: "Kopyalandı",
    profileImage: "Profil fotoğrafı",
    profileImageHelp: undefined,
    profileImageEmptyHint: undefined,
    coverImage: "Kapak görseli",
    coverImageHelp: undefined,
    coverImageEmptyHint: undefined,
    noImage: "Henüz görsel seçilmedi",
    upload: "Görsel yükle",
    remove: "Görseli kaldır",
    shortBio: "Kısa bio",
    shortBioHelp: "Başlığın altında görünür.",
    shortBioPlaceholder: "Minimal ve ince çizgi dövmeler.",
    welcomeHeadline: "Karşılama başlığı (opsiyonel)",
    welcomeHeadlineHelp: "En üstte görünür.",
    welcomeHeadlinePlaceholder: "Karşılama başlığı",
    whatsapp: "WhatsApp numarası",
    whatsappHelp: "Müşteri sana buradan yazar.",
    whatsappEmptyHint: undefined,
    instagram: "Instagram kullanıcı adı",
    instagramHelp: "Profilini buradan açabilir.",
    active: "Sanatçı sayfası aktif",
    saving: "Kaydediliyor",
    save: "Profili güncelle",
    saveHint: "Kaydettiğinde görünür.",
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
  description?: string;
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
  const [copied, setCopied] = useState(false);
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
      active: profile.active,
    },
  });
  const artistName = useWatch({ control: form.control, name: "artistName" }) ?? "";
  const slug = useWatch({ control: form.control, name: "slug" }) ?? "";
  const shortBio = useWatch({ control: form.control, name: "shortBio" }) ?? "";
  const welcomeHeadline = useWatch({ control: form.control, name: "welcomeHeadline" }) ?? "";
  const profileImageUrl = useWatch({ control: form.control, name: "profileImageUrl" }) ?? "";
  const coverImageUrl = useWatch({ control: form.control, name: "coverImageUrl" }) ?? "";
  const publicLink = useMemo(() => `${getAppOrigin()}/${slug || profile.slug}`, [slug, profile.slug]);

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      form.setError("root", { message: locale === "tr" ? "Link kopyalanamadı." : "Unable to copy link." });
    }
  }

  return (
    <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-5">
        <Card className="surface-border">
          <CardHeader className="pb-4">
            <CardTitle>{copy.profileSection}</CardTitle>
            <CardDescription>{copy.profileSectionHelp}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
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
            <div className="grid gap-5 lg:grid-cols-2">
              <Field
                label={copy.artistName}
                description={copy.artistNameHelp}
                error={form.formState.errors.artistName?.message}
              >
                <Input {...form.register("artistName")} />
              </Field>
              <Field
                label={copy.welcomeHeadline}
                description={copy.welcomeHeadlineHelp}
                error={form.formState.errors.welcomeHeadline?.message}
              >
                <Input {...form.register("welcomeHeadline")} placeholder={copy.welcomeHeadlinePlaceholder} />
              </Field>
            </div>
            <Field
              label={copy.shortBio}
              description={copy.shortBioHelp}
              error={form.formState.errors.shortBio?.message}
            >
              <Textarea
                {...form.register("shortBio")}
                placeholder={copy.shortBioPlaceholder}
                className="min-h-[116px]"
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader className="pb-4">
            <CardTitle>{copy.linkSection}</CardTitle>
            <CardDescription>{copy.linkSectionHelp}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label={copy.slug}
              description={copy.slugHelp}
              error={form.formState.errors.slug?.message}
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
                  <div className="flex items-center border-r border-white/10 px-3 text-sm text-[var(--foreground-muted)]">
                    {getAppOrigin()}/
                  </div>
                  <Input
                    {...form.register("slug")}
                    className="border-0 bg-transparent focus-visible:ring-0"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={() => void handleCopyLink()}>
                  <Copy className="size-4" />
                  {copied ? copy.copied : copy.copyLink}
                </Button>
              </div>
            </Field>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--foreground-muted)]">
              {publicLink}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader className="pb-4">
            <CardTitle>{copy.contactSection}</CardTitle>
            <CardDescription>{copy.contactSectionHelp}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <Field
              label={copy.whatsapp}
              description={copy.whatsappHelp}
              error={form.formState.errors.whatsappNumber?.message}
            >
              <Input {...form.register("whatsappNumber")} />
            </Field>
            <Field
              label={copy.instagram}
              description={copy.instagramHelp}
              error={form.formState.errors.instagramHandle?.message}
            >
              <Input {...form.register("instagramHandle")} />
            </Field>
          </CardContent>
        </Card>

        <input type="hidden" {...form.register("active")} />

        <div className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {form.formState.errors.root?.message ? (
                <p className="text-sm text-[var(--accent-soft)]">{form.formState.errors.root.message}</p>
              ) : null}
              <p className="text-sm text-[var(--foreground-muted)]">{copy.saveHint}</p>
            </div>
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
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <Card className="surface-border overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle>{locale === "tr" ? "Canlı görünüm" : "Live preview"}</CardTitle>
            <CardDescription>
              {locale === "tr"
                ? "Müşteri tarafında yaklaşık böyle görünür."
                : "This is roughly how it appears to clients."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mx-auto max-w-[300px] rounded-[30px] border border-white/10 bg-[#161312] p-2.5 shadow-2xl">
              <div className="overflow-hidden rounded-[26px] bg-[#110f0f]">
                <div className="relative h-28 border-b border-white/10 bg-white/5">
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt={copy.coverImage} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--foreground-muted)]">
                      {copy.coverImage}
                    </div>
                  )}
                </div>
                <div className="-mt-8 space-y-4 px-4 pb-4">
                  <div className="flex items-end gap-3">
                    <div className="size-16 overflow-hidden rounded-[20px] border border-white/10 bg-white/8">
                      {profileImageUrl ? (
                        <img src={profileImageUrl} alt={copy.profileImage} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-[var(--foreground-muted)]">
                          {copy.profileImage}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">{artistName || profile.artistName}</p>
                      {form.watch("instagramHandle")?.trim() ? (
                        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-white">
                          @{form.watch("instagramHandle")}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {welcomeHeadline?.trim() ? (
                      <h3 className="text-2xl font-display text-white">{welcomeHeadline}</h3>
                    ) : null}
                    {shortBio?.trim() ? (
                      <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                        {shortBio}
                      </p>
                    ) : null}
                    <div className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)]">
                      {locale === "tr" ? "Fiyat tahmini al" : "Get an estimate"}
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[var(--accent-soft)]"
                    >
                      <ExternalLink className="size-4" />
                      {publicLink}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
