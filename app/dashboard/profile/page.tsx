import type { Metadata } from "next";
import { CalendarDays, Link2 } from "lucide-react";

import { isAdminEmail } from "@/lib/access";
import { AdminProAccessForm } from "@/components/dashboard/admin-pro-access-form";
import { ProfilePageContent } from "@/components/dashboard/profile-page-content";
import { PublicRouteCard } from "@/components/dashboard/public-route-card";
import { BrandPrimary } from "@/components/shared/logo";
import { SectionHeading } from "@/components/shared/shell";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/config/site";
import { getAppOrigin } from "@/lib/config/site";
import { getDashboardProfileData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/profile", { noIndex: true });

export default async function DashboardProfilePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardProfileData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";
  const showAdminControls =
    isAdminEmail(session?.user.email) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const cityCount = data.funnelSettings.bookingCities.length;
  const availableDateCount = data.funnelSettings.bookingCities.reduce(
    (total, city) => total + city.availableDates.length,
    0,
  );
  const publicHref = `${getAppOrigin()}/${data.profile.slug}`;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-8">
      <Card className="surface-border overflow-hidden border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)] shadow-[0_24px_56px_rgba(0,0,0,0.28)]">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div className="grid gap-4 md:grid-cols-[128px_minmax(0,1fr)] md:items-center">
              <BrandPrimary className="mx-auto w-[112px] md:mx-0 md:w-[128px]" priority />
              <div className="space-y-3">
                <SectionHeading
                  eyebrow={isTurkish ? "Profil" : "Profile"}
                  title={isTurkish ? "Profilin" : "Your profile"}
                  description={
                    isTurkish
                      ? "Profil bilgilerini, iletişim detaylarını ve uygunluk durumunu buradan yönet."
                      : "Manage your profile details, contact information, and availability here."
                  }
                />
              </div>
            </div>
            <PublicRouteCard
              slug={data.profile.slug}
              locale={isTurkish ? "tr" : "en"}
              variant="actions"
              className="shrink-0 xl:pt-4"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2.5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                    {isTurkish ? "Profil linki" : "Profile link"}
                  </p>
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{publicHref}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isTurkish
                      ? "Müşteriler profil sayfana bu linkten ulaşır."
                      : "Clients reach your profile through this link."}
                  </p>
                </div>
                <div className="inline-flex size-11 items-center justify-center rounded-[16px] border border-[var(--border-soft)] bg-white/[0.03] text-[var(--text-muted)]">
                  <Link2 className="size-4" />
                </div>
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--border-soft)] bg-white/[0.03] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2.5">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                    {isTurkish ? "Randevu özeti" : "Booking overview"}
                  </p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {cityCount === 0
                      ? isTurkish
                        ? "Henüz şehir eklenmedi"
                        : "No cities added yet"
                      : isTurkish
                        ? `${cityCount} şehir, ${availableDateCount} uygun gün`
                        : `${cityCount} cities, ${availableDateCount} available days`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {cityCount === 0
                      ? isTurkish
                        ? "Müsait olduğun şehirleri ve günleri ekleyebilirsin."
                        : "Add the cities and dates where you are available."
                      : isTurkish
                        ? "Şehir ve müsaitlik bilgilerin profilde gösterilir."
                        : "Your city and availability details appear on the profile."}
                  </p>
                </div>
                <div className="inline-flex size-11 items-center justify-center rounded-[16px] border border-[var(--border-soft)] bg-white/[0.03] text-[var(--text-muted)]">
                  <CalendarDays className="size-4" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <ProfilePageContent
        profile={data.profile}
        pageTheme={data.pageTheme}
        funnelSettings={data.funnelSettings}
        styleOptions={data.styleOptions}
        demoMode={data.demoMode}
        locale={data.funnelSettings.defaultLanguage}
      />
      {showAdminControls ? (
        <AdminProAccessForm
          locale={data.funnelSettings.defaultLanguage}
          defaultSlug={data.profile.slug}
        />
      ) : null}
    </div>
  );
}
