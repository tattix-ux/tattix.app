import { FeaturedDesignsForm } from "@/components/dashboard/featured-designs-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { getDashboardCoreData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardDesignsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardCoreData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Tasarımlar" : "Designs"}
        title={
          isTurkish
            ? "Müşteriye göstereceğin tasarımları yönet."
            : "Manage the designs clients can see."
        }
        description={
          isTurkish
            ? "Buraya eklediğin tasarımlar, müşteri seçim ekranında gösterilir ve doğrudan talep oluşturmaya yardımcı olur."
            : "Designs added here appear in the client selection flow and support direct requests."
        }
      />
      {hasProAccess(data.profile) ? (
        <FeaturedDesignsForm
          designs={data.featuredDesigns}
          artistId={data.profile.id}
          demoMode={data.demoMode}
          locale={isTurkish ? "tr" : "en"}
        />
      ) : (
        <ProFeatureGate locale={isTurkish ? "tr" : "en"} profile={data.profile} />
      )}
    </div>
  );
}
