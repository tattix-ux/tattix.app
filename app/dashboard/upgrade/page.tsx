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

function buildMailto({
  accountEmail,
  artistName,
  planType,
  requestedAt,
  slug,
}: {
  accountEmail: string;
  artistName: string;
  planType: "free" | "pro";
  requestedAt: string;
  slug: string;
}) {
  const subject = "Pro Access Request - TatBot";
  const body = [
    `Artist email: ${accountEmail}`,
    `Artist name: ${artistName}`,
    `Artist slug: ${slug}`,
    `Current plan: ${planType}`,
    `Request date: ${requestedAt}`,
  ].join("\n");

  return {
    href: `mailto:gizemoderr@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    body,
  };
}

export default async function DashboardUpgradePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardShellData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";
  const requestedAt = new Intl.DateTimeFormat(isTurkish ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date());
  const mailto = buildMailto({
    accountEmail: session?.user.email ?? "unknown",
    artistName: data.profile.artistName,
    slug: data.profile.slug,
    planType: data.profile.planType,
    requestedAt,
  });

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
              <CardTitle>{isTurkish ? "Pro ile açılanlar" : "What Pro unlocks"}</CardTitle>
              <CardDescription className="mt-1">
                {isTurkish
                  ? "Kısa bir talep maili hazırlıyoruz. Gönderdikten sonra manuel onayla hesabın yükseltilir."
                  : "We prepare a short access request email. Once sent, your account can be manually approved."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5 text-[13px] text-[var(--foreground-muted)]">
            <p>• {isTurkish ? "Talepleri görüntüleme" : "Request inbox access"}</p>
            <p>• {isTurkish ? "Gelişmiş analizler" : "Advanced analytics"}</p>
            <p>• {isTurkish ? "Premium özelleştirme seçenekleri" : "Premium customization options"}</p>
            <p>• {isTurkish ? "Yeni Pro araçlarına erişim" : "Access to new Pro tools"}</p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-black/20 p-3.5 text-[13px] text-[var(--foreground-muted)]">
            <p>{isTurkish ? "Hesap emaili" : "Account email"}: <span className="text-white">{session?.user.email ?? "-"}</span></p>
            <p className="mt-2">{isTurkish ? "Sanatçı adı" : "Artist name"}: <span className="text-white">{data.profile.artistName}</span></p>
            <p className="mt-2">{isTurkish ? "Sanatçı slug'ı" : "Artist slug"}: <span className="text-white">{data.profile.slug}</span></p>
            <p className="mt-2">{isTurkish ? "Mevcut plan" : "Current plan"}: <span className="text-white">{data.profile.planType}</span></p>
            <p className="mt-2">{isTurkish ? "Talep zamanı" : "Request time"}: <span className="text-white">{requestedAt}</span></p>
          </div>

          <div className="space-y-2.5">
            <ProRequestActions
              locale={isTurkish ? "tr" : "en"}
              mailtoHref={mailto.href}
              requestBody={mailto.body}
            />
            <p className="text-xs text-[var(--foreground-muted)]">
              {isTurkish
                ? ""
                : "If your mail app does not open, copy the request text and send it to gizemoderr@gmail.com."}
            </p>
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
