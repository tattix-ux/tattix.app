"use client";

import { Sparkles } from "lucide-react";

import {
  clampCm,
  deriveSizeCategoryFromCm,
  getPlacementSizeConstraint,
} from "@/lib/constants/size-estimation";
import { getPlacementDetailLocaleLabel, getPublicCopy, type PublicLocale } from "@/lib/i18n/public";
import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { ArtistPricingRules } from "@/lib/types";

export function SizeEstimationSelector({
  selectedPlacement,
  approximateSizeCm,
  sizeTimeRanges,
  locale,
  onApproximateSizeChange,
}: {
  selectedPlacement: BodyAreaDetailValue | "";
  approximateSizeCm: number | null;
  sizeTimeRanges?: ArtistPricingRules["sizeTimeRanges"];
  locale: PublicLocale;
  onApproximateSizeChange: (cm: number) => void;
}) {
  const copy = getPublicCopy(locale);

  if (!selectedPlacement) {
    return (
      <div
        className="rounded-[24px] border p-4"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
          {copy.selectPlacementFirst}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--artist-card-muted)" }}>
          {copy.selectPlacementHelp}
        </p>
      </div>
    );
  }

  const constraint = getPlacementSizeConstraint(selectedPlacement);
  const safeCm = clampCm(approximateSizeCm ?? constraint.defaultCm, constraint);
  const sizeCategory = deriveSizeCategoryFromCm(safeCm);
  const toneAccent = "var(--artist-primary)";
  const simpleGuidance =
    locale === "tr"
      ? {
          tiny: {
            headline: "Bu boyut küçük ve sade dövmeler için uygundur.",
            supporting: "Daha minimal fikirler, semboller veya kısa yazılar için iyi çalışır.",
          },
          small: {
            headline: "Bu boyut çoğu küçük dövme fikri için dengeli bir seçimdir.",
            supporting: "Hem temiz görünür hem de günlük kullanımda çok baskın durmaz.",
          },
          medium: {
            headline: "Bu boyut detay ve görünürlük arasında iyi bir denge sunar.",
            supporting: "Biraz daha belirgin duran ve rahat okunabilen dövmeler için uygundur.",
          },
          large: {
            headline: "Bu boyut daha belirgin ve yaygın bir alan kaplayan dövmeler içindir.",
            supporting: "Daha fazla detay veya daha güçlü görünürlük isteyen fikirlerde daha uygundur.",
          },
        }
      : {
          tiny: {
            headline: "This size works best for small and simple tattoos.",
            supporting: "It suits minimal ideas, symbols, or short lettering.",
          },
          small: {
            headline: "This is a balanced choice for most small tattoo ideas.",
            supporting: "It stays clear without feeling too dominant on the body.",
          },
          medium: {
            headline: "This size gives a good balance between detail and visibility.",
            supporting: "It works well for tattoos that should read more clearly.",
          },
          large: {
            headline: "This size suits tattoos that take up more space and stand out more.",
            supporting: "It is better when the idea needs stronger presence or more detail.",
          },
        };

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4">
      <div
        className="rounded-[22px] border p-4 sm:rounded-[24px]"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
              {copy.approximateTattooSize}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--artist-card-muted)" }}>
              {copy.adjustSliderFor} {getPlacementDetailLocaleLabel(selectedPlacement, locale).toLowerCase()}.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[1.65rem] font-semibold sm:text-2xl" style={{ color: "var(--artist-card-text)" }}>
              {safeCm} cm
            </p>
            <p className="text-sm" style={{ color: "var(--artist-primary)" }}>
              {copy.approxSize}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3 sm:mt-5">
          <input
            type="range"
            min={constraint.minCm}
            max={constraint.maxCm}
            step={1}
            value={safeCm}
            onChange={(event) => onApproximateSizeChange(Number(event.target.value))}
            className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--artist-primary)]"
            style={{
              background: `linear-gradient(90deg, var(--artist-primary) 0%, var(--artist-primary) ${((safeCm - constraint.minCm) / (constraint.maxCm - constraint.minCm || 1)) * 100}%, rgba(255,255,255,0.08) ${((safeCm - constraint.minCm) / (constraint.maxCm - constraint.minCm || 1)) * 100}%, rgba(255,255,255,0.08) 100%)`,
            }}
            aria-label="Approximate tattoo size in centimeters"
          />
          <div
            className="flex items-center justify-between text-xs uppercase tracking-[0.18em]"
            style={{ color: "var(--artist-card-muted)" }}
          >
            <span>{constraint.minCm} cm</span>
            <span>{copy.currentRange}</span>
            <span>{constraint.maxCm} cm</span>
          </div>
        </div>
      </div>

      <div
        className="rounded-[22px] border p-4 sm:rounded-[24px]"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-4" style={{ color: toneAccent }} />
          <div className="space-y-3">
            <div>
              <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
                {simpleGuidance[sizeCategory].headline}
              </p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                {simpleGuidance[sizeCategory].supporting}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
