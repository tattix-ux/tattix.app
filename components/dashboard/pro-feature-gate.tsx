import { LockKeyhole } from "lucide-react";

import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ArtistProfile } from "@/lib/types";

const copy = {
  en: {
    title: "Pro feature",
    description:
      "This area unlocks after manual Pro approval. Your existing profile, pricing, and submissions remain available.",
  },
  tr: {
    title: "Pro özellik",
    description:
      "Bu alan manuel Pro onayından sonra açılır. Profil, fiyatlama ve taleplerin kullanılmaya devam eder.",
  },
} as const;

export function ProFeatureGate({
  locale = "en",
  profile,
}: {
  locale?: "en" | "tr";
  profile: Pick<ArtistProfile, "planType" | "accessStatus">;
}) {
  const labels = copy[locale];

  return (
    <Card className="surface-border">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/6 p-2 text-white">
            <LockKeyhole className="size-4" />
          </div>
          <div>
            <CardTitle>{labels.title}</CardTitle>
            <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
              {labels.description}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UpgradeCard locale={locale} profile={profile} />
      </CardContent>
    </Card>
  );
}
