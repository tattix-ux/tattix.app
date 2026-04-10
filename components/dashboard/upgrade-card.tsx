"use client";

import { useState } from "react";
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
      "Customize Page and design management stay available after manual Pro approval.",
    cta: "Upgrade",
    contact: "Contact for Pro access",
    activeMessage: "Pro access is active for this account.",
  },
  tr: {
    free: "Ücretsiz plan",
    pro: "Pro plan",
    active: "Aktif",
    pending: "Onay bekliyor",
    blocked: "Engellendi",
    title: "Pro araçlarını aç",
    description:
      "Sayfa Özelleştir ve tasarım yönetimi alanları manuel Pro onayından sonra açılır.",
    cta: "Yükselt",
    contact: "Pro erişimi için iletişime geç",
    activeMessage: "Bu hesap için Pro erişim aktif.",
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
  const [showContact, setShowContact] = useState(profile.planType !== "pro");
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
          <Button type="button" className="w-full sm:w-auto" onClick={() => setShowContact(true)}>
            {labels.cta}
          </Button>
          {showContact ? (
            <p className="text-sm text-[var(--accent-soft)]">{labels.contact}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
