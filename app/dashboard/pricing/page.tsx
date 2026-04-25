import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";

import { PricingForm } from "@/components/dashboard/pricing-form";
import { SectionHeading } from "@/components/shared/shell";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardPricingData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/pricing", { noIndex: true });

export default async function DashboardPricingPage() {
  noStore();

  const session = await getSupabaseSession();
  const data = await getDashboardPricingData(session?.user.id ?? null);
  const isTurkish = data.locale === "tr";

  return (
    <div className="space-y-3.5 xl:space-y-3">
      <SectionHeading
        eyebrow={undefined}
        title={
          isTurkish
            ? "Fiyat ayarları"
            : "Pricing settings"
        }
        description={
          isTurkish
            ? "Başlangıç fiyatlarını belirleyelim. Müşteriye gösterilecek fiyat tahmini, burada girdiğin değerlere göre oluşur."
            : "Set the starting price levels that shape the estimate shown to clients."
        }
      />
      {isTurkish ? (
        <p className="max-w-3xl text-[11.5px] leading-[1.4] text-[var(--text-muted)]">
          Bu bölüm doldurulmadığında müşteriler fiyat tahmini göremez.
        </p>
      ) : null}
      <PricingForm
        pricingRules={data.pricingRules}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
