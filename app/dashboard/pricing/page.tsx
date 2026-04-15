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
            ? "En basit iş için alacağın minimum ücreti gir."
            : "Set the opening price and complete calibration."
        }
      />
      <div className="-mt-2 max-w-2xl space-y-2 text-sm leading-6 text-[var(--foreground-muted)]">
        {isTurkish ? (
          <>
            <p>Tattix; boyut, detay, bölge ve renge göre fiyat önerisi oluşturur.</p>
            <p>Özel tasarım ve cover-up gibi durumlarda son fiyatı müşteriyle netleştirirsin.</p>
          </>
        ) : (
          <>
            <p>Tattix suggests pricing based on size, detail, placement, and color.</p>
            <p>You confirm the final price for custom design and cover-up after speaking with the client.</p>
          </>
        )}
      </div>
      <PricingForm
        pricingRules={data.pricingRules}
        styles={data.styleOptions}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
