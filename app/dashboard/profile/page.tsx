import { ProfileForm } from "@/components/dashboard/profile-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardProfilePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={isTurkish ? "Profil" : "Profile"}
        title={
          isTurkish
            ? "Müşterilerin ilk gördüğü sanatçı profilini düzenle."
            : "Craft the public identity clients meet first."
        }
        description={
          isTurkish
            ? "Bu alanlar public sayfanı, WhatsApp handoff mesajını ve sanatçı slug yapını besler."
            : "These fields power your hero section, WhatsApp handoff, and public artist slug."
        }
      />
      <ProfileForm
        profile={data.profile}
        demoMode={data.demoMode}
        locale={data.funnelSettings.defaultLanguage}
      />
    </div>
  );
}
