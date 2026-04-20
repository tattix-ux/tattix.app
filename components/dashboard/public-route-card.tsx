"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicRouteCard({
  slug,
  locale = "en",
}: {
  slug: string;
  locale?: "en" | "tr";
}) {
  const [copied, setCopied] = useState(false);
  const fallbackHref = `/${slug}`;

  async function copyLink() {
    const value =
      typeof window !== "undefined"
        ? new URL(fallbackHref, window.location.origin).toString()
        : fallbackHref;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="w-full rounded-[22px] border border-white/8 bg-black/20 p-4 sm:rounded-[24px] sm:p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
        {locale === "tr" ? "Profil linkin" : "Profile link"}
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{fallbackHref}</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {locale === "tr"
              ? "Bu link, müşteriyi doğrudan profil sayfana götürür."
              : "This link takes clients directly to your profile page."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? (locale === "tr" ? "Kopyalandı" : "Copied") : locale === "tr" ? "Kopyala" : "Copy"}
          </Button>
          <Button type="button" size="sm" asChild>
            <a href={fallbackHref} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              {locale === "tr" ? "Profili aç" : "Open profile"}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
