import { CustomizePageForm } from "@/components/dashboard/customize-page-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardCustomizePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Sayfa görünümü" : "Customize Page"}
        title={
          isTurkish
            ? "Sanatçı sayfanın görünümünü seç."
            : "Choose how your public artist page looks."
        }
        description={
          isTurkish
            ? "Hazır tema seç ya da kendi stilini oluştur."
            : "Pick a preset theme or build your own style."
        }
      />
      {hasProAccess(data.profile) ? (
        <CustomizePageForm
          artist={data}
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
