"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { CheckCircle2, Copy, ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAppOrigin } from "@/lib/config/site";
import { profileSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { ArtistProfile } from "@/lib/types";

type ProfileValues = z.infer<typeof profileSchema>;

const profileCopy = {
  en: {
    sectionTitle: "Profile details",
    coreSectionDescription: "These are the first details clients notice when your page opens.",
    contactSectionDescription: "Keep your profile link and contact channels clean and easy to share.",
    artistName: "Name",
    upperLabel: "Label",
    upperLabelDescription: "You can use your studio or brand name here.",
    upperLabelPlaceholder: "My tattoo studio",
    profileImage: "Profile photo",
    coverImage: "Cover photo",
    noImage: "No image selected yet",
    upload: "Upload image",
    remove: "Remove image",
    shortBio: "About",
    shortBioDescription: "This is where clients get to know you at a glance. Describe your work in 1–2 sentences.",
    shortBioPlaceholder: "I create fine line, minimal, and mostly blackwork tattoos. Available for small and medium-size pieces.",
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
    sectionTitle: "Profil Bilgilerin",
    coreSectionDescription: "",
    contactSectionDescription: "Profil linkini ve iletişim bilgilerini düzenle.",
    artistName: "İsim",
    upperLabel: "Etiket",
    upperLabelDescription: "(Buraya stüdyo veya marka adını yazabilirsin.)",
    upperLabelPlaceholder: "Dövme stüdyosu",
    profileImage: "Profil fotoğrafı",
    coverImage: "Kapak fotoğrafı",
    noImage: "Henüz görsel seçilmedi",
    upload: "Görsel yükle",
    remove: "Görseli kaldır",
    shortBio: "Hakkında",
    shortBioDescription: "Müşteri seni ilk bakışta burada tanır. Ne tarz çalıştığını 1–2 cümleyle yaz.",
    shortBioPlaceholder: "İnce çizgi, minimal ve siyah ağırlıklı dövmeler yapıyorum. Küçük ve orta boy çalışmalar için uygunum.",
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
        <div className="relative aspect-square w-full max-w-[148px] items-center justify-center overflow-hidden rounded-[14px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] xl:max-w-[128px]">
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
          <label className="inline-flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[12px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-2.5 text-[11px] text-[var(--text-primary)] transition hover:bg-[rgba(255,255,255,0.05)]">
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
            <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="h-[30px] px-2.5 text-[11px]">
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
}: {
  profile: ArtistProfile;
  upperLabel: string;
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
          title={copy.sectionTitle}
          description={copy.coreSectionDescription || undefined}
        >
          <div className="grid gap-2 xl:grid-cols-[120px_120px_minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
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
            <div className="space-y-2 xl:col-span-2">
              <div className="grid gap-2 xl:grid-cols-2">
                <Field label={copy.artistName} error={form.formState.errors.artistName?.message}>
                  <Input {...form.register("artistName")} className="h-8 text-[13px]" />
                </Field>
                <Field
                  label={copy.upperLabel}
                  description={copy.upperLabelDescription}
                  error={form.formState.errors.upperLabel?.message}
                >
                  <Input {...form.register("upperLabel")} placeholder={copy.upperLabelPlaceholder} className="h-8 text-[13px]" />
                </Field>
              </div>

              <Field
                label={copy.shortBio}
                description={copy.shortBioDescription}
                error={form.formState.errors.shortBio?.message}
              >
                <Textarea
                  {...form.register("shortBio")}
                  placeholder={copy.shortBioPlaceholder}
                  className="min-h-[64px] text-[13px] xl:min-h-[56px]"
                />
              </Field>
            </div>
          </div>
        </SectionBlock>

        <SectionBlock
          title={locale === "tr" ? "Link ve iletişim" : "Link and contact"}
          description={copy.contactSectionDescription}
        >
          <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_100px] xl:items-end">
            <Field label={copy.linkSection}>
              <div className="flex min-w-0 overflow-hidden rounded-[16px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.025)]">
                <div className="flex items-center border-r border-[var(--border-soft)] px-2.5 text-[10.5px] text-[var(--text-muted)]">
                  {getAppOrigin()}/
                </div>
                <Input
                  {...form.register("slug")}
                  className="h-8 border-0 bg-transparent text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </Field>
            <Button type="button" variant="outline" onClick={() => void handleCopyLink()} className="h-8 text-[13px]">
              <Copy className="size-3.5" />
              {copied ? copy.copied : copy.copyLink}
            </Button>
          </div>

          <div className="grid gap-2 xl:grid-cols-2">
            <Field label={copy.whatsapp} error={form.formState.errors.whatsappNumber?.message}>
              <Input {...form.register("whatsappNumber")} className="h-8 text-[13px]" />
            </Field>
            <Field label={copy.instagram} error={form.formState.errors.instagramHandle?.message}>
              <Input {...form.register("instagramHandle")} className="h-8 text-[13px]" />
            </Field>
          </div>
          <input type="hidden" {...form.register("welcomeHeadline")} />
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
