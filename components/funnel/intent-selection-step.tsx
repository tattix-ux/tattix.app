"use client";

import { Check } from "lucide-react";

import type { PublicLocale } from "@/lib/i18n/public";
import type { AreaScopeValue, ArtistFeaturedDesign, PricingSourceValue } from "@/lib/types";

export function IntentSelectionStep({
  locale,
  designs,
  selectedDesignId,
  pricingSource,
  areaScope,
  onPricingSourceChange,
  onAreaScopeChange,
  onDesignSelect,
}: {
  locale: PublicLocale;
  designs: ArtistFeaturedDesign[];
  selectedDesignId: string;
  pricingSource: PricingSourceValue | "";
  areaScope: AreaScopeValue | "";
  onPricingSourceChange: (value: PricingSourceValue | "") => void;
  onAreaScopeChange: (value: AreaScopeValue | "") => void;
  onDesignSelect: (designId: string) => void;
}) {
  const hasDesigns = designs.length > 0;
  const areaScopeOptions: AreaScopeValue[] = [
    "standard_piece",
    "large_single_area",
    "wide_area",
    "unsure",
  ];
  const areaScopeLabels: Record<AreaScopeValue, string> =
    locale === "tr"
      ? {
          standard_piece: "Küçük / orta bir alan",
          large_single_area: "Tek bölgede büyük bir alan",
          wide_area: "Çok geniş bir alan",
          unsure: "Emin değilim",
        }
      : {
          standard_piece: "Small / medium area",
          large_single_area: "Large area in one placement",
          wide_area: "Very wide area",
          unsure: "Not sure",
        };
  const areaScopeDescriptions: Record<AreaScopeValue, string> =
    locale === "tr"
      ? {
          standard_piece: "Yazı, sembol, tek parça işler gibi",
          large_single_area: "Ön kolun, baldırın veya göğsün büyük kısmı gibi",
          wide_area: "Kolun yarısı, tüm kol, sırt, göğüs veya bacağın büyük kısmı gibi",
          unsure: "Karar veremiyorsan bunu seçebilirsin",
        }
      : {
          standard_piece: "Like text, symbols, or single-piece work",
          large_single_area: "Like a large part of the forearm, calf, or chest",
          wide_area: "Like half an arm, full arm, back, chest, or most of a leg",
          unsure: "Choose this if you are not sure yet",
        };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPricingSourceChange(pricingSource === "custom_request" ? "" : "custom_request")}
          className="rounded-[24px] border px-4 py-4 text-left transition"
          style={{
            borderColor: pricingSource === "custom_request" ? "var(--artist-primary)" : "var(--artist-border)",
            backgroundColor:
              pricingSource === "custom_request"
                ? "color-mix(in srgb, var(--artist-primary) 14%, transparent)"
                : "rgba(0,0,0,0.12)",
            color: "var(--artist-card-text)",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{locale === "tr" ? "Kendi talebimi anlatacağım" : "I want to describe my idea"}</p>
            {pricingSource === "custom_request" ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
          </div>
          <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
            {locale === "tr"
              ? "Aklındaki tasarımı bize anlatabilirsin."
              : "You can tell us about the tattoo you have in mind."}
          </p>
        </button>

        {hasDesigns ? (
          <button
            type="button"
            onClick={() => onPricingSourceChange(pricingSource === "featured_design" ? "" : "featured_design")}
            className="rounded-[24px] border px-4 py-4 text-left transition"
            style={{
              borderColor: pricingSource === "featured_design" ? "var(--artist-primary)" : "var(--artist-border)",
              backgroundColor:
                pricingSource === "featured_design"
                  ? "color-mix(in srgb, var(--artist-primary) 14%, transparent)"
                  : "rgba(0,0,0,0.12)",
              color: "var(--artist-card-text)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{locale === "tr" ? "Hazır tasarım seçeceğim" : "I want to pick a ready-made design"}</p>
              {pricingSource === "featured_design" ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
            </div>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {locale === "tr"
                ? "Dövmecinin yüklediği tasarımlardan birini seçebilirsin."
                : "Choose one of the uploaded designs."}
            </p>
          </button>
        ) : null}
      </div>

      {pricingSource === "custom_request" ? (
        <div className="space-y-3">
          <div>
            <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
              {locale === "tr" ? "Yaklaşık ne kadar alan kaplayacak?" : "About how much area will it cover?"}
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
                    borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--artist-primary) 14%, transparent)"
                      : "rgba(0,0,0,0.12)",
                    color: "var(--artist-card-text)",
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
              {locale === "tr" ? "Hangi tasarımı yaptırmak istiyorsun?" : "Which design do you want to get?"}
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {locale === "tr" ? "Sana en yakın olan tasarımı seç." : "Choose the design that feels closest."}
            </p>
          </div>
          <div className="grid gap-3">
            {designs.map((design) => {
              const active = selectedDesignId === design.id;
              return (
                <button
                  key={design.id}
                  type="button"
                  onClick={() => onDesignSelect(active ? "" : design.id)}
                  className="overflow-hidden rounded-[24px] border p-4 text-left transition"
                  style={{
                    borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--artist-primary) 14%, transparent)"
                      : "rgba(0,0,0,0.12)",
                    color: "var(--artist-card-text)",
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-[128px_minmax(0,1fr)]">
                    <div className="h-28 overflow-hidden rounded-[20px] border border-white/10 bg-black/20">
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
                    </div>
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
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
