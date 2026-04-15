import { FunnelSettingsForm } from "@/components/dashboard/funnel-settings-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardFunnelPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Akış" : "Funnel"}
        title={
          isTurkish
            ? "Müşteri akışını ve çalıştığın stilleri düzenle."
            : "Tune the public flow and style availability."
        }
        description={
          isTurkish
            ? "Akışı hızlı, yönlendirici ve yapmak istediğin işlerle uyumlu tut."
            : "Keep the intake guided, fast, and aligned with the kind of work you want more of."
        }
      />
      <FunnelSettingsForm
        settings={data.funnelSettings}
        styles={data.styleOptions}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
