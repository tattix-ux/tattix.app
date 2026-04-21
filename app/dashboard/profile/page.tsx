import type { Metadata } from "next";

import { isAdminEmail } from "@/lib/access";
import { AdminProAccessForm } from "@/components/dashboard/admin-pro-access-form";
import { ProfilePageContent } from "@/components/dashboard/profile-page-content";
import { PublicRouteCard } from "@/components/dashboard/public-route-card";
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
  const missingCount = [
    data.profile.profileImageUrl,
    data.profile.shortBio.trim(),
    data.profile.whatsappNumber.trim(),
    data.profile.instagramHandle.trim(),
  ].filter((value) => !value).length;
  const cityCount = data.funnelSettings.bookingCities.length;
  const availableDateCount = data.funnelSettings.bookingCities.reduce(
    (total, city) => total + city.availableDates.length,
    0,
  );
  const completionPercent = Math.max(20, Math.round(((4 - missingCount) / 4) * 100));
  const publicHref = `${getAppOrigin()}/${data.profile.slug}`;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
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
        <PublicRouteCard
          slug={data.profile.slug}
          locale={isTurkish ? "tr" : "en"}
          variant="actions"
          className="shrink-0"
        />
      </div>

      <Card className="surface-border overflow-hidden border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,var(--bg-section)_100%)]">
        <CardContent className="p-0">
          <div className="grid divide-y divide-[var(--border-soft)] md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="space-y-2 px-5 py-4">
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

            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-dim)]">
                  {isTurkish ? "Profil durumu" : "Profile status"}
                </p>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  %{completionPercent}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent)_0%,var(--accent-hover)_100%)]"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {missingCount === 0
                  ? isTurkish
                    ? "Profilin yayında ve temel alanlar tamam."
                    : "Your profile is live and the core fields are complete."
                  : isTurkish
                    ? `${missingCount} alan eksik. Tamamladığında profil daha güçlü görünür.`
                    : `${missingCount} fields are missing. Completing them will strengthen your profile.`}
              </p>
            </div>

            <div className="space-y-2 px-5 py-4">
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
