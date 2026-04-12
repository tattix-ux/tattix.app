import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/access";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DemoModeBanner } from "@/components/dashboard/demo-mode-banner";
import { DashboardSupportCard } from "@/components/dashboard/dashboard-support-card";
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
import { getUnreadSupportMessageCount } from "@/lib/support";

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
  const showAdminMessages = isAdminEmail(session?.user.email);
  const adminUnreadCount = showAdminMessages ? await getUnreadSupportMessageCount() : 0;

  return (
    <AppShell>
      <Container className="py-4 sm:py-8">
        <div className="overflow-x-hidden pb-2">
          <div className="min-w-0">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Logo className="min-w-0" />
                  <div className="flex shrink-0 items-center">
                    <LogoutButton />
                  </div>
                </div>
                {dashboardData.demoMode ? <Badge variant="accent">Demo mode</Badge> : null}
              </div>
              <div className="w-full max-w-[356px] xl:w-auto xl:min-w-[420px] xl:max-w-[420px]">
                <PublicRouteCard
                  slug={dashboardData.profile.slug}
                  locale={isTurkish ? "tr" : "en"}
                />
              </div>
            </div>

            <div className="mt-6 grid items-start gap-4 xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-6">
              <aside className="max-w-[356px] space-y-4 xl:sticky xl:top-6 xl:max-w-none">
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
                      ? "Instagram profilindeki linkten açılan müşteri akışını ve sanatçı sayfanı buradan yönet."
                      : "Configure the public funnel clients open from your Instagram bio."}
                  </p>
                  <div className="mt-5">
                    <DashboardNav
                      locale={isTurkish ? "tr" : "en"}
                      hideProBadges={isProActive}
                      showAdminMessages={showAdminMessages}
                      adminUnreadCount={adminUnreadCount}
                    />
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
              <main className="min-w-0 w-full max-w-[356px] xl:max-w-[960px] 2xl:max-w-[1120px]">
                {children}
              </main>
            </div>

            <div className="mt-6 max-w-[356px] xl:max-w-[960px] 2xl:max-w-[1120px]">
              <DashboardSupportCard
                locale={isTurkish ? "tr" : "en"}
                artistName={dashboardData.profile.artistName}
                accountEmail={session?.user.email ?? ""}
              />
            </div>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
