"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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
    <div className="min-w-0 space-y-4">
      <div
        className="rounded-[24px] border p-4"
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {placementCategoryOptions.map((category) => {
            const active = category.value === activeCategory;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className="rounded-[22px] border px-4 py-4 text-left transition"
                style={{
                  borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                    : "rgba(0,0,0,0.12)",
                  color: "var(--artist-card-text)",
                }}
              >
                <p className="font-medium">{getPlacementCategoryLocaleLabel(category.value, locale)}</p>
                <p className="mt-1 text-xs leading-5" style={{ color: "var(--artist-card-muted)" }}>
                  {getPlacementCategoryDescription(category.value, locale)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {detailOptions ? (
        <motion.div
          ref={detailSectionRef}
          key={detailOptions.value}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-[24px] border p-4"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        >
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
            {copy.placementDetailLabel}
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
            {copy.placementDetailHelpPrefix} {getPlacementCategoryLocaleLabel(detailOptions.value, locale).toLowerCase()}.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
                  className="rounded-[20px] border px-4 py-3 text-left text-sm transition"
                  style={{
                    borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                      : "rgba(0,0,0,0.12)",
                    color: "var(--artist-card-text)",
                  }}
                >
                  {getPlacementDetailLocaleLabel(detail, locale)}
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : null}

      <div
        className="rounded-[24px] border p-4"
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor: "rgba(0,0,0,0.12)",
        }}
      >
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
          {copy.placementSummaryLabel}
        </p>
        <p className="mt-2 text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
          {activeCategory
            ? getPlacementCategoryLocaleLabel(activeCategory, locale)
            : copy.placementSummaryEmpty}
        </p>
      </div>
    </div>
  );
}
