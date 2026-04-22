import type { Metadata } from "next";

import { PricingForm } from "@/components/dashboard/pricing-form";
import { SectionHeading } from "@/components/shared/shell";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardPricingData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/pricing", { noIndex: true });

export default async function DashboardPricingPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardPricingData(session?.user.id ?? null);
  const isTurkish = data.locale === "tr";

  return (
    <div className="space-y-4">
      <SectionHeading
        eyebrow={isTurkish ? "Fiyatlama" : "Pricing"}
        title={
          isTurkish
            ? "Başlangıç fiyatlarını belirleyelim."
            : "Let’s shape the starting prices together."
        }
        description={
          isTurkish
            ? "Müşteriye gösterilecek fiyat tahmini, burada girdiğin değerlere göre oluşur."
            : "The system adapts its starting estimates to the way you usually price your work."
        }
      />
      <PricingForm
        pricingRules={data.pricingRules}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
