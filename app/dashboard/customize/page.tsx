import { CustomizePageForm } from "@/components/dashboard/customize-page-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { getDashboardCoreData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardCustomizePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardCoreData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Sayfa görünümü" : "Customize Page"}
        title={
          isTurkish
            ? "Sayfa görünümü"
            : "Page appearance"
        }
        description={
          isTurkish
            ? "Bir tema seç veya renkleri kendine göre düzenle."
            : "Pick a theme or adjust the colors to fit your style."
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
