import { Info } from "lucide-react";

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
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {isTurkish
                ? "Sana özel fiyat aralıklarını belirle."
                : "Set predictable price ranges for your studio."}
            </span>
            <div
              className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--foreground-muted)]"
              title={
                isTurkish
                  ? "Çarpanlar min-max fiyat aralığını etkiler. Örneğin 1,5 çarpanı seçilirse o alanın min ve max fiyatı 1,5 ile çarpılır."
                  : "Multipliers affect the min-max price range. For example, a 1.5 multiplier multiplies both the minimum and maximum price."
              }
            >
              <Info className="size-4" />
            </div>
          </div>
        }
        description={
          isTurkish
            ? "Tattix tahminleri kural bazlı kalır; sen brief’i gördükten sonra yine son dokunuşları yapabilirsin."
            : "Tattix estimates stay rule-based, while still leaving room for final adjustments after you review the brief."
        }
      />
      <p className="-mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
        {isTurkish
          ? "Bilgi notu: Bir çarpan 1,5 ise ilgili alanın min-max fiyat aralığı 1,5 ile çarpılır."
          : "Note: If a multiplier is 1.5, the related min-max price range is multiplied by 1.5."}
      </p>
      <PricingForm
        pricingRules={data.pricingRules}
        styles={data.styleOptions}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
