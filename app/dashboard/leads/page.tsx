import type { Metadata } from "next";

import { LeadsTable } from "@/components/dashboard/leads-table";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";

export const metadata: Metadata = buildPageMetadata("/dashboard/leads", { noIndex: true });

export default async function DashboardLeadsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";
  const hasPro = hasProAccess(data.profile);

  return (
    <div className="space-y-3.5 xl:space-y-3">
      <SectionHeading
        title={isTurkish ? "Talepler" : "Requests"}
        description={
          isTurkish
            ? "Gelen talepleri görüntüle, filtrele ve durumlarını güncelle."
            : "View incoming requests, filter them, and update their statuses."
        }
      />
      {hasPro ? (
        <LeadsTable
          leads={data.leads}
          currency={data.profile.currency}
          designs={data.featuredDesigns}
          locale={isTurkish ? "tr" : "en"}
          hasPro={hasPro}
          profilePlan={{
            planType: data.profile.planType,
            accessStatus: data.profile.accessStatus,
          }}
        />
      ) : (
        <ProFeatureGate locale={isTurkish ? "tr" : "en"} profile={data.profile} />
      )}
    </div>
  );
}
