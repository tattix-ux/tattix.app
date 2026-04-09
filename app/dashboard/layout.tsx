import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DemoModeBanner } from "@/components/dashboard/demo-mode-banner";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { Badge } from "@/components/ui/badge";
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

  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <div className="flex items-center gap-2">
              {dashboardData.demoMode ? <Badge variant="accent">Demo mode</Badge> : null}
              <LogoutButton />
            </div>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-[var(--foreground-muted)]">
            Public route: /{dashboardData.profile.slug}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            {dashboardData.demoMode ? <DemoModeBanner /> : null}
            <div className="rounded-[28px] border border-white/8 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                Dashboard
              </p>
              <h2 className="mt-2 font-display text-3xl text-white">
                {dashboardData.profile.artistName}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                Configure the public funnel clients open from your Instagram bio.
              </p>
              <div className="mt-5">
                <DashboardNav />
              </div>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </Container>
    </AppShell>
  );
}
