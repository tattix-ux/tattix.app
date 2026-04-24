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
      <Container className="py-1 sm:py-1.5 lg:max-w-[1640px] xl:py-1.5 2xl:max-w-[1720px]">
        <div className="overflow-x-hidden pb-1 xl:pb-0">
          <div className="min-w-0">
            <div className="grid items-start gap-2.5 lg:grid-cols-[154px_minmax(0,1fr)] xl:gap-3">
              <aside className="w-full max-w-none space-y-2 lg:sticky lg:top-1.5 lg:max-w-[154px]">
                {dashboardData.demoMode ? <DemoModeBanner /> : null}
                <div className="relative flex flex-col overflow-hidden rounded-[18px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] px-2 py-2 shadow-[0_14px_28px_rgba(0,0,0,0.18)] lg:min-h-[calc(100vh-0.75rem)]">
                  <div className="space-y-2.5">
                    <Link href="/dashboard/profile" className="block text-center">
                      <div className="relative mx-auto size-[2.8rem] overflow-hidden rounded-full border border-[rgba(214,177,122,0.22)] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.04),rgba(255,255,255,0.01)_58%),linear-gradient(180deg,rgba(25,27,32,0.98),rgba(15,16,19,1))] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_18px_rgba(0,0,0,0.2)]">
                        <Image
                          src="/brand/tattix-primary-logo.png"
                          alt=""
                          fill
                          priority
                          sizes="(max-width: 768px) 44px, 44px"
                          className="object-cover scale-[1.22]"
                        />
                      </div>
                      <BrandWordmark size="sm" className="mt-2 text-center text-[0.9rem] tracking-[0.32em]" />
                    </Link>
                    <div className="rounded-[13px] border border-white/5 bg-white/[0.02] px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <AvatarTile
                          name={dashboardData.profile.artistName}
                          imageUrl={dashboardData.profile.profileImageUrl}
                          size="sm"
                          planType={dashboardData.profile.planType}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium tracking-[-0.02em] text-white">
                            {dashboardData.profile.artistName}
                          </p>
                          <p className="truncate text-[10px] text-[var(--foreground-muted)]">
                            @{dashboardData.profile.slug}
                          </p>
                        </div>
                      </div>
                      {isProActive ? (
                        <Badge variant="accent" className="mt-1 rounded-full px-2 py-0.5 text-[8.5px]">
                          {isTurkish ? "Pro Üye" : "Pro member"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <DashboardNav
                      locale={isTurkish ? "tr" : "en"}
                      hideProBadges={isProActive}
                      showAdminMessages={showAdminMessages}
                      adminUnreadCount={adminUnreadCount}
                    />
                  </div>
                  <div className="mt-auto border-t border-[var(--border-soft)] pt-2">
                    <div className="flex items-center gap-1.5">
                      <DashboardNotificationBell
                        locale={isTurkish ? "tr" : "en"}
                        unreadCount={notificationUnreadCount}
                        className="size-[34px] shrink-0 rounded-full"
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
              <main className="min-w-0 w-full max-w-none pt-1.5 lg:w-full lg:max-w-none lg:justify-self-stretch xl:pt-2">
                {dashboardData.demoMode ? <Badge variant="accent">Demo mode</Badge> : null}
                {children}
                <div className="mt-4 w-full max-w-none lg:max-w-none">
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
