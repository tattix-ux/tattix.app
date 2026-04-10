import { redirect } from "next/navigation";

import { LoginPageContent } from "@/components/auth/login-page-content";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function LoginPage() {
  const session = await getSupabaseSession();

  if (session) {
    redirect("/dashboard/profile");
  }

  return <LoginPageContent />;
}
