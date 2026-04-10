"use client";

import { useEffect, useRef, useState } from "react";
import { Expand, ImagePlus, LoaderCircle, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { intentOptions, type IntentValue } from "@/lib/constants/options";
import {
  getIntentLabel,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public";
import { uploadPublicReferenceImage } from "@/lib/supabase/storage";
import type { ArtistFeaturedDesign } from "@/lib/types";
import { formatCompactCurrencyRange } from "@/lib/utils";

function getIntentCategory(intent: IntentValue | "") {
  if (intent === "flash-design") {
    return "flash-designs";
  }

  if (intent === "discounted-design") {
    return "discounted-designs";
  }

  return null;
}

export function IntentSelectionStep({
  locale,
  artistId,
  currency,
  intent,
  designs,
  selectedDesignId,
  referenceImage,
  referenceDescription,
  onIntentChange,
  onDesignSelect,
  onReferenceImageSelect,
  onReferenceDescriptionChange,
}: {
  locale: PublicLocale;
  artistId: string;
  currency: string;
  intent: IntentValue | "";
  designs: ArtistFeaturedDesign[];
  selectedDesignId: string;
  referenceImage: string;
  referenceDescription: string;
  onIntentChange: (intent: IntentValue) => void;
  onDesignSelect: (designId: string | "") => void;
  onReferenceImageSelect: (imageUrl: string, imagePath: string) => void;
  onReferenceDescriptionChange: (value: string) => void;
}) {
  const copy = getPublicCopy(locale);
  const [previewDesign, setPreviewDesign] = useState<ArtistFeaturedDesign | null>(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const designSectionRef = useRef<HTMLDivElement | null>(null);
  const referenceSectionRef = useRef<HTMLDivElement | null>(null);
  const activeCategory = getIntentCategory(intent);
  const matchingDesigns = activeCategory
    ? designs.filter((design) => design.active && design.category === activeCategory)
    : [];

  useEffect(() => {
    if (activeCategory && designSectionRef.current) {
      window.setTimeout(() => {
        designSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (intent === "design-in-mind" && referenceSectionRef.current) {
      window.setTimeout(() => {
        referenceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  }, [intent]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="grid gap-3">
        {intentOptions.map((option) => {
          const active = intent === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onIntentChange(option.value)}
              className="w-full max-w-full rounded-[24px] border px-4 py-4 text-left transition"
              style={{
                borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                backgroundColor: active
                  ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                  : "rgba(0,0,0,0.12)",
                color: "var(--artist-card-text)",
              }}
            >
              <p className="break-words font-medium">{getIntentLabel(option.value, locale)}</p>
            </button>
          );
        })}
      </div>

      {activeCategory ? (
        <div
          ref={designSectionRef}
          className="rounded-[24px] border p-4"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
            {copy.chooseDesign}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
            {copy.chooseDesignHelp}
          </p>
          {matchingDesigns.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: "var(--artist-card-muted)" }}>
              {copy.noMatchingDesigns}
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {matchingDesigns.map((design) => {
                const active = selectedDesignId === design.id;

                return (
                  <div
                    key={design.id}
                    onClick={() => setPreviewDesign(design)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPreviewDesign(design);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="w-full max-w-full overflow-hidden rounded-[24px] border p-4 text-left transition"
                    style={{
                      borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                      backgroundColor: active
                        ? "color-mix(in srgb, var(--artist-primary) 14%, transparent)"
                        : "rgba(0,0,0,0.12)",
                    }}
                  >
                    <div
                      className="h-32 w-full rounded-[20px]"
                      style={{
                        background: design.imageUrl
                          ? `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.45)), url(${design.imageUrl}) center / cover`
                          : "linear-gradient(135deg, color-mix(in srgb, var(--artist-primary) 18%, transparent), rgba(255,255,255,0.03), rgba(0,0,0,0.28))",
                      }}
                    />
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-medium" style={{ color: "var(--artist-card-text)" }}>
                          {design.title}
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                          {design.shortDescription}
                        </p>
                      </div>
                      {active ? (
                        <Badge variant="accent">{locale === "tr" ? "Seçildi" : "Selected"}</Badge>
                      ) : null}
                    </div>
                    {design.priceNote ? (
                      <p className="mt-3 text-sm" style={{ color: "var(--artist-primary)" }}>
                        {design.priceNote}
                      </p>
                    ) : design.referencePriceMin && design.referencePriceMax ? (
                      <p className="mt-3 text-sm" style={{ color: "var(--artist-primary)" }}>
                        {formatCompactCurrencyRange(
                          design.referencePriceMin,
                          design.referencePriceMax,
                          currency,
                        )}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="max-w-full whitespace-normal"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPreviewDesign(design);
                        }}
                      >
                        <Expand className="size-4" />
                        {copy.viewDesignDetails}
                      </Button>
                      {active ? (
                        <span className="text-xs font-medium" style={{ color: "var(--artist-primary)" }}>
                          {locale === "tr" ? "Seçili tasarım" : "Selected design"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-sm" style={{ color: "var(--artist-card-muted)" }}>
            {copy.styleSkippedNote}
          </p>
        </div>
      ) : null}

      {intent === "design-in-mind" ? (
        <div
          ref={referenceSectionRef}
          className="rounded-[24px] border p-4"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                {copy.referenceUploadLabel}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                {copy.referenceUploadHelp}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                  <ImagePlus className="size-4" />
                  {copy.uploadReference}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) {
                                return;
                              }

                              setUploadingReference(true);
                              try {
                                const uploaded = await uploadPublicReferenceImage(file, artistId);
                                onReferenceImageSelect(uploaded.publicUrl, uploaded.path);
                              } finally {
                                setUploadingReference(false);
                                event.currentTarget.value = "";
                              }
                            }}
                          />
                        </label>
                        {uploadingReference ? (
                          <Badge variant="muted">
                            <LoaderCircle className="mr-1 size-3 animate-spin" />
                            {locale === "tr" ? "Yükleniyor" : "Uploading"}
                          </Badge>
                        ) : null}
                        {referenceImage ? (
                          <Badge variant="muted">
                    {copy.referenceSelected}: {locale === "tr" ? "Hazır" : "Ready"}
                          </Badge>
                        ) : null}
                      </div>
                      {referenceImage ? (
                        <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={referenceImage}
                            alt={locale === "tr" ? "Yüklenen referans" : "Uploaded reference"}
                            className="h-44 w-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
            <div>
              <p className="mb-2 text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                {copy.referenceDescriptionLabel}
              </p>
              <Textarea
                value={referenceDescription}
                onChange={(event) => onReferenceDescriptionChange(event.target.value)}
                placeholder={copy.referenceDescriptionPlaceholder}
                style={{
                  backgroundColor: "rgba(0,0,0,0.12)",
                  borderColor: "var(--artist-border)",
                  color: "var(--artist-card-text)",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {previewDesign ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-clip bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-[calc(100vw-0.75rem)] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0f0f11] p-4 shadow-2xl sm:max-w-xl sm:rounded-[28px]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">{previewDesign.title}</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {activeCategory ? copy.chooseDesignHelp : copy.viewDesignDetails}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setPreviewDesign(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black">
              {previewDesign.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDesign.imageUrl}
                  alt={previewDesign.title}
                  className="max-h-[58vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-[var(--foreground-muted)]">
                  {locale === "tr" ? "Bu tasarım için görsel yok." : "No image available for this design."}
                </div>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                {previewDesign.shortDescription}
              </p>
              {previewDesign.priceNote ? (
                <p className="text-sm font-medium text-[var(--accent-soft)]">{previewDesign.priceNote}</p>
              ) : previewDesign.referencePriceMin && previewDesign.referencePriceMax ? (
                <p className="text-sm font-medium text-[var(--accent-soft)]">
                  {formatCompactCurrencyRange(
                    previewDesign.referencePriceMin,
                    previewDesign.referencePriceMax,
                    currency,
                  )}
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="w-full flex-1"
                onClick={() => {
                  onDesignSelect(selectedDesignId === previewDesign.id ? "" : previewDesign.id);
                  setPreviewDesign(null);
                }}
              >
                {selectedDesignId === previewDesign.id ? copy.unselectDesign : copy.selectThisDesign}
              </Button>
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setPreviewDesign(null)}>
                {locale === "tr" ? "Kapat" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
