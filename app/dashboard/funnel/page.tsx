import { FunnelSettingsForm } from "@/components/dashboard/funnel-settings-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardFunnelPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Funnel"
        title="Tune the public flow and style availability."
        description="Keep the intake guided, fast, and aligned with the kind of work you want more of."
      />
      <FunnelSettingsForm settings={data.funnelSettings} styles={data.styleOptions} />
    </div>
  );
}
