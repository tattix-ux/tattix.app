import type { Metadata } from "next";

import { FeaturedDesignsForm } from "@/components/dashboard/featured-designs-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { hasProAccess } from "@/lib/access";
import { buildPageMetadata } from "@/lib/config/site";
import { getDashboardDesignsData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/dashboard/designs", { noIndex: true });

export default async function DashboardDesignsPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardDesignsData(session?.user.id ?? null);
  const isTurkish = data.locale === "tr";

  return (
    <div className="space-y-4 xl:space-y-3.5">
      <div className="space-y-2 xl:space-y-1.5">
        <h1 className="font-display text-[1.52rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--text-primary)] xl:text-[1.42rem]">
          {isTurkish ? "Tasarımlar" : "Ready-made designs"}
        </h1>
        <p className="max-w-3xl text-[11.5px] leading-[1.5] text-[var(--text-secondary)]">
          {isTurkish
            ? "Çalışmak istediğin özel tasarımlarını buraya yükleyebilirsin."
            : "These designs appear on your profile page. Clients can send a request from the design they like."}
        </p>
      </div>
      {hasProAccess(data.profile) ? (
        <FeaturedDesignsForm
          designs={data.featuredDesigns}
          artistId={data.profile.id}
          demoMode={data.demoMode}
          locale={isTurkish ? "tr" : "en"}
        />
      ) : (
        <ProFeatureGate locale={isTurkish ? "tr" : "en"} profile={data.profile} />
      )}
    </div>
  );
}
