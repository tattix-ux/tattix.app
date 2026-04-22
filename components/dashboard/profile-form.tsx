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
export type ProfilePreviewDraft = {
  artistName: string;
  upperLabel: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  welcomeHeadline: string;
  shortBio: string;
};

const profileCopy = {
  en: {
    sectionTitle: "Profile details",
    coreSectionDescription: "These are the first details clients notice when your page opens.",
    contactSectionDescription: "Keep your profile link and contact channels clean and easy to share.",
    previewTitle: "Live profile preview",
    previewDescription: "Changes on the left appear here instantly.",
    artistName: "Name shown on profile",
    upperLabel: "Label",
    upperLabelDescription: "You can use your studio or brand name here.",
    upperLabelPlaceholder: "My tattoo studio",
    profileImage: "Profile photo",
    coverImage: "Cover image",
    noImage: "No image selected yet",
    upload: "Upload image",
    remove: "Remove image",
    shortBio: "Description",
    shortBioDescription: "This is where clients get to know you at a glance. Describe your work in 1–2 sentences.",
    shortBioPlaceholder: "I create fine line, minimal, and mostly blackwork tattoos. Available for small and medium-size pieces.",
    welcomeHeadline: "Heading",
    welcomeHeadlineDescription: "Appears below the label. This is often the first thing your client reads.",
    welcomeHeadlinePlaceholder: "What do you have in mind?",
    linkSection: "Profile link",
    linkSectionDescription: "You can add this link to your Instagram profile, stories, or messages.",
    copyLink: "Copy",
    copied: "Copied",
    whatsapp: "WhatsApp number",
    instagram: "Instagram username",
    contactSection: "Contact details",
    saving: "Saving",
    saved: "Saved",
    demoSaved: "Demo data refreshed.",
    uploadUnavailable: "Image upload is unavailable in demo mode.",
    uploadType: "Only image files are allowed.",
    uploadSize: "Images must be 6 MB or smaller.",
    uploadQueued: "Image uploaded.",
    uploadFailed: "Unable to upload image.",
    saveFailed: "Unable to save profile.",
  },
  tr: {
    sectionTitle: "Profil Bilgileri",
    coreSectionDescription: "Sayfan açıldığında müşterinin ilk gördüğü alanlar bunlar olur.",
    contactSectionDescription: "Profil linkini ve iletişim bilgilerini düzenle.",
    previewTitle: "Canlı profil önizlemesi",
    previewDescription: "Soldaki değişiklikler burada anında görünür.",
    artistName: "Profilde görünen isim",
    upperLabel: "Etiket",
    upperLabelDescription: "Buraya stüdyo veya marka adını yazabilirsin.",
    upperLabelPlaceholder: "Dövme stüdyosu",
    profileImage: "Profil fotoğrafı",
    coverImage: "Kapak görseli",
    noImage: "Henüz görsel seçilmedi",
    upload: "Görsel yükle",
    remove: "Görseli kaldır",
    shortBio: "Açıklama",
    shortBioDescription: "Müşteri seni ilk bakışta burada tanır. Ne tarz çalıştığını 1–2 cümleyle yaz.",
    shortBioPlaceholder: "İnce çizgi, minimal ve siyah ağırlıklı dövmeler yapıyorum. Küçük ve orta boy çalışmalar için uygunum.",
    welcomeHeadline: "Başlık",
    welcomeHeadlineDescription: "Etiketin altında görünür. Müşterin ilk burayı okuyacaktır.",
    welcomeHeadlinePlaceholder: "Aklında ne var?",
    linkSection: "Profil Linkin",
    linkSectionDescription: "Bu linki Instagram sayfana, storylerine veya mesajlarına ekleyebilirsin.",
    copyLink: "Kopyala",
    copied: "Kopyalandı",
    whatsapp: "WhatsApp numarası",
    instagram: "Instagram kullanıcı adı",
    contactSection: "İletişim Bilgileri",
    saving: "Kaydediliyor",
    saved: "Kaydedildi",
    demoSaved: "Demo verisi güncellendi.",
    uploadUnavailable: "Demo modunda görsel yükleme kullanılamıyor.",
    uploadType: "Sadece görsel dosyaları yüklenebilir.",
    uploadSize: "Görseller en fazla 6 MB olabilir.",
    uploadQueued: "Görsel yüklendi.",
    uploadFailed: "Görsel yüklenemedi.",
    saveFailed: "Profil kaydedilemedi.",
  },
} as const;

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="surface-border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.18)]">
      <CardHeader className="pb-2.5 xl:pb-2">
        <CardTitle className="text-[1.02rem] xl:text-[0.96rem]">{title}</CardTitle>
        {description ? (
          <p className="text-[12.5px] leading-5 text-[var(--text-secondary)] xl:text-[11.5px] xl:leading-[1.4]">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 xl:space-y-2.5">{children}</CardContent>
    </Card>
  );
}

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
    <Field label={label} className="gap-2.5 xl:gap-2">
      <div className="space-y-2">
        <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-[16px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] sm:h-32 xl:h-[104px] 2xl:h-[118px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center text-[12px] text-[var(--text-muted)]">
              <ImagePlus className="size-4" />
              <span>{emptyLabel}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-[14px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-[11.5px] text-[var(--text-primary)] transition hover:bg-[rgba(255,255,255,0.05)] xl:h-[32px]">
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
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-[11.5px]">
              <X className="size-3.5" />
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
  upperLabel,
  demoMode,
  locale,
  onPreviewChange,
}: {
  profile: ArtistProfile;
  upperLabel: string;
  demoMode: boolean;
  locale: PublicLocale;
  onPreviewChange?: (draft: ProfilePreviewDraft) => void;
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
      upperLabel: upperLabel ?? "",
      shortBio: profile.shortBio,
      welcomeHeadline: profile.welcomeHeadline,
      whatsappNumber: profile.whatsappNumber,
      instagramHandle: profile.instagramHandle,
      active: profile.active,
    }),
    [profile, upperLabel],
  );
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  const watchedValues = useWatch({ control: form.control }) as ProfileValues | undefined;
  const lastSavedPayloadRef = useRef(JSON.stringify(defaultValues));
  const saveRequestIdRef = useRef(0);
  const slug = useWatch({ control: form.control, name: "slug" }) ?? "";
  const watchedArtistName = useWatch({ control: form.control, name: "artistName" }) ?? "";
  const watchedUpperLabel = useWatch({ control: form.control, name: "upperLabel" }) ?? "";
  const watchedShortBio = useWatch({ control: form.control, name: "shortBio" }) ?? "";
  const watchedWelcomeHeadline = useWatch({ control: form.control, name: "welcomeHeadline" }) ?? "";
  const watchedProfileImageUrl = useWatch({ control: form.control, name: "profileImageUrl" }) ?? "";
  const watchedCoverImageUrl = useWatch({ control: form.control, name: "coverImageUrl" }) ?? "";
  const publicLink = useMemo(() => `${getAppOrigin()}/${slug || profile.slug}`, [slug, profile.slug]);

  useEffect(() => {
    form.reset(defaultValues);
    lastSavedPayloadRef.current = JSON.stringify(defaultValues);
    setAutosaveState("idle");
    setStatusMessage(null);
  }, [defaultValues, form]);

  async function persistProfile(values: ProfileValues) {
    const response = await fetch("/api/dashboard/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  useEffect(() => {
    onPreviewChange?.({
      artistName: watchedArtistName,
      upperLabel: watchedUpperLabel,
      profileImageUrl: watchedProfileImageUrl || null,
      coverImageUrl: watchedCoverImageUrl || null,
      welcomeHeadline: watchedWelcomeHeadline,
      shortBio: watchedShortBio,
    });
  }, [
    onPreviewChange,
    watchedArtistName,
    watchedCoverImageUrl,
    watchedProfileImageUrl,
    watchedShortBio,
    watchedUpperLabel,
    watchedWelcomeHeadline,
  ]);

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
    <div className="space-y-2 xl:space-y-1.5">
      <div className="space-y-2.5 xl:space-y-2">
        <SectionBlock
          title={locale === "tr" ? "Temel profil" : "Core profile"}
          description={copy.coreSectionDescription}
        >
          <div className="grid gap-2 xl:grid-cols-2">
            <MediaUploadField
              label={copy.profileImage}
              imageUrl={form.watch("profileImageUrl") || ""}
              onUpload={(file) => void handleMediaUpload("profileImageUrl", file)}
              onRemove={() => void handleMediaRemove("profileImageUrl")}
              emptyLabel={copy.noImage}
              uploadLabel={copy.upload}
              removeLabel={copy.remove}
            />
            <MediaUploadField
              label={copy.coverImage}
              imageUrl={form.watch("coverImageUrl") || ""}
              onUpload={(file) => void handleMediaUpload("coverImageUrl", file)}
              onRemove={() => void handleMediaRemove("coverImageUrl")}
              emptyLabel={copy.noImage}
              uploadLabel={copy.upload}
              removeLabel={copy.remove}
            />
          </div>

          <div className="grid gap-2 xl:grid-cols-2">
            <Field label={copy.artistName} error={form.formState.errors.artistName?.message}>
            <Input {...form.register("artistName")} className="h-9 xl:h-[36px]" />
            </Field>
            <Field
              label={copy.upperLabel}
              description={copy.upperLabelDescription}
              error={form.formState.errors.upperLabel?.message}
            >
              <Input {...form.register("upperLabel")} placeholder={copy.upperLabelPlaceholder} className="h-9 xl:h-[36px]" />
            </Field>
          </div>

          <Field
            label={copy.welcomeHeadline}
            description={copy.welcomeHeadlineDescription}
            error={form.formState.errors.welcomeHeadline?.message}
          >
            <Input {...form.register("welcomeHeadline")} placeholder={copy.welcomeHeadlinePlaceholder} className="h-9 xl:h-[36px]" />
          </Field>

          <Field
            label={copy.shortBio}
            description={copy.shortBioDescription}
            error={form.formState.errors.shortBio?.message}
          >
            <Textarea
              {...form.register("shortBio")}
              placeholder={copy.shortBioPlaceholder}
              className="min-h-[88px] xl:min-h-[72px]"
            />
          </Field>

        </SectionBlock>

        <SectionBlock
          title={locale === "tr" ? "Link ve iletişim" : "Link and contact"}
          description={copy.contactSectionDescription}
        >
          <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_100px] xl:items-end">
            <Field label={copy.linkSection}>
              <div className="flex min-w-0 overflow-hidden rounded-[16px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.025)]">
                <div className="flex items-center border-r border-[var(--border-soft)] px-2.5 text-[11px] text-[var(--text-muted)]">
                  {getAppOrigin()}/
                </div>
                <Input
                  {...form.register("slug")}
                  className="h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 xl:h-[36px]"
                />
              </div>
            </Field>
            <Button type="button" variant="outline" onClick={() => void handleCopyLink()} className="h-9 xl:h-[36px]">
              <Copy className="size-3.5" />
              {copied ? copy.copied : copy.copyLink}
            </Button>
          </div>

          <div className="grid gap-2 xl:grid-cols-2">
            <Field label={copy.whatsapp} error={form.formState.errors.whatsappNumber?.message}>
              <Input {...form.register("whatsappNumber")} className="h-9 xl:h-[36px]" />
            </Field>
            <Field label={copy.instagram} error={form.formState.errors.instagramHandle?.message}>
              <Input {...form.register("instagramHandle")} className="h-9 xl:h-[36px]" />
            </Field>
          </div>
          <input type="hidden" {...form.register("active")} />
        </SectionBlock>
      </div>

      <div className="flex min-h-4 items-center gap-1.5 px-1 text-[10.5px] text-[var(--foreground-muted)]">
        {autosaveState === "saving" ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {autosaveState === "saved" ? <CheckCircle2 className="size-4 text-[var(--accent-soft)]" /> : null}
        {form.formState.errors.root?.message ?? statusMessage}
      </div>
    </div>
  );
}

