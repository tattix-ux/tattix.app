import { FunnelSettingsForm } from "@/components/dashboard/funnel-settings-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardFunnelPage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionHeading
          eyebrow={isTurkish ? "Akış" : "Funnel"}
          title={
            isTurkish
              ? "Müşterinin sana yazma sürecini düzenle."
              : "Shape the path that leads clients to message you."
          }
          description={
            isTurkish
              ? "Müşterinin ne istediğini net anlatmasını sağla ve sadece yapmak istediğin işleri al."
              : "Help clients explain what they want clearly and attract only the work you want."
          }
        />
        <p className="text-sm text-[var(--accent-soft)]">
          {isTurkish
            ? "İyi bir akış, daha doğru ve hızlı müşteri getirir."
            : "A better flow brings clearer and faster client messages."}
        </p>
      </div>
      <FunnelSettingsForm
        settings={data.funnelSettings}
        styles={data.styleOptions}
        locale={isTurkish ? "tr" : "en"}
      />
    </div>
  );
}
