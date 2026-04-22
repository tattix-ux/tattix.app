import type { Metadata } from "next";

import { FeaturedDesignsForm } from "@/components/dashboard/featured-designs-form";
import { ProFeatureGate } from "@/components/dashboard/pro-feature-gate";
import { SectionHeading } from "@/components/shared/shell";
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
    <div className="space-y-3">
      <SectionHeading
        eyebrow={isTurkish ? "Tasarımlar" : "Designs"}
        title={
          isTurkish
            ? "Hazır tasarımlar"
            : "Ready-made designs"
        }
        description={
          isTurkish
            ? "Buradaki tasarımlar profil sayfanda görünür. Müşteri beğendiği tasarımdan talep gönderebilir."
            : "These designs appear on your profile page. Clients can send a request from the design they like."
        }
      />
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
