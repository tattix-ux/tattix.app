"use client";

import { Check } from "lucide-react";

import { getRequestTypeLabel } from "@/lib/pricing/v2/output";
import type { PublicLocale } from "@/lib/i18n/public";
import type { RequestTypeValue } from "@/lib/types";

export function RequestTypeSelectionStep({
  locale,
  requestType,
  onRequestTypeChange,
}: {
  locale: PublicLocale;
  requestType: RequestTypeValue | "";
  onRequestTypeChange: (value: RequestTypeValue) => void;
}) {
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
          text: "Kelime, tarih, kısa yazı",
          mini_simple: "Sembol, küçük ikon",
          single_object: "Tek bir figür veya obje",
          multi_element: "Birden fazla parçalı tasarım",
          cover_up: "Eski dövmeyi kapatma",
          unsure: "",
        }
      : {
          text: "Word, date, short text",
          mini_simple: "Symbol, small icon",
          single_object: "One figure or object",
          multi_element: "Multi-part design",
          cover_up: "Covering an old tattoo",
          unsure: "",
        };

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
          {locale === "tr" ? "Ne yaptırmak istiyorsun?" : "What do you want to get?"}
        </p>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
          {locale === "tr" ? "Sana en yakın olanı seç." : "Choose the closest option."}
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
                borderColor: active ? "var(--artist-selected-border)" : "var(--artist-border)",
                backgroundColor: active
                  ? "var(--artist-selected-surface)"
                  : "var(--artist-section-surface)",
                color: "var(--artist-card-text)",
                borderRadius: "var(--artist-field-radius, 22px)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{getRequestTypeLabel(option, locale)}</p>
                {active ? <Check className="mt-0.5 size-4 shrink-0" /> : null}
              </div>
              {requestTypeDescriptions[option] ? (
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                  {requestTypeDescriptions[option]}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
