"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArtistProfile } from "@/lib/types";

const copy = {
  en: {
    free: "Free plan",
    pro: "Pro plan",
    active: "Active",
    pending: "Pending approval",
    blocked: "Blocked",
    title: "Unlock Pro tools",
    description:
      "Unlock requests, analytics, advanced page styling, design management, and the premium tools reserved for Pro artists.",
    cta: "Upgrade to Pro",
    activeMessage: "Pro access is active for this account.",
    featuresTitle: "Pro includes",
    features: [
      "Request inbox access",
      "Analytics and conversion tracking",
      "Advanced page customization",
      "Design management",
      "Premium creative tools as they ship",
    ],
  },
  tr: {
    free: "Ücretsiz plan",
    pro: "Pro plan",
    active: "Aktif",
    pending: "Onay bekliyor",
    blocked: "Engellendi",
    title: "Pro araçlarını aç",
    description:
      "Talepler, gelişmiş analizler, tasarım yönetimi ve Pro’ya özel araçların kilidini aç.",
    cta: "Pro'ya yükselt",
    activeMessage: "Bu hesap için Pro erişim aktif.",
    featuresTitle: "Pro neleri açar?",
    features: [
      "Talep kutusunu görüntüleme",
      "Analitik ve dönüşüm takibi",
      "Gelişmiş sayfa özelleştirme",
      "Tasarım yönetimi",
    ],
  },
} as const;

export function UpgradeCard({
  locale = "en",
  profile,
  compact = false,
}: {
  locale?: "en" | "tr";
  profile: Pick<ArtistProfile, "planType" | "accessStatus">;
  compact?: boolean;
}) {
  const labels = copy[locale];
  const hasActivePro = profile.planType === "pro" && profile.accessStatus === "active";

  return (
    <div
      className={
        compact
          ? "rounded-[24px] border border-white/8 bg-white/4 p-4"
          : "rounded-[28px] border border-white/8 bg-white/4 p-5"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">
          {profile.planType === "pro" ? labels.pro : labels.free}
        </Badge>
        <Badge variant={hasActivePro ? "accent" : "muted"}>
          {labels[profile.accessStatus]}
        </Badge>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <div className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/12 p-2 text-[var(--accent)]">
          {hasActivePro ? <Sparkles className="size-4" /> : <Crown className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white">{labels.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
            {hasActivePro ? labels.activeMessage : labels.description}
          </p>
        </div>
      </div>

      {!hasActivePro ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              {labels.featuresTitle}
            </p>
            <div className="mt-3 space-y-2 text-sm text-[var(--foreground-muted)]">
              {labels.features.map((item) => (
                <p key={item}>• {item}</p>
              ))}
            </div>
          </div>
          <Button asChild type="button" className="w-full sm:w-auto">
            <Link href="/dashboard/upgrade">{labels.cta}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
