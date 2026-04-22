import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/access";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardNotificationBell } from "@/components/dashboard/dashboard-notification-bell";
import { DemoModeBanner } from "@/components/dashboard/demo-mode-banner";
import { DashboardSupportCard } from "@/components/dashboard/dashboard-support-card";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { AvatarTile } from "@/components/shared/avatar-tile";
import { BrandWordmark } from "@/components/shared/logo";
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
      <Container className="py-3 sm:py-4 lg:max-w-[1360px] 2xl:max-w-[1420px]">
        <div className="overflow-x-hidden pb-2">
          <div className="min-w-0">
            <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6">
              <aside className="w-full max-w-none space-y-3 lg:sticky lg:top-4 lg:max-w-[220px]">
                {dashboardData.demoMode ? <DemoModeBanner /> : null}
                <div className="relative flex flex-col overflow-hidden rounded-[26px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] px-3.5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] lg:min-h-[calc(100vh-2rem)]">
                  <div className="space-y-5">
                    <Link href="/dashboard/profile" className="block text-center">
                      <div className="relative mx-auto size-[5.2rem] overflow-hidden rounded-full border border-[rgba(214,177,122,0.28)] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.05),rgba(255,255,255,0.012)_58%),linear-gradient(180deg,rgba(25,27,32,0.98),rgba(15,16,19,1))] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.24)]">
                        <Image
                          src="/brand/tattix-primary-logo.png"
                          alt=""
                          fill
                          priority
                          sizes="(max-width: 768px) 84px, 84px"
                          className="object-cover scale-[1.22]"
                        />
                      </div>
                      <BrandWordmark size="md" className="mt-4 text-center" />
                    </Link>
                    <div className="rounded-[20px] border border-white/5 bg-white/[0.02] px-3 py-3">
                      <div className="flex items-center gap-3">
                        <AvatarTile
                          name={dashboardData.profile.artistName}
                          imageUrl={dashboardData.profile.profileImageUrl}
                          size="sm"
                          planType={dashboardData.profile.planType}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-medium tracking-[-0.02em] text-white">
                            {dashboardData.profile.artistName}
                          </p>
                          <p className="truncate text-sm text-[var(--foreground-muted)]">
                            @{dashboardData.profile.slug}
                          </p>
                        </div>
                      </div>
                        {isProActive ? (
                        <Badge variant="accent" className="mt-2.5 rounded-full px-3 py-1 text-[10px]">
                          {isTurkish ? "Pro Üye" : "Pro member"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4">
                    <DashboardNav
                      locale={isTurkish ? "tr" : "en"}
                      hideProBadges={isProActive}
                      showAdminMessages={showAdminMessages}
                      adminUnreadCount={adminUnreadCount}
                    />
                  </div>
                  <div className="mt-auto border-t border-[var(--border-soft)] pt-3">
                    <div className="flex items-center gap-2">
                      <DashboardNotificationBell
                        locale={isTurkish ? "tr" : "en"}
                        unreadCount={notificationUnreadCount}
                        className="size-9 shrink-0 rounded-full"
                      />
                      <LogoutButton locale={isTurkish ? "tr" : "en"} className="flex-1 justify-center" />
                    </div>
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
                  <DashboardSupportCard locale={isTurkish ? "tr" : "en"} />
                </div>
              </main>
            </div>
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
