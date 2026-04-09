import { FeaturedDesignsForm } from "@/components/dashboard/featured-designs-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardDesignsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Featured designs"
        title="Manage flash and discounted concepts."
        description="These uploaded designs only appear when the client selects a matching intent in the public flow."
      />
      <FeaturedDesignsForm
        designs={data.featuredDesigns}
        artistId={data.profile.id}
        demoMode={data.demoMode}
      />
    </div>
  );
}
