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
      <Container className="py-5 sm:py-9 lg:max-w-[1440px] 2xl:max-w-[1520px]">
        <div className="overflow-x-hidden pb-2">
          <div className="relative min-w-0">
            <div className="absolute right-0 top-0 z-20">
              <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[var(--border-soft)] bg-[color:color-mix(in_srgb,var(--surface-1)_94%,black_6%)] p-2 shadow-[0_14px_28px_rgba(0,0,0,0.2)]">
                <DashboardNotificationBell
                  locale={isTurkish ? "tr" : "en"}
                  unreadCount={notificationUnreadCount}
                />
                <LogoutButton locale={isTurkish ? "tr" : "en"} />
              </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8">
              <aside className="w-full max-w-none space-y-4 lg:sticky lg:top-6 lg:max-w-[236px]">
                {dashboardData.demoMode ? <DemoModeBanner /> : null}
                <div className="relative overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] px-4 py-5 shadow-[0_22px_48px_rgba(0,0,0,0.24)]">
                  <div className="space-y-6">
                    <Link href="/dashboard/profile" className="block text-center">
                      <div className="relative mx-auto size-[6.4rem] overflow-hidden rounded-full border border-[rgba(214,177,122,0.28)] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.05),rgba(255,255,255,0.012)_58%),linear-gradient(180deg,rgba(25,27,32,0.98),rgba(15,16,19,1))] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.28)]">
                        <Image
                          src="/brand/tattix-primary-logo.png"
                          alt=""
                          fill
                          priority
                          sizes="(max-width: 768px) 102px, 102px"
                          className="object-cover scale-[1.22]"
                        />
                      </div>
                      <BrandWordmark size="lg" className="mt-5 text-center" />
                    </Link>
                    <div className="rounded-[22px] border border-white/5 bg-white/[0.02] px-3 py-3.5">
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
                        <Badge variant="accent" className="mt-3 rounded-full px-3 py-1 text-[11px]">
                          {isTurkish ? "Pro Üye" : "Pro member"}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-5">
                    <DashboardNav
                      locale={isTurkish ? "tr" : "en"}
                      hideProBadges={isProActive}
                      showAdminMessages={showAdminMessages}
                      adminUnreadCount={adminUnreadCount}
                    />
                  </div>
                  <div className="mt-10 flex justify-center pt-4">
                    <div className="relative size-[78px] overflow-hidden rounded-full border border-[rgba(214,177,122,0.4)] bg-[radial-gradient(circle_at_50%_28%,rgba(214,177,122,0.1),rgba(255,255,255,0.012)_54%),linear-gradient(180deg,rgba(25,27,32,0.98),rgba(15,16,19,1))] shadow-[0_0_0_1px_rgba(255,255,255,0.035),0_18px_38px_rgba(0,0,0,0.28)]">
                      <Image
                        src="/brand/tattix-monogram.png"
                        alt=""
                        fill
                        sizes="78px"
                        className="object-contain scale-[1.14] opacity-[0.84]"
                      />
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
