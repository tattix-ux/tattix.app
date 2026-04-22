import type { Metadata } from "next";

import { CustomizePageForm } from "@/components/dashboard/customize-page-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { hasProAccess } from "@/lib/access";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardCustomizeData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/customize", { noIndex: true });

export default async function DashboardCustomizePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardCustomizeData(session?.user.id ?? null);
  const isTurkish = data.locale === "tr";
  const hasPro = hasProAccess(data.profile);

  return (
    <div>
      {hasPro ? (
        <CustomizePageForm
          artist={{
            profile: data.profile,
            funnelSettings: data.funnelSettings,
          }}
          theme={data.pageTheme}
          savedThemes={data.savedThemes}
          demoMode={data.demoMode}
          locale={isTurkish ? "tr" : "en"}
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
              {isTurkish ? "PRO" : "PRO"}
            </p>
            <div className="space-y-1.5">
              <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                {isTurkish ? "Sayfayı Özelleştir" : "Customize Page"}
              </h1>
              <p className="max-w-[640px] text-[14px] leading-6 text-[var(--foreground-muted)]">
                {isTurkish
                  ? "Müşterinin gördüğü sayfayı kendi tarzına göre düzenle."
                  : "Shape the page your clients see to match your style."}
              </p>
            </div>
          </div>
          <ProFeatureGate locale={isTurkish ? "tr" : "en"} profile={data.profile} />
        </div>
      )}
    </div>
  );
}
