"use client";

import { Check } from "lucide-react";

import { getRequestTypeLabel } from "@/lib/pricing/v2/output";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFeaturedDesign, PricingSourceValue, RequestTypeValue } from "@/lib/types";

export function IntentSelectionStep({
  locale,
  designs,
  selectedDesignId,
  pricingSource,
  requestType,
  onPricingSourceChange,
  onRequestTypeChange,
  onDesignSelect,
}: {
  locale: PublicLocale;
  designs: ArtistFeaturedDesign[];
  selectedDesignId: string;
  pricingSource: PricingSourceValue | "";
  requestType: RequestTypeValue | "";
  onPricingSourceChange: (value: PricingSourceValue) => void;
  onRequestTypeChange: (value: RequestTypeValue) => void;
  onDesignSelect: (designId: string) => void;
}) {
  const hasDesigns = designs.length > 0;
  const requestTypeOptions: RequestTypeValue[] = [
    "text",
    "mini_simple",
    "single_object",
    "multi_element",
    "cover_up",
    "unsure",
  ];
  const requestTypeDescriptions: Record<RequestTypeValue, string> =
    locale === "tr"
      ? {
          text: "Kelime, tarih veya kısa yazı",
          mini_simple: "Sembol, küçük ikon, mini tasarım",
          single_object: "Tek bir çiçek, kuş, hançer, kelebek gibi",
          multi_element: "Birden fazla parçadan oluşan kompozisyon",
          cover_up: "Var olan bir dövmeyi kapatmak veya dönüştürmek",
          unsure: "Karar veremiyorsan bunu seçebilirsin",
        }
      : {
          text: "A word, date, or short text",
          mini_simple: "A symbol, small icon, or mini design",
          single_object: "A single flower, bird, dagger, butterfly, or similar",
          multi_element: "A composition made of more than one element",
          cover_up: "Covering or transforming an existing tattoo",
          unsure: "Choose this if you are not sure yet",
        };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPricingSourceChange("custom_request")}
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
              ? "Sana en yakın iş tipini seçip devam edebilirsin."
              : "Pick the closest job type and continue."}
          </p>
        </button>

        {hasDesigns ? (
          <button
            type="button"
            onClick={() => onPricingSourceChange("featured_design")}
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
              {locale === "tr" ? "Ne yaptırmak istiyorsun?" : "What do you want to get?"}
            </p>
            <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {locale === "tr" ? "Sana en yakın olan seçeneği işaretle." : "Pick the option that feels closest."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {requestTypeOptions.map((option) => {
              const active = requestType === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onRequestTypeChange(option)}
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
                    <p className="font-medium">{getRequestTypeLabel(option, locale)}</p>
                    {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                    {requestTypeDescriptions[option]}
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
                onClick={() => onDesignSelect(design.id)}
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
