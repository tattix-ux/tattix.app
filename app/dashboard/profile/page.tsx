import { isAdminEmail } from "@/lib/access";
import { AdminProAccessForm } from "@/components/dashboard/admin-pro-access-form";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardProfilePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);
  const isTurkish = data.funnelSettings.defaultLanguage === "tr";
  const showAdminControls =
    isAdminEmail(session?.user.email) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

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
            ? "Bu alanlar sanatçı sayfanı, WhatsApp ön mesajını ve bağlantı yapını doğrudan etkiler."
            : "These fields power your hero section, WhatsApp handoff, and public artist slug."
        }
      />
      <ProfileForm
        profile={data.profile}
        demoMode={data.demoMode}
        locale={data.funnelSettings.defaultLanguage}
      />
      {showAdminControls ? (
        <AdminProAccessForm
          locale={data.funnelSettings.defaultLanguage}
          defaultSlug={data.profile.slug}
        />
      ) : null}
    </div>
  );
}
