import { LeadsTable } from "@/components/dashboard/leads-table";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardLeadsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Talepler" : "Leads"}
        title={
          isTurkish
            ? "Tamamlanan brief’leri incele ve bağlamla geri dönüş yap."
            : "Review completed briefs and follow up with context."
        }
        description={
          isTurkish
            ? "Her tamamlanan talep; intent, yerleşim, stil, notlar ve müşterinin gördüğü tahminle birlikte saklanır."
            : "Each finished submission stores intent, placement, style, notes, and the estimate the client saw."
        }
      />
      <LeadsTable
        leads={data.leads}
        currency={data.profile.currency}
        designs={data.featuredDesigns}
        locale={isTurkish ? "tr" : "en"}
        hasPro={hasProAccess(data.profile)}
        profilePlan={{
          planType: data.profile.planType,
          accessStatus: data.profile.accessStatus,
        }}
      />
    </div>
  );
}
