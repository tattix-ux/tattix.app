"use client";

import {
  clampCm,
  deriveSizeCategoryFromCm,
  getPlacementSizeConstraint,
} from "@/lib/constants/size-estimation";
import { getPlacementDetailLocaleLabel, getPublicCopy, type PublicLocale } from "@/lib/i18n/public";
import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { ArtistPricingRules } from "@/lib/types";

const placementGuidance = {
  tr: {
    fingers: "Bu bölge için küçük ölçüler daha yaygındır.",
    wrist: "Bu bölgede küçük ve orta boy çalışmalar sık tercih edilir.",
    hand: "Bu bölgede boyut seçimi görünürlüğü doğrudan etkiler.",
    "forearm-outer": "Bu bölgede küçükten büyüğe farklı boyutlar rahat uygulanabilir.",
    "upper-arm-outer": "Bu bölge orta ve büyük boy çalışmalar için uygundur.",
    ankle: "Bu bölgede genelde daha kompakt boyutlar tercih edilir.",
    foot: "Boyut seçimi yerleşime göre daha görünür ya da daha sade durabilir.",
    calf: "Bu bölge farklı boyut seçeneklerine uygundur.",
    "thigh-front": "Bu bölge daha geniş kompozisyonlara da uygundur.",
    "chest-center": "Bu bölgede boyut, tasarımın yayılımını belirler.",
    ribs: "Bu bölgede boyut seçimi tasarımın dengesi için önemlidir.",
    stomach: "Bu bölgede orta ve geniş kompozisyonlar daha rahat çalışılabilir.",
    "upper-back": "Bu bölge daha geniş yerleşimlere uygundur.",
    "lower-back": "Bu bölgede kompozisyon yatay ya da geniş kullanılabilir.",
    "spine-area": "Bu bölgede boyut kadar oran da önemlidir.",
    "neck-front": "Bu bölgede daha kontrollü ölçüler tercih edilir.",
    "neck-side": "Bu bölgede küçük ve orta boy tasarımlar daha yaygındır.",
    "neck-back": "Bu bölgede sade ve dengeli boyutlar daha sık tercih edilir.",
    head: "Bu bölgede boyut seçimi tasarımın görünümünü belirgin etkiler.",
    "placement-not-sure": "Tam ölçüden emin değilsen yaklaşık bir boyut seçmen yeterli.",
  },
  en: {
    fingers: "Smaller sizes are more common in this area.",
    wrist: "Small and medium sizes are common here.",
    hand: "Size choice directly affects visibility in this area.",
    "forearm-outer": "This area can comfortably carry small to large sizes.",
    "upper-arm-outer": "This area works well for medium and large pieces.",
    ankle: "More compact sizes are usually preferred here.",
    foot: "Depending on the placement, size can feel bolder or more subtle here.",
    calf: "This area works with a wide range of sizes.",
    "thigh-front": "This area can also carry larger compositions.",
    "chest-center": "Here, size shapes how far the design spreads.",
    ribs: "Size matters for keeping the design balanced here.",
    stomach: "Medium and wide compositions usually fit more comfortably here.",
    "upper-back": "This area works well for wider placements.",
    "lower-back": "The composition can work horizontally or wide in this area.",
    "spine-area": "Proportion matters as much as size here.",
    "neck-front": "More controlled sizes are usually preferred here.",
    "neck-side": "Small and medium sizes are more common here.",
    "neck-back": "Balanced, simpler sizes are more common here.",
    head: "Size has a strong effect on how the design reads here.",
    "placement-not-sure": "If you're not sure, an approximate size is enough.",
  },
} as const;

function getPlacementGuidance(
  placement: BodyAreaDetailValue,
  locale: PublicLocale,
) {
  const map = placementGuidance[locale];
  return (
    map[placement as keyof typeof map] ??
    (locale === "tr"
      ? "Yaklaşık boyutu seç. Son tasarım ve yerleşime göre değişebilir."
      : "Choose an approximate size. The final design and placement can still shift it.")
  );
}

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
              {getPlacementGuidance(selectedPlacement, locale)}
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
            <span>{copy.minimumLabel} · {constraint.minCm} cm</span>
            <span>{copy.currentRange}</span>
            <span>{copy.maximumLabel} · {constraint.maxCm} cm</span>
          </div>
        </div>
        <p className="mt-4 text-sm" style={{ color: "var(--artist-card-muted)" }}>
          {copy.sizeImpactNote}
        </p>
      </div>

    </div>
  );
}
