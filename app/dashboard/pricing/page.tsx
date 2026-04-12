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
            ? "Tattix sadece ön tahmin yapar, son kararı her zaman sen verirsin."
            : "TatBot gives an initial estimate, but the final decision is always yours."
        }
      />
      <p className="-mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
        {isTurkish
          ? "Örneğin, 1,5 çarpanı seçersen o özellik seçildiğinde min-max fiyat 1,5 kat artar."
          : "For example, if you choose a 1.5 multiplier, the min-max price increases by 1.5x when that option is selected."}
      </p>
      <PricingForm
        pricingRules={data.pricingRules}
        styles={data.styleOptions}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
