"use client";

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
              {getPlacementDetailLocaleLabel(selectedPlacement, locale)} {copy.adjustSliderFor.toLowerCase()}.
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

    </div>
  );
}
