import { CustomizePageForm } from "@/components/dashboard/customize-page-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardCustomizePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Customize Page"
        title="Style your public artist page without touching the funnel."
        description="Preset themes, curated fonts, safe color overrides, and a live preview help you personalize the page while keeping it readable."
      />
      <CustomizePageForm artist={data} theme={data.pageTheme} demoMode={data.demoMode} />
    </div>
  );
}
