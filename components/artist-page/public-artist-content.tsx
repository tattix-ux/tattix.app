"use client";

import { useState } from "react";

import { PublicFunnel } from "@/components/funnel/public-funnel";
import type { ArtistPageData } from "@/lib/types";
import { getPublicCopy, type PublicLocale } from "@/lib/i18n/public";

export function PublicArtistContent({ artist }: { artist: ArtistPageData }) {
  const [locale, setLocale] = useState<PublicLocale>(artist.funnelSettings.defaultLanguage ?? "en");
  const copy = getPublicCopy(locale);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div
          className="inline-flex items-center gap-2 rounded-full border px-2 py-2"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor:
              "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
          }}
        >
          <span className="px-2 text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-card-muted)" }}>
            {copy.language}
          </span>
          {(["tr", "en"] as const).map((item) => {
            const active = locale === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setLocale(item)}
                className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition"
                style={{
                  backgroundColor: active ? "var(--artist-primary)" : "transparent",
                  color: active ? "var(--artist-primary-foreground)" : "var(--artist-card-text)",
                }}
              >
                {item.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      <PublicFunnel artist={artist} locale={locale} />
    </div>
  );
}
