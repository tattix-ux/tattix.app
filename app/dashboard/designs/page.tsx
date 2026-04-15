import { FeaturedDesignsForm } from "@/components/dashboard/featured-designs-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { SectionHeading } from "@/components/shared/shell";
import { hasProAccess } from "@/lib/access";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardDesignsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Tasarımlar" : "Designs"}
        title={
          isTurkish
            ? "Flash ve indirimli tasarımlarını yönet."
            : "Manage flash and discounted concepts."
        }
        description={
          isTurkish
            ? "Yüklediğin tasarımlar, müşteri ilgili tasarım kategorisini seçtiğinde sanatçı sayfanda gösterilir."
            : "Uploaded designs appear on the artist page when the client chooses the matching design category."
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
