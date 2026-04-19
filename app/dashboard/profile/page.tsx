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
      <div className="space-y-3">
        <SectionHeading
          eyebrow={isTurkish ? "Profil" : "Profile"}
          title={
            isTurkish
              ? "Müşteri seni görmeden önce profilin böyle görünür"
              : "This is how your profile looks before clients message you"
          }
          description={
            isTurkish
              ? "Müşterinin gördüğü alanları burada güncellersin."
              : "Update the parts clients see before they message you."
          }
        />
      </div>
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
