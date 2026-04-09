import { PricingForm } from "@/components/dashboard/pricing-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardPricingPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Pricing"
        title="Set predictable ranges without killing the consultation."
        description="TatBot estimates stay rule-based, while still leaving room for final adjustments after you review the brief."
      />
      <PricingForm pricingRules={data.pricingRules} styles={data.styleOptions} />
    </div>
  );
}
