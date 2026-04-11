import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DemoModeBanner } from "@/components/dashboard/demo-mode-banner";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { PublicRouteCard } from "@/components/dashboard/public-route-card";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
import { hasProAccess } from "@/lib/access";
import { getDashboardData } from "@/lib/data/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSupabaseSession();

  if (isSupabaseConfigured() && !session) {
    redirect("/login");
  }

  const dashboardData = await getDashboardData(session?.user.id ?? null);
  const isTurkish = dashboardData.funnelSettings.defaultLanguage === "tr";
  const isProActive = hasProAccess(dashboardData.profile);

  return (
    <AppShell>
      <Container className="py-4 sm:py-8">
        <div className="overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch]">
          <div className="min-w-[720px] xl:min-w-0">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Logo />
                <div className="flex items-center gap-2">
                  {dashboardData.demoMode ? <Badge variant="accent">Demo mode</Badge> : null}
                  <LogoutButton />
                </div>
              </div>
              <div className="w-full max-w-[460px] xl:w-auto xl:min-w-[360px]">
                <PublicRouteCard
                  slug={dashboardData.profile.slug}
                  locale={isTurkish ? "tr" : "en"}
                />
              </div>
            </div>

            <div className="mt-6 grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="max-w-[360px] space-y-4 xl:sticky xl:top-6 xl:max-w-none">
                {dashboardData.demoMode ? <DemoModeBanner /> : null}
                <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    {isTurkish ? "Panel" : "Dashboard"}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-white">
                    {dashboardData.profile.artistName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    {isTurkish
                      ? "Instagram biyondan açılan müşteri akışını ve sanatçı sayfanı buradan yönet."
                      : "Configure the public funnel clients open from your Instagram bio."}
                  </p>
                  <div className="mt-5">
                    <DashboardNav locale={isTurkish ? "tr" : "en"} hideProBadges={isProActive} />
                  </div>
                </div>
                {!isProActive ? (
                  <UpgradeCard
                    locale={isTurkish ? "tr" : "en"}
                    profile={dashboardData.profile}
                    compact
                  />
                ) : null}
              </aside>
              <main className="min-w-0 w-full max-w-[420px]">{children}</main>
            </div>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
