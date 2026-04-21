import type { Metadata } from "next";

import { isAdminEmail } from "@/lib/access";
import { AdminProAccessForm } from "@/components/dashboard/admin-pro-access-form";
import { ProfilePageContent } from "@/components/dashboard/profile-page-content";
import { PublicRouteCard } from "@/components/dashboard/public-route-card";
import { SectionHeading } from "@/components/shared/shell";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/config/site";
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

      <div className="grid gap-4 lg:grid-cols-3">
        <PublicRouteCard
          slug={data.profile.slug}
          locale={isTurkish ? "tr" : "en"}
          variant="summary"
        />
        <Card className="surface-border border-white/8 bg-[linear-gradient(180deg,rgba(31,25,24,0.92),rgba(18,16,18,0.98))] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          <CardContent className="space-y-3 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              {isTurkish ? "Durum" : "Status"}
            </p>
            <p className="text-xl font-semibold tracking-[-0.02em] text-white">
              {missingCount === 0
                ? isTurkish
                  ? "Profil yayında"
                  : "Profile live"
                : isTurkish
                  ? `${missingCount} alan eksik`
                  : `${missingCount} fields missing`}
            </p>
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              {missingCount === 0
                ? isTurkish
                  ? "Temel profil bilgilerin tamamlandı."
                  : "Your key profile details are complete."
                : isTurkish
                  ? "Profil kartını tamamlamak için eksik bilgileri doldur."
                  : "Complete the missing details to strengthen your profile."}
            </p>
          </CardContent>
        </Card>
        <Card className="surface-border border-white/8 bg-[linear-gradient(180deg,rgba(31,25,24,0.92),rgba(18,16,18,0.98))] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          <CardContent className="space-y-3 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              {isTurkish ? "Randevu özeti" : "Booking overview"}
            </p>
            <p className="text-xl font-semibold tracking-[-0.02em] text-white">
              {cityCount === 0
                ? isTurkish
                  ? "Henüz şehir yok"
                  : "No cities yet"
                : isTurkish
                  ? `${cityCount} şehir açık`
                  : `${cityCount} cities active`}
            </p>
            <p className="text-sm leading-6 text-[var(--foreground-muted)]">
              {cityCount === 0
                ? isTurkish
                  ? "Müsait olduğun şehirleri ve günleri ekleyebilirsin."
                  : "Add the cities and dates where you are available."
                : isTurkish
                  ? `${availableDateCount} uygun gün seçili.`
                  : `${availableDateCount} available dates selected.`}
            </p>
          </CardContent>
        </Card>
      </div>
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
