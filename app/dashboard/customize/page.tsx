import type { Metadata } from "next";

import { CustomizePageForm } from "@/components/dashboard/customize-page-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardCustomizeData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/customize", { noIndex: true });

export default async function DashboardCustomizePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardCustomizeData(session?.user.id ?? null);
  const isTurkish = data.locale === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "GÖRÜNÜM" : "APPEARANCE"}
        title={isTurkish ? "Müşterinin Gördüğü Görünüm" : "Customer-Facing Appearance"}
        description={
          isTurkish
            ? "Müşterilerin profil sayfanı nasıl gördüğünü burada ayarlarsın. Hazır bir görünüm seçebilir ya da kendi görünümünü oluşturabilirsin."
            : "Control how clients see your profile page. Choose a ready-made look or build your own."
        }
      />
      {hasProAccess(data.profile) ? (
        <CustomizePageForm
          artist={{
            profile: data.profile,
            funnelSettings: data.funnelSettings,
          }}
          theme={data.pageTheme}
          savedThemes={data.savedThemes}
          demoMode={data.demoMode}
          locale={isTurkish ? "tr" : "en"}
        />
      ) : (
        <ProFeatureGate locale={isTurkish ? "tr" : "en"} profile={data.profile} />
      )}
    </div>
  );
}
