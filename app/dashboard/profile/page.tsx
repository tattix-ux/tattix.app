import { ProfileForm } from "@/components/dashboard/profile-form";
import { SectionHeading } from "@/components/shared/shell";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function DashboardProfilePage() {
  const session = await getSupabaseSession();
  const data = await getDashboardData(session?.user.id ?? null);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Profile"
        title="Craft the public identity clients meet first."
        description="These fields power your hero section, WhatsApp handoff, and public artist slug."
      />
      <ProfileForm profile={data.profile} demoMode={data.demoMode} />
    </div>
  );
}
