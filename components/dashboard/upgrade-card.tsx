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
    title: "Pro'ya geç",
    description:
      "Talepler, tasarım portföy yönetimi ve Pro’ya özel araçların kilidini aç.",
    cta: "Pro'ya geç",
    activeMessage: "Bu hesap için Pro erişim aktif.",
    featuresTitle: "Pro plan neler sağlar?",
    features: [
      "Gelen tüm talepleri gör ve yönet",
      "Sayfanı kendi tarzına göre düzenle",
      "Tasarımlarını öne çıkar ve kontrol et",
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
          ? "rounded-[20px] border border-white/8 bg-white/4 p-3.5"
          : "rounded-[24px] border border-white/8 bg-white/4 p-4"
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

      <div className="mt-3.5 flex items-start gap-3">
        <div className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/12 p-2 text-[var(--accent)]">
          {hasActivePro ? <Sparkles className="size-4" /> : <Crown className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-white">{labels.title}</h3>
          <p className="mt-1 text-[13px] leading-5 text-[var(--foreground-muted)]">
            {hasActivePro ? labels.activeMessage : labels.description}
          </p>
        </div>
      </div>

      {!hasActivePro ? (
        <div className="mt-3.5 space-y-2.5">
          <div className="rounded-[18px] border border-white/8 bg-black/20 p-3.5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              {labels.featuresTitle}
            </p>
            <div className="mt-2.5 space-y-1.5 text-[13px] text-[var(--foreground-muted)]">
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
