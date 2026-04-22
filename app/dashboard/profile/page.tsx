import type { Metadata } from "next";

import { isAdminEmail } from "@/lib/access";
import { AdminProAccessForm } from "@/components/dashboard/admin-pro-access-form";
import { ProfilePageContent } from "@/components/dashboard/profile-page-content";
import { PublicRouteCard } from "@/components/dashboard/public-route-card";
import { SectionHeading } from "@/components/shared/shell";
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

  return (
    <div className="mx-auto w-full max-w-[1220px] space-y-5 2xl:max-w-[1280px]">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start xl:gap-5">
        <SectionHeading
          eyebrow={isTurkish ? "Profil" : "Profile"}
          title={isTurkish ? "Profilin" : "Your profile"}
          description={
            isTurkish
              ? "Profil bilgilerini, iletişim detaylarını ve uygunluk durumunu buradan yönet."
              : "Manage your profile details, contact information, and availability here."
          }
        />
        <PublicRouteCard
          slug={data.profile.slug}
          locale={isTurkish ? "tr" : "en"}
          variant="actions"
          className="shrink-0"
        />
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
