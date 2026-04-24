import type { Metadata } from "next";

import { CustomizePageForm } from "@/components/dashboard/customize-page-form";
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
    <div className="space-y-3 xl:space-y-2.5">
      <CustomizePageForm
        artist={{
          profile: data.profile,
          funnelSettings: data.funnelSettings,
        }}
        theme={data.pageTheme}
        savedThemes={data.savedThemes}
        demoMode={data.demoMode}
        locale={isTurkish ? "tr" : "en"}
        hasPro={hasPro}
      />
    </div>
  );
}
