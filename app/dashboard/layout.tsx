import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/access";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardNotificationBell } from "@/components/dashboard/dashboard-notification-bell";
import { DemoModeBanner } from "@/components/dashboard/demo-mode-banner";
import { DashboardSupportCard } from "@/components/dashboard/dashboard-support-card";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { BrandIconLarge, BrandWordmark } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
import { hasProAccess } from "@/lib/access";
import { getDashboardShellData } from "@/lib/data/dashboard";
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

  const dashboardData = await getDashboardShellData(session?.user.id ?? null);
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
            <div className="mt-1 flex justify-end">
              <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-white/8 bg-[color:color-mix(in_srgb,var(--surface-1)_92%,black_8%)] p-2 shadow-[0_18px_38px_rgba(0,0,0,0.22)]">
                <DashboardNotificationBell
                  locale={isTurkish ? "tr" : "en"}
                  unreadCount={notificationUnreadCount}
                />
                <LogoutButton locale={isTurkish ? "tr" : "en"} />
              </div>
            </div>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10">
              <aside className="w-full max-w-none space-y-4 lg:sticky lg:top-6 lg:max-w-[252px]">
                {dashboardData.demoMode ? <DemoModeBanner /> : null}
                <div className="rounded-[30px] border border-[rgba(214,173,126,0.12)] bg-[linear-gradient(180deg,rgba(30,24,24,0.98),rgba(18,15,17,1))] p-4 shadow-[0_28px_64px_rgba(0,0,0,0.34)]">
                  <Link
                    href="/dashboard/profile"
                    className="block rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.04),_transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.12))] p-4"
                  >
                    <BrandIconLarge priority className="mx-auto w-[124px] sm:w-[140px] lg:w-[148px]" />
                    <BrandWordmark
                      className="mt-4 text-center"
                      subtitle="Tattoo lead & pricing workspace"
                    />
                  </Link>
                  <div className="mt-4 space-y-1 px-1">
                    <p className="text-base font-medium tracking-[-0.02em] text-white">
                      {dashboardData.profile.artistName}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                      @{dashboardData.profile.slug}
                    </p>
                  </div>
                  <div className="mt-5 rounded-[24px] border border-white/7 bg-white/[0.02] p-3">
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
                {dashboardData.demoMode ? <Badge variant="accent">Demo mode</Badge> : null}
                {children}
                <div className="mt-6 w-full max-w-none lg:max-w-none">
                  <DashboardSupportCard
                    locale={isTurkish ? "tr" : "en"}
                    artistName={dashboardData.profile.artistName}
                    accountEmail={session?.user.email ?? ""}
                  />
                </div>
              </main>
            </div>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
