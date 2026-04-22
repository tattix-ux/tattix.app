"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";

import { getFeaturedCategoryLabel, type PublicLocale } from "@/lib/i18n/public";
import type { AreaScopeValue, ArtistFeaturedDesign, PricingSourceValue } from "@/lib/types";

export function IntentSelectionStep({
  locale,
  designs,
  selectedDesignId,
  selectedDesignCategory,
  pricingSource,
  areaScope,
  onPricingSourceChange,
  onAreaScopeChange,
  onDesignCategoryChange,
  onDesignSelect,
}: {
  locale: PublicLocale;
  designs: ArtistFeaturedDesign[];
  selectedDesignId: string;
  selectedDesignCategory: string;
  pricingSource: PricingSourceValue | "";
  areaScope: AreaScopeValue | "";
  onPricingSourceChange: (value: PricingSourceValue | "") => void;
  onAreaScopeChange: (value: AreaScopeValue | "") => void;
  onDesignCategoryChange: (value: string) => void;
  onDesignSelect: (designId: string) => void;
}) {
  const hasDesigns = designs.length > 0;
  const [previewDesign, setPreviewDesign] = useState<ArtistFeaturedDesign | null>(null);
  const areaScopeOptions: AreaScopeValue[] = [
    "standard_piece",
    "large_single_area",
    "wide_area",
    "unsure",
  ];
  const areaScopeLabels: Record<AreaScopeValue, string> =
    locale === "tr"
      ? {
          standard_piece: "Küçük / orta",
          large_single_area: "Tek bölgede büyük",
          wide_area: "Büyük proje",
          unsure: "Emin değilim",
        }
      : {
          standard_piece: "Small / medium area",
          large_single_area: "Large in one area",
          wide_area: "Very wide area",
          unsure: "Not sure",
        };
  const areaScopeDescriptions: Record<AreaScopeValue, string> =
    locale === "tr"
      ? {
          standard_piece: "Yazı, sembol, tarih gibi tek parça işler",
          large_single_area: "Ön kol, baldır, göğüs gibi tek bölgede geniş yer kaplayan işler",
          wide_area: "Yarım kol, tüm kol, sırt gibi daha geniş kompozisyonlar",
          unsure: "Karar veremiyorsan bunu seçebilirsin",
        }
      : {
          standard_piece: "Like text, symbols, or single-piece work",
          large_single_area: "Like forearm, calf, or chest",
          wide_area: "Like half arm, full arm, or back",
          unsure: "Choose this if you are not sure yet",
        };
  const designCategories = useMemo(
    () =>
      Array.from(
        new Map(
          designs.map((design) => [design.category, design]),
        ).values(),
      ).map((design) => design.category),
    [designs],
  );
  const filteredDesigns = useMemo(() => {
    if (!selectedDesignCategory) {
      return [];
    }

    return designs.filter((design) => design.category === selectedDesignCategory);
  }, [designs, selectedDesignCategory]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPricingSourceChange(pricingSource === "custom_request" ? "" : "custom_request")}
          className="rounded-[24px] border px-4 py-4 text-left transition"
          style={{
            borderColor: pricingSource === "custom_request" ? "var(--artist-selected-border)" : "var(--artist-border)",
            backgroundColor:
              pricingSource === "custom_request"
                ? "var(--artist-selected-surface)"
                : "var(--artist-section-surface)",
            color: "var(--artist-card-text)",
            borderRadius: "var(--artist-card-radius, 24px)",
            boxShadow: pricingSource === "custom_request" ? "var(--artist-card-shadow)" : undefined,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{locale === "tr" ? "Talebimi anlatacağım" : "I’ll describe my request"}</p>
            {pricingSource === "custom_request" ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
          </div>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
            {locale === "tr"
              ? "Fikrini birkaç adımda anlatabilirsin."
              : "You can describe your idea in a few steps."}
          </p>
        </button>

        {hasDesigns ? (
          <button
            type="button"
            onClick={() => onPricingSourceChange(pricingSource === "featured_design" ? "" : "featured_design")}
            className="rounded-[24px] border px-4 py-4 text-left transition"
            style={{
              borderColor: pricingSource === "featured_design" ? "var(--artist-selected-border)" : "var(--artist-border)",
              backgroundColor:
                pricingSource === "featured_design"
                  ? "var(--artist-selected-surface)"
                  : "var(--artist-section-surface)",
              color: "var(--artist-card-text)",
              borderRadius: "var(--artist-card-radius, 24px)",
              boxShadow: pricingSource === "featured_design" ? "var(--artist-card-shadow)" : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{locale === "tr" ? "Hazır tasarım seçeceğim" : "I’ll pick a ready-made design"}</p>
              {pricingSource === "featured_design" ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
            </div>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {locale === "tr"
                ? "Hazır tasarımlar arasından seçebilirsin."
                : "Choose one of the uploaded designs."}
            </p>
          </button>
        ) : null}
      </div>

      {pricingSource === "custom_request" ? (
        <div className="space-y-3">
          <div>
            <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
              {locale === "tr" ? "Yaklaşık boyut ne kadar olsun?" : "About how large should it be?"}
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {locale === "tr" ? "Sana en yakın seçeneği seç." : "Choose the option that feels closest."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {areaScopeOptions.map((option) => {
              const active = areaScope === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onAreaScopeChange(active ? "" : option)}
                  className="rounded-[22px] border px-4 py-4 text-left transition"
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
                    <p className="font-medium">{areaScopeLabels[option]}</p>
                    {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                    {areaScopeDescriptions[option]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {pricingSource === "featured_design" ? (
        <div className="space-y-3">
          <div>
            <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
              {locale === "tr" ? "Önce bir kategori seç" : "Choose a category first"}
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {locale === "tr"
                ? "Dövmecinin eklediği kategorilerden birini seç. Sonra ilgili tasarımları görebilirsin."
                : "Pick one of the artist’s categories. Then you can browse the matching designs."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {designCategories.map((category) => {
              const active = selectedDesignCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onDesignCategoryChange(active ? "" : category)}
                  className="rounded-[22px] border px-4 py-4 text-left transition"
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
                    <p className="font-medium">{getFeaturedCategoryLabel(category, locale)}</p>
                    {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                    {locale === "tr"
                      ? "Bu kategorideki tasarımları göster"
                      : "Show the designs in this category"}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedDesignCategory ? (
            <div className="space-y-3">
              <div>
                <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
                  {locale === "tr" ? "Bu kategorideki tasarımlar" : "Designs in this category"}
                </p>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                  {locale === "tr"
                    ? "Tasarıma tıklayarak tam boy görebilir, alttan seçebilirsin."
                    : "Tap a design to see it full size, then select it below."}
                </p>
              </div>
              <div className="grid gap-3">
                {filteredDesigns.map((design) => {
              const active = selectedDesignId === design.id;
              return (
                <div
                  key={design.id}
                  className="overflow-hidden rounded-[24px] border p-4 text-left transition"
                  style={{
                    borderColor: active ? "var(--artist-selected-border)" : "var(--artist-border)",
                    backgroundColor: active
                      ? "var(--artist-selected-surface)"
                      : "var(--artist-section-surface)",
                    color: "var(--artist-card-text)",
                    borderRadius: "var(--artist-card-radius, 24px)",
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-[128px_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => setPreviewDesign(design)}
                      className="h-28 overflow-hidden rounded-[20px] border border-white/10 bg-black/20 transition hover:border-white/20"
                    >
                      {design.imageUrl ? (
                        <img
                          src={design.imageUrl}
                          alt={design.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--artist-card-muted)]">
                          {locale === "tr" ? "Görsel" : "Preview"}
                        </div>
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-base font-medium">{design.title}</p>
                        {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                      </div>
                      {design.shortDescription ? (
                        <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                          {design.shortDescription}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDesign(design)}
                          className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition"
                          style={{
                            borderColor: "var(--artist-border)",
                            color: "var(--artist-card-muted)",
                            backgroundColor: "var(--artist-chip-surface)",
                          }}
                        >
                          {locale === "tr" ? "Tam boy gör" : "View full size"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDesignSelect(active ? "" : design.id)}
                          className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition"
                          style={{
                            borderColor: active ? "var(--artist-selected-border)" : "var(--artist-border)",
                            color: active ? "var(--artist-card-text)" : "var(--artist-card-text)",
                            background: active ? "var(--artist-selected-surface)" : "var(--artist-section-surface)",
                          }}
                        >
                          {active
                            ? locale === "tr"
                              ? "Seçimi kaldır"
                              : "Clear selection"
                            : locale === "tr"
                              ? "Bu tasarımı seç"
                              : "Select this design"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {previewDesign ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewDesign(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-[28px] border p-4 shadow-2xl"
            style={{
              borderColor: "var(--artist-selected-border)",
              backgroundColor: "var(--artist-flow-surface)",
              boxShadow: "var(--artist-card-shadow)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewDesign(null)}
              className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full border transition"
              style={{
                borderColor: "var(--artist-border)",
                backgroundColor: "var(--artist-section-surface)",
                color: "var(--artist-card-text)",
              }}
              aria-label={locale === "tr" ? "Kapat" : "Close"}
            >
              <X className="size-4" />
            </button>
            <div className="mb-4 pr-12">
              <p className="text-lg font-semibold" style={{ color: "var(--artist-card-text)" }}>
                {previewDesign.title}
              </p>
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                {getFeaturedCategoryLabel(previewDesign.category, locale)}
              </p>
            </div>
            <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
              {previewDesign.imageUrl ? (
                <img
                  src={previewDesign.imageUrl}
                  alt={previewDesign.title}
                  className="max-h-[80vh] w-full object-contain"
                />
              ) : (
                <div className="flex min-h-[320px] items-center justify-center text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {locale === "tr" ? "Bu tasarım için görsel yok." : "No image available for this design."}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onDesignSelect(previewDesign.id);
                  setPreviewDesign(null);
                }}
                className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition"
                style={{
                  borderColor: "var(--artist-selected-border)",
                  background: "var(--artist-selected-surface)",
                  color: "var(--artist-card-text)",
                }}
              >
                {locale === "tr" ? "Bu tasarımı seç" : "Select this design"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
