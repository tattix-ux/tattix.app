"use client";

import { Sparkles } from "lucide-react";

import {
  clampCm,
  deriveSizeCategoryFromCm,
  getPlacementSizingGuidance,
  getPlacementSizeConstraint,
} from "@/lib/constants/size-estimation";
import { getPlacementDetailLocaleLabel, getPublicCopy, type PublicLocale } from "@/lib/i18n/public";
import type { StyleValue } from "@/lib/constants/options";
import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { ArtistPricingRules } from "@/lib/types";

export function SizeEstimationSelector({
  selectedPlacement,
  approximateSizeCm,
  selectedStyle,
  sizeTimeRanges,
  locale,
  onApproximateSizeChange,
}: {
  selectedPlacement: BodyAreaDetailValue | "";
  approximateSizeCm: number | null;
  selectedStyle?: StyleValue | "" | null;
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
  const guidance = getPlacementSizingGuidance(selectedPlacement, safeCm, selectedStyle, locale);
  const showExceptionalTone = guidance.tone === "caution" && safeCm >= constraint.maxCm;
  const toneAccent =
    showExceptionalTone
      ? "color-mix(in srgb, #f59e0b 70%, var(--artist-primary) 30%)"
      : guidance.tone === "soft"
        ? "color-mix(in srgb, var(--artist-secondary) 65%, white 35%)"
        : "var(--artist-primary)";

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
                {guidance.headline}
              </p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                {guidance.supporting}
              </p>
              {guidance.helperNote ? (
                <p className="mt-2 text-xs leading-5" style={{ color: "var(--artist-muted)" }}>
                  {guidance.helperNote}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
