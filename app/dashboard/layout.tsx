import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/access";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardNotificationBell } from "@/components/dashboard/dashboard-notification-bell";
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
import { getUnreadArtistNotificationCount, getUnreadSupportMessageCount } from "@/lib/support";

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
  const adminUnreadCount =
    showAdminMessages && !dashboardData.demoMode ? await getUnreadSupportMessageCount() : 0;
  const notificationUnreadCount = !dashboardData.demoMode
    ? await getUnreadArtistNotificationCount(dashboardData.profile.id)
    : 0;

  return (
    <AppShell>
      <Container className="py-4 sm:py-8 lg:max-w-[1440px] 2xl:max-w-[1520px]">
        <div className="overflow-x-hidden pb-2">
          <div className="min-w-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Logo className="min-w-0" />
                  <DashboardNotificationBell
                    locale={isTurkish ? "tr" : "en"}
                    unreadCount={notificationUnreadCount}
                  />
                  <div className="flex shrink-0 items-center">
                    <LogoutButton />
                  </div>
                </div>
                {dashboardData.demoMode ? <Badge variant="accent">Demo mode</Badge> : null}
              </div>
              <div className="w-full max-w-none lg:w-full lg:max-w-none">
                <PublicRouteCard
                  slug={dashboardData.profile.slug}
                  locale={isTurkish ? "tr" : "en"}
                />
              </div>
            </div>

            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-9">
              <aside className="w-full max-w-none space-y-4 lg:sticky lg:top-6 lg:max-w-[230px]">
                {dashboardData.demoMode ? <DemoModeBanner /> : null}
                <div className="rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(32,34,39,0.96),rgba(20,22,27,0.98))] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.26)]">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    {isTurkish ? "Panel" : "Dashboard"}
                  </p>
                  <h2 className="mt-2 font-display text-[2rem] font-semibold tracking-[-0.04em] text-white">
                    {dashboardData.profile.artistName}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    {isTurkish
                      ? "Instagram bio linkinden açılan talep ekranını ve sanatçı sayfanı buradan yönet."
                      : "Manage the request flow and artist page clients open from your Instagram bio."}
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
              <main className="min-w-0 w-full max-w-none lg:w-full lg:max-w-none lg:justify-self-stretch">
                {children}
              </main>
            </div>

            <div className="mt-6 w-full max-w-none lg:max-w-none">
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
