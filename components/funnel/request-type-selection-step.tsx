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
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                {requestTypeDescriptions[option]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
