"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";

import {
  getPlacementCategoryByDetail,
  placementCategoryOptions,
  type BodyAreaDetailValue,
  type BodyAreaGroupValue,
  type PlacementCategoryValue,
} from "@/lib/constants/body-placement";
import {
  getPlacementCategoryDescription,
  getPlacementCategoryLocaleLabel,
  getPlacementDetailLocaleLabel,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public";

export function BodyPlacementSelector({
  selectedDetail,
  locale,
  onSelect,
}: {
  selectedDetail: BodyAreaDetailValue | "";
  locale: PublicLocale;
  onSelect: (
    group: BodyAreaGroupValue | "",
    detail: BodyAreaDetailValue | "",
  ) => void;
}) {
  const [manualCategory, setManualCategory] = useState<PlacementCategoryValue | "">("");
  const copy = getPublicCopy(locale);
  const activeCategory = getPlacementCategoryByDetail(selectedDetail)?.value ?? manualCategory;
  const detailSectionRef = useRef<HTMLDivElement | null>(null);

  const detailOptions = useMemo(() => {
    if (!activeCategory) {
      return null;
    }

    return placementCategoryOptions.find((category) => category.value === activeCategory) ?? null;
  }, [activeCategory]);

  useEffect(() => {
    if (!detailOptions || !detailSectionRef.current) {
      return;
    }

    window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [detailOptions]);

  function handleCategoryToggle(category: (typeof placementCategoryOptions)[number]) {
    const isActive = activeCategory === category.value;

    if (isActive) {
      setManualCategory("");
      onSelect("", "");
      return;
    }

    setManualCategory(category.value);

    const isDetailCompatible = selectedDetail
      ? (category.details as readonly BodyAreaDetailValue[]).includes(selectedDetail)
      : false;

    if (!isDetailCompatible) {
      onSelect(category.group, "");
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-4">
      <div
        className="rounded-[22px] border p-4 sm:rounded-[24px]"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
          {copy.placementCategoryLabel}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
          {copy.placementCategoryHelp}
        </p>
        <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {placementCategoryOptions.map((category) => {
            const active = category.value === activeCategory;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className="w-full max-w-full rounded-[20px] border px-4 py-3.5 text-left transition sm:rounded-[22px] sm:py-4"
                style={{
                  borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                    : "rgba(0,0,0,0.12)",
                  color: "var(--artist-card-text)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="break-words font-medium">{getPlacementCategoryLocaleLabel(category.value, locale)}</p>
                  {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                </div>
                <p className="mt-1 text-xs leading-5" style={{ color: "var(--artist-card-muted)" }}>
                  {getPlacementCategoryDescription(category.value, locale)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        ref={detailSectionRef}
        key={detailOptions?.value ?? "empty"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="rounded-[22px] border p-4 sm:rounded-[24px]"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
          {copy.placementDetailLabel}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
          {detailOptions
            ? locale === "tr"
              ? `Seçtiğin bölge: ${getPlacementCategoryLocaleLabel(detailOptions.value, locale)}. Şimdi tam yeri seç.`
              : `Selected area: ${getPlacementCategoryLocaleLabel(detailOptions.value, locale)}. Now choose the exact spot.`
            : copy.selectPlacementHelp}
        </p>
        {detailOptions ? (
          <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
            {detailOptions.details.map((detail) => {
              const active = selectedDetail === detail;

              return (
                <button
                  key={detail}
                  type="button"
                  onClick={() =>
                    onSelect(
                      detailOptions.group,
                      active ? "" : detail,
                    )
                  }
                  className="w-full max-w-full rounded-[18px] border px-4 py-3 text-left text-sm transition sm:rounded-[20px]"
                  style={{
                    borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                      : "rgba(0,0,0,0.12)",
                    color: "var(--artist-card-text)",
                  }}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="break-words">{getPlacementDetailLocaleLabel(detail, locale)}</span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm" style={{ color: "var(--artist-card-muted)" }}>
            {copy.selectPlacementHelp}
          </div>
        )}
      </motion.div>
    </div>
  );
}
