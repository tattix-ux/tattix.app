"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";

import {
  getPlacementCategoriesForAreaScope,
  getPlacementCategoryByDetail,
  type BodyAreaDetailValue,
  type BodyAreaGroupValue,
  type PlacementCategoryValue,
} from "@/lib/constants/body-placement";
import {
  getPlacementCategoryLocaleLabel,
  getPlacementDetailLocaleLabel,
  getPublicCopy,
  type PublicLocale,
} from "@/lib/i18n/public";
import type { AreaScopeValue } from "@/lib/types";

export function BodyPlacementSelector({
  selectedDetail,
  areaScope,
  locale,
  onSelect,
}: {
  selectedDetail: BodyAreaDetailValue | "";
  areaScope: AreaScopeValue | "";
  locale: PublicLocale;
  onSelect: (
    group: BodyAreaGroupValue | "",
    detail: BodyAreaDetailValue | "",
  ) => void;
}) {
  const [manualCategory, setManualCategory] = useState<PlacementCategoryValue | "">("");
  const copy = getPublicCopy(locale);
  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const visibleCategories = useMemo(
    () => getPlacementCategoriesForAreaScope(areaScope),
    [areaScope],
  );
  const selectedCategory = getPlacementCategoryByDetail(selectedDetail)?.value ?? "";
  const activeCategory = visibleCategories.some((category) => category.value === selectedCategory)
    ? selectedCategory
    : visibleCategories.some((category) => category.value === manualCategory)
      ? manualCategory
      : "";

  const detailOptions = useMemo(() => {
    if (!activeCategory) {
      return null;
    }

    return visibleCategories.find((category) => category.value === activeCategory) ?? null;
  }, [activeCategory, visibleCategories]);

  function getCategoryDescription(
    categoryValue: PlacementCategoryValue,
    details: readonly { value: BodyAreaDetailValue }[],
  ) {
    if (locale === "tr" && areaScope === "large_single_area") {
      if (categoryValue === "arm") {
        return "Üst kol veya alt kol";
      }

      if (categoryValue === "leg") {
        return "Üst bacak veya alt bacak";
      }

      if (categoryValue === "torso") {
        return "Göğüs, kaburga veya karın";
      }

      if (categoryValue === "not-sure") {
        return "Emin değilim";
      }
    }

    const visibleLabels = details
      .map((detail) => getPlacementDetailLocaleLabel(detail.value, locale))
      .filter((label) =>
        locale === "tr"
          ? !label.toLocaleLowerCase("tr-TR").includes("başka bir bölge")
          : !label.toLowerCase().includes("other"),
      )
      .slice(0, 3);

    if (visibleLabels.length === 0) {
      return "";
    }

    if (visibleLabels.length === 1) {
      return visibleLabels[0];
    }

    if (visibleLabels.length === 2) {
      return locale === "tr"
        ? `${visibleLabels[0]} veya ${visibleLabels[1]}`
        : `${visibleLabels[0]} or ${visibleLabels[1]}`;
    }

    return locale === "tr"
      ? `${visibleLabels[0]}, ${visibleLabels[1]} veya ${visibleLabels[2]}`
      : `${visibleLabels[0]}, ${visibleLabels[1]}, or ${visibleLabels[2]}`;
  }

  useEffect(() => {
    if (!detailOptions || !detailSectionRef.current) {
      return;
    }

    window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [detailOptions]);

  function handleCategoryToggle(category: {
    value: PlacementCategoryValue;
    details: readonly { value: BodyAreaDetailValue }[];
  }) {
    const isActive = activeCategory === category.value;

    if (isActive) {
      setManualCategory("");
      onSelect("", "");
      return;
    }

    setManualCategory(category.value);

    const isDetailCompatible = selectedDetail
      ? category.details.some((detail) => detail.value === selectedDetail)
      : false;

    if (!isDetailCompatible) {
      onSelect(category.value, "");
    }
  }

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
        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
          {copy.placementCategoryLabel}
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
          {copy.placementCategoryHelp}
        </p>
        <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((category) => {
            const active = category.value === activeCategory;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className="w-full max-w-full rounded-[20px] border px-4 py-3.5 text-left transition sm:rounded-[22px] sm:py-4"
                style={{
                  borderColor: active ? "var(--artist-selected-border)" : "var(--artist-border)",
                  backgroundColor: active
                    ? "var(--artist-selected-surface)"
                    : "var(--artist-section-surface)",
                  color: "var(--artist-card-text)",
                  borderRadius: "var(--artist-field-radius, 22px)",
                }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="break-words font-medium">{getPlacementCategoryLocaleLabel(category.value, locale)}</p>
                    {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--artist-card-muted)" }}>
                    {getCategoryDescription(category.value, category.details)}
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
          backgroundColor: "var(--artist-section-surface-strong)",
          borderRadius: "var(--artist-card-radius, 24px)",
          boxShadow: "var(--artist-card-shadow)",
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
              const active = selectedDetail === detail.value;

              return (
                <button
                  key={detail.value}
                  type="button"
                  onClick={() =>
                    onSelect(
                      detailOptions.value,
                      active ? "" : detail.value,
                    )
                  }
                  className="w-full max-w-full rounded-[18px] border px-4 py-3 text-left text-sm transition sm:rounded-[20px]"
                  style={{
                    borderColor: active ? "var(--artist-selected-border)" : "var(--artist-border)",
                    backgroundColor: active
                      ? "var(--artist-selected-surface)"
                      : "var(--artist-section-surface)",
                    color: "var(--artist-card-text)",
                    borderRadius: "var(--artist-field-radius, 18px)",
                  }}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="break-words">{getPlacementDetailLocaleLabel(detail.value, locale)}</span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border border-dashed px-4 py-5 text-sm" style={{ color: "var(--artist-card-muted)", borderColor: "var(--artist-border)", backgroundColor: "var(--artist-section-surface)" }}>
            {copy.selectPlacementHelp}
          </div>
        )}
      </motion.div>
    </div>
  );
}
