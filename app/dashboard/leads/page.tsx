import { LeadsTable } from "@/components/dashboard/leads-table";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardLeadsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Leads"
        title="Review completed briefs and follow up with context."
        description="Each finished submission stores intent, placement, style, notes, and the estimate the client saw."
      />
      <LeadsTable leads={data.leads} currency={data.profile.currency} />
    </div>
  );
}