export function ProfilePreviewCard({
  profile,
  pageTheme,
  upperLabel,
  locale,
}: {
  profile: ArtistProfile;
  pageTheme: ArtistPageTheme;
  upperLabel: string;
  locale: PublicLocale;
}) {
  const copy = profileCopy[locale];
  const { wrapperStyle, backgroundMedia } = buildThemeStyles(pageTheme);

  return (
    <Card className="surface-border overflow-hidden border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-2)_0%,var(--bg-section)_100%)] shadow-[0_18px_42px_rgba(0,0,0,0.24)] xl:sticky xl:top-2 xl:self-start">
      <CardHeader className="pb-2 xl:pb-1.5">
        <CardTitle className="text-[0.96rem]">{copy.previewTitle}</CardTitle>
        <p className="text-[11px] leading-[1.4] text-[var(--text-secondary)]">{copy.previewDescription}</p>
      </CardHeader>
      <CardContent>
        <div className="mx-auto max-w-[262px] 2xl:max-w-[278px]">
          <div
            className="relative overflow-hidden rounded-[34px] border shadow-[0_20px_48px_rgba(0,0,0,0.3)]"
            style={{
              ...wrapperStyle,
              borderColor: "var(--artist-border)",
              background:
                "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
            }}
          >
            {backgroundMedia.imageUrl ? (
              <>
                <div
                  className="absolute inset-0 scale-[1.04]"
                  style={{
                    backgroundImage: `url(${backgroundMedia.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: backgroundMedia.position,
                    filter: `blur(${backgroundMedia.blurPx}px)`,
                  }}
                />
                <div className="absolute inset-0" style={{ background: backgroundMedia.overlayGradient }} />
                <div className="absolute inset-0" style={{ backgroundColor: backgroundMedia.overlayColor }} />
              </>
            ) : null}
            <div
              className="relative h-36 border-b bg-grid sm:h-40"
              style={
                profile.coverImageUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.15), rgba(9,9,11,0.82)), url(${profile.coverImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderColor: "var(--artist-border)",
                    }
                  : { borderColor: "var(--artist-border)" }
              }
            >
            </div>
            <div className="-mt-8 space-y-3 p-4 sm:p-5">
              <AvatarTile
                name={profile.artistName}
                imageUrl={profile.profileImageUrl}
                planType={profile.planType}
              />
              <div className="space-y-2.5">
                {upperLabel.trim() ? (
                  <div
                    className="inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "var(--artist-chip-surface)",
                      color: "var(--artist-chip-text)",
                    }}
                  >
                    {upperLabel}
                  </div>
                ) : null}
                {profile.welcomeHeadline.trim() ? (
                  <h3
                    className="text-[1.35rem] leading-tight"
                    style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}
                  >
                    {profile.welcomeHeadline}
                  </h3>
                ) : null}
                {profile.shortBio.trim() ? (
                  <p className="text-[12px] leading-[1.45]" style={{ color: "var(--artist-card-muted)" }}>
                    {profile.shortBio}
                  </p>
                ) : null}
                <div className="pt-1">
                  <div
                    className="inline-flex h-9 items-center rounded-[var(--artist-button-radius)] border px-3.5 text-[12px] font-medium"
                    style={{
                      backgroundColor: "var(--artist-primary-button-surface)",
                      borderColor: "var(--artist-primary-button-border)",
                      color: "var(--artist-primary-button-text)",
                      boxShadow: "var(--artist-button-shadow)",
                    }}
                  >
                    {pageTheme.customCtaLabel || (locale === "tr" ? "Fiyat tahmini al" : "Get an estimate")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
