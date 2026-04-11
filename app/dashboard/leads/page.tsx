import { LeadsTable } from "@/components/dashboard/leads-table";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";

export default async function DashboardLeadsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";
  const hasPro = hasProAccess(data.profile);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Talepler" : "Requests"}
        title={
          isTurkish
            ? "Tamamlanan talepleri tek yerde incele ve takip et."
            : "Review completed requests and follow up with context."
        }
        description={
          isTurkish
            ? "Her tamamlanan talep; intent, yerleşim, stil, notlar ve müşterinin gördüğü tahminle birlikte saklanır."
            : "Each finished request stores intent, placement, style, notes, and the estimate the client saw."
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
