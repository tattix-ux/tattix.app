"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { getAppOrigin } from "@/lib/config/site";
import { Button } from "@/components/ui/button";

export function PublicRouteCard({
  slug,
  locale = "en",
  variant = "full",
  className,
}: {
  slug: string;
  locale?: "en" | "tr";
  variant?: "full" | "summary" | "actions";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const fallbackHref = `/${slug}`;
  const publicHref = `${getAppOrigin()}${fallbackHref}`;

  async function copyLink() {
    await navigator.clipboard.writeText(publicHref);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const copyLabel = copied ? (locale === "tr" ? "Kopyalandı" : "Copied") : locale === "tr" ? "Kopyala" : "Copy";
  const openLabel = locale === "tr" ? "Profili aç" : "Open profile";
  const description =
    locale === "tr"
      ? "Müşteriler profil sayfana bu linkten ulaşır."
      : "Clients reach your profile page through this link.";

  if (variant === "actions") {
    return (
      <div className={className}>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" variant="outline" onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copyLabel}
          </Button>
          <Button type="button" size="sm" asChild>
            <a href={publicHref} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              {openLabel}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (variant === "summary") {
    return (
      <div className={className}>
        <div className="h-full rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(31,25,24,0.92),rgba(18,16,18,0.98))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
            {locale === "tr" ? "Profil linkin" : "Profile link"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>
          <div className="mt-4 space-y-3">
            <p className="truncate text-sm font-medium text-white">{publicHref}</p>
            <Button type="button" size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copyLabel}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="w-full rounded-[22px] border border-white/8 bg-black/20 p-4 sm:rounded-[24px] sm:p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
          {locale === "tr" ? "Profil Linkin" : "Profile link"}
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-[var(--foreground-muted)]">{description}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copyLabel}
            </Button>
            <Button type="button" size="sm" asChild>
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {openLabel}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
