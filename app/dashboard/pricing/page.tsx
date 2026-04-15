import { PricingForm } from "@/components/dashboard/pricing-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardPricingPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Fiyatlama" : "Pricing"}
        title={
          isTurkish
            ? "Fiyat aralığını sen belirle."
            : "Set the price range yourself."
        }
        description={
          isTurkish
            ? "Açılış fiyatını belirle ve kalibrasyonu tamamla."
            : "Set the opening price and complete calibration."
        }
      />
      <p className="-mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
        {isTurkish
          ? "Tattix fiyatı boyut, detay, bölge ve renge göre kalibre eder. Özel tasarım ve cover-up işlemlerini müşteri ile görüşünce fiyatlandırırsın."
          : "Tattix calibrates quotes from size, detail, placement, and color. You price custom design and cover-up after speaking with the client."}
      </p>
      <PricingForm
        pricingRules={data.pricingRules}
        styles={data.styleOptions}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
