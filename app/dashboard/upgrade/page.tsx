import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { ProRequestActions } from "@/components/dashboard/pro-request-actions";
import { SectionHeading } from "@/components/shared/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardShellData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/upgrade", { noIndex: true });

export default async function DashboardUpgradePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardShellData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-3.5 xl:space-y-3">
      <SectionHeading
        eyebrow={isTurkish ? "Pro erişim" : "Pro access"}
        title={
          isTurkish
            ? "Pro erişim talebini birkaç saniyede gönder."
            : "Request Pro access in just a few seconds."
        }
        description={
          isTurkish
            ? "Pro ile talepleri görüntüleyebilir, gelişmiş analizleri açabilir ve premium özelleştirme araçlarını kullanabilirsin."
            : "With Pro, you can unlock requests, advanced analytics, and premium customization tools."
        }
      />

      <Card className="surface-border">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/12 p-2 text-[var(--accent)]">
              <Sparkles className="size-4" />
            </div>
            <div>
              <CardTitle>{isTurkish ? "Pro'ya geç" : "Upgrade to Pro"}</CardTitle>
              <CardDescription className="mt-1">
                {isTurkish
                  ? "Talepler, tasarım portföy yönetimi ve Pro’ya özel araçların kilidini aç."
                  : "Unlock requests, design portfolio management, and the tools reserved for Pro artists."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5 text-[13px] text-[var(--foreground-muted)]">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
              {isTurkish ? "Pro plan neler sağlar?" : "What Pro includes"}
            </p>
            <p>• {isTurkish ? "Talepleri görüntüleme" : "Request inbox access"}</p>
            <p>• {isTurkish ? "Özgün tasarımlarını vitrinde gösterme" : "Show your original designs on your page"}</p>
            <p>• {isTurkish ? "Premium özelleştirme seçenekleri" : "Premium customization options"}</p>
            <p>• {isTurkish ? "Yeni Pro araçlarına erişim" : "Access to new Pro tools"}</p>
          </div>

          <div className="space-y-2.5">
            <ProRequestActions locale={isTurkish ? "tr" : "en"} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard/profile">
                {isTurkish ? "Panele geri dön" : "Back to dashboard"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
