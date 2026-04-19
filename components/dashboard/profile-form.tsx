"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Copy, ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { AvatarTile } from "@/components/shared/avatar-tile";
import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAppOrigin } from "@/lib/config/site";
import { profileSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import { buildThemeStyles } from "@/lib/theme";
import type { ArtistPageTheme, ArtistProfile } from "@/lib/types";

type ProfileValues = z.infer<typeof profileSchema>;

const profileCopy = {
  en: {
    profileSection: "Visible on your profile",
    linkSection: "Your page link",
    contactSection: "Contact",
    artistName: "Name",
    slug: "Your page link",
    copyLink: "Copy",
    copied: "Copied",
    profileImage: "Profile photo",
    coverImage: "Cover image",
    noImage: "No image selected yet",
    upload: "Upload image",
    remove: "Remove image",
    shortBio: "Short description",
    shortBioPlaceholder: "Minimal and fine line tattoos. Small and medium-size pieces.",
    welcomeHeadline: "Heading (optional)",
    welcomeHeadlinePlaceholder: "Heading",
    whatsapp: "WhatsApp number",
    instagram: "Instagram username",
    saving: "Saving",
    saved: "Saved",
    demoSaved: "Demo data refreshed.",
    uploadUnavailable: "Image upload is unavailable in demo mode.",
    uploadType: "Only image files are allowed.",
    uploadSize: "Images must be 6 MB or smaller.",
    uploadQueued: "Image uploaded.",
    uploadFailed: "Unable to upload image.",
    saveFailed: "Unable to save profile.",
    livePreview: "Live preview",
    liveCta: "Get an estimate",
  },
  tr: {
    profileSection: "Profilde görünenler",
    linkSection: "Sayfa linkin",
    contactSection: "İletişim",
    artistName: "İsim",
    slug: "Sayfa linkin",
    copyLink: "Kopyala",
    copied: "Kopyalandı",
    profileImage: "Profil fotoğrafı",
    coverImage: "Kapak görseli",
    noImage: "Henüz görsel seçilmedi",
    upload: "Görsel yükle",
    remove: "Görseli kaldır",
    shortBio: "Kısa açıklama",
    shortBioPlaceholder: "Minimal ve ince çizgi dövmeler. Küçük ve orta boy çalışmalar.",
    welcomeHeadline: "Başlık (opsiyonel)",
    welcomeHeadlinePlaceholder: "Başlık",
    whatsapp: "WhatsApp numarası",
    instagram: "Instagram kullanıcı adı",
    saving: "Kaydediliyor",
    saved: "Kaydedildi",
    demoSaved: "Demo verisi güncellendi.",
    uploadUnavailable: "Demo modunda görsel yükleme kullanılamıyor.",
    uploadType: "Sadece görsel dosyaları yüklenebilir.",
    uploadSize: "Görseller en fazla 6 MB olabilir.",
    uploadQueued: "Görsel yüklendi.",
    uploadFailed: "Görsel yüklenemedi.",
    saveFailed: "Profil kaydedilemedi.",
    livePreview: "Canlı görünüm",
    liveCta: "Fiyat tahmini al",
  },
} as const;

function MediaUploadField({
  label,
  imageUrl,
  onUpload,
  onRemove,
  emptyLabel,
  uploadLabel,
  removeLabel,
}: {
  label: string;
  imageUrl: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  emptyLabel: string;
  uploadLabel: string;
  removeLabel: string;
}) {
  return (
    <Field label={label}>
      <div className="space-y-3">
        <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-white/5 sm:h-36 sm:rounded-[20px]">
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
      </div>
    </Field>
  );
}

export function ProfileForm({
  profile,
  pageTheme,
  demoMode,
  locale,
}: {
  profile: ArtistProfile;
  pageTheme: ArtistPageTheme;
  demoMode: boolean;
  locale: PublicLocale;
}) {
  const copy = profileCopy[locale];
  const [copied, setCopied] = useState(false);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const defaultValues = useMemo<ProfileValues>(
    () => ({
      artistName: profile.artistName,
      slug: profile.slug,
      profileImageUrl: profile.profileImageUrl ?? "",
      coverImageUrl: profile.coverImageUrl ?? "",
      shortBio: profile.shortBio,
      welcomeHeadline: profile.welcomeHeadline,
      whatsappNumber: profile.whatsappNumber,
      instagramHandle: profile.instagramHandle,
      active: profile.active,
    }),
    [profile],
  );
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  const watchedValues = useWatch({ control: form.control }) as ProfileValues | undefined;
  const lastSavedPayloadRef = useRef(JSON.stringify(defaultValues));
  const saveRequestIdRef = useRef(0);
  const artistName = useWatch({ control: form.control, name: "artistName" }) ?? "";
  const slug = useWatch({ control: form.control, name: "slug" }) ?? "";
  const shortBio = useWatch({ control: form.control, name: "shortBio" }) ?? "";
  const welcomeHeadline = useWatch({ control: form.control, name: "welcomeHeadline" }) ?? "";
  const profileImageUrl = useWatch({ control: form.control, name: "profileImageUrl" }) ?? "";
  const coverImageUrl = useWatch({ control: form.control, name: "coverImageUrl" }) ?? "";
  const publicLink = useMemo(() => `${getAppOrigin()}/${slug || profile.slug}`, [slug, profile.slug]);
  const { wrapperStyle } = buildThemeStyles(pageTheme);

  useEffect(() => {
    form.reset(defaultValues);
    lastSavedPayloadRef.current = JSON.stringify(defaultValues);
    setAutosaveState("idle");
    setStatusMessage(null);
  }, [defaultValues, form]);

  async function persistProfile(values: ProfileValues) {
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
      return false;
    }

    form.clearErrors("root");
    setStatusMessage(payload.message ?? (demoMode ? copy.demoSaved : copy.saved));
    return true;
  }

  useEffect(() => {
    if (!watchedValues) {
      return;
    }

    const serializedValues = JSON.stringify(watchedValues);
    if (serializedValues === lastSavedPayloadRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const isValid = await form.trigger(undefined, { shouldFocus: false });
      if (!isValid) {
        return;
      }

      const requestId = saveRequestIdRef.current + 1;
      saveRequestIdRef.current = requestId;
      setAutosaveState("saving");
      setStatusMessage(copy.saving);

      const saved = await persistProfile(watchedValues);
      if (requestId !== saveRequestIdRef.current) {
        return;
      }

      if (saved) {
        lastSavedPayloadRef.current = serializedValues;
        setAutosaveState("saved");
      } else {
        setAutosaveState("error");
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [copy.saving, form, watchedValues]);

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
      form.clearErrors("root");
      setStatusMessage(copy.uploadQueued);
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
    form.clearErrors("root");
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
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="surface-border">
            <CardHeader className="pb-3">
              <CardTitle>{copy.profileSection}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <MediaUploadField
                  label={copy.profileImage}
                  imageUrl={profileImageUrl}
                  onUpload={(file) => void handleMediaUpload("profileImageUrl", file)}
                  onRemove={() => void handleMediaRemove("profileImageUrl")}
                  emptyLabel={copy.noImage}
                  uploadLabel={copy.upload}
                  removeLabel={copy.remove}
                />
                <MediaUploadField
                  label={copy.coverImage}
                  imageUrl={coverImageUrl}
                  onUpload={(file) => void handleMediaUpload("coverImageUrl", file)}
                  onRemove={() => void handleMediaRemove("coverImageUrl")}
                  emptyLabel={copy.noImage}
                  uploadLabel={copy.upload}
                  removeLabel={copy.remove}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Field label={copy.artistName} error={form.formState.errors.artistName?.message}>
                  <Input {...form.register("artistName")} />
                </Field>
                <Field label={copy.welcomeHeadline} error={form.formState.errors.welcomeHeadline?.message}>
                  <Input {...form.register("welcomeHeadline")} placeholder={copy.welcomeHeadlinePlaceholder} />
                </Field>
              </div>

              <Field label={copy.shortBio} error={form.formState.errors.shortBio?.message}>
                <Textarea
                  {...form.register("shortBio")}
                  placeholder={copy.shortBioPlaceholder}
                  className="min-h-[104px]"
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="surface-border overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>{copy.livePreview}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto max-w-[320px]">
                <div
                  className="overflow-hidden rounded-[28px] border"
                  style={{
                    ...wrapperStyle,
                    borderColor: "var(--artist-border)",
                    background:
                      "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
                  }}
                >
                  <div
                    className="h-32 border-b bg-grid"
                    style={
                      coverImageUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.15), rgba(9,9,11,0.82)), url(${coverImageUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            borderColor: "var(--artist-border)",
                          }
                        : { borderColor: "var(--artist-border)" }
                    }
                  />
                  <div className="-mt-10 space-y-3 p-4">
                    <AvatarTile
                      name={artistName || profile.artistName}
                      imageUrl={profileImageUrl}
                      planType={profile.planType}
                    />
                    <div className="space-y-3">
                      <p
                        className="text-base"
                        style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}
                      >
                        {artistName || profile.artistName}
                      </p>
                      {welcomeHeadline?.trim() ? (
                        <h3
                          className="text-[1.55rem] leading-tight"
                          style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}
                        >
                          {welcomeHeadline}
                        </h3>
                      ) : null}
                      {shortBio?.trim() ? (
                        <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                          {shortBio}
                        </p>
                      ) : null}
                      <div
                        className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium"
                        style={{
                          backgroundColor: "var(--artist-primary)",
                          color: "var(--artist-primary-foreground)",
                        }}
                      >
                        {pageTheme.customCtaLabel || copy.liveCta}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="surface-border">
          <CardHeader className="pb-3">
            <CardTitle>{copy.linkSection}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-[var(--foreground-muted)]">
              {publicLink}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-border">
          <CardHeader className="pb-3">
            <CardTitle>{copy.contactSection}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-2">
            <Field label={copy.whatsapp} error={form.formState.errors.whatsappNumber?.message}>
              <Input {...form.register("whatsappNumber")} />
            </Field>
            <Field label={copy.instagram} error={form.formState.errors.instagramHandle?.message}>
              <Input {...form.register("instagramHandle")} />
            </Field>
          </CardContent>
        </Card>
      </div>

      <input type="hidden" {...form.register("active")} />

      <div className="flex min-h-6 items-center gap-2 px-1 text-sm text-[var(--foreground-muted)]">
        {autosaveState === "saving" ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {autosaveState === "saved" ? <CheckCircle2 className="size-4 text-[var(--accent-soft)]" /> : null}
        {form.formState.errors.root?.message ?? statusMessage}
      </div>
    </div>
  );
}
