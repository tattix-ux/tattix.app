"use client";

import { ImagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { intentOptions, type IntentValue } from "@/lib/constants/options";
import {
  getIntentLabel,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public";
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
  currency: string;
  intent: IntentValue | "";
  designs: ArtistFeaturedDesign[];
  selectedDesignId: string;
  referenceImage: string;
  referenceDescription: string;
  onIntentChange: (intent: IntentValue) => void;
  onDesignSelect: (designId: string | "") => void;
  onReferenceImageSelect: (fileName: string) => void;
  onReferenceDescriptionChange: (value: string) => void;
}) {
  const copy = getPublicCopy(locale);
  const activeCategory = getIntentCategory(intent);
  const matchingDesigns = activeCategory
    ? designs.filter((design) => design.active && design.category === activeCategory)
    : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {intentOptions.map((option) => {
          const active = intent === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onIntentChange(option.value)}
              className="rounded-[24px] border px-4 py-4 text-left transition"
              style={{
                borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                backgroundColor: active
                  ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                  : "rgba(0,0,0,0.12)",
                color: "var(--artist-card-text)",
              }}
            >
              <p className="font-medium">{getIntentLabel(option.value, locale)}</p>
            </button>
          );
        })}
      </div>

      {activeCategory ? (
        <div
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
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => onDesignSelect(active ? "" : design.id)}
                    className="rounded-[24px] border p-4 text-left transition"
                    style={{
                      borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                      backgroundColor: active
                        ? "color-mix(in srgb, var(--artist-primary) 14%, transparent)"
                        : "rgba(0,0,0,0.12)",
                    }}
                  >
                    <div
                      className="h-32 rounded-[20px]"
                      style={{
                        background: design.imageUrl
                          ? `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.45)), url(${design.imageUrl}) center / cover`
                          : "linear-gradient(135deg, color-mix(in srgb, var(--artist-primary) 18%, transparent), rgba(255,255,255,0.03), rgba(0,0,0,0.28))",
                      }}
                    />
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
                          {design.title}
                        </p>
                        <p className="mt-2 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                          {design.shortDescription}
                        </p>
                      </div>
                      {active ? (
                        <Badge variant="accent">{locale === "tr" ? "Secildi" : "Selected"}</Badge>
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
                  </button>
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
                    onChange={(event) => {
                      const fileName = event.target.files?.[0]?.name;
                      if (fileName) {
                        onReferenceImageSelect(fileName);
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {referenceImage ? (
                  <Badge variant="muted">
                    {copy.referenceSelected}: {referenceImage}
                  </Badge>
                ) : null}
              </div>
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
    </div>
  );
}
