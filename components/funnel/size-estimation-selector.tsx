"use client";

import { clampCm, getPlacementSizeConstraint } from "@/lib/constants/size-estimation";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public";
import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";

export function SizeEstimationSelector({
  selectedPlacement,
  selectedSizeCm,
  locale,
  onApproximateSizeChange,
}: {
  selectedPlacement: BodyAreaDetailValue | "";
  selectedSizeCm: number | null;
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
          backgroundColor: "var(--artist-section-surface-strong)",
          borderRadius: "var(--artist-card-radius, 24px)",
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
  const safeCm = clampCm(selectedSizeCm ?? constraint.defaultCm, constraint);
  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4">
      <div
        className="rounded-[22px] border p-4 sm:rounded-[24px]"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "var(--artist-section-surface-strong)",
          borderRadius: "var(--artist-card-radius, 24px)",
          boxShadow: "var(--artist-card-shadow)",
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
              {copy.approximateTattooSize}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[1.65rem] font-semibold sm:text-2xl" style={{ color: "var(--artist-card-text)" }}>
              {`${safeCm} cm`}
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
            className="h-3 w-full cursor-pointer appearance-none rounded-full accent-[var(--artist-primary)]"
            style={{
              background: `linear-gradient(90deg, var(--artist-primary) 0%, var(--artist-primary) ${((safeCm - constraint.minCm) / (constraint.maxCm - constraint.minCm || 1)) * 100}%, var(--artist-divider) ${((safeCm - constraint.minCm) / (constraint.maxCm - constraint.minCm || 1)) * 100}%, var(--artist-divider) 100%)`,
            }}
            aria-label="Approximate tattoo size in centimeters"
          />
          <div
            className="flex items-center justify-between text-xs uppercase tracking-[0.18em]"
            style={{ color: "var(--artist-card-muted)" }}
          >
            <span>{copy.minimumLabel} · {constraint.minCm} cm</span>
            <span>{copy.maximumLabel} · {safeCm >= constraint.maxCm ? `${constraint.maxCm}+` : constraint.maxCm} cm</span>
          </div>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--artist-card-muted)" }}>
          {copy.sizeImpactNote}
        </p>
      </div>

    </div>
  );
}
