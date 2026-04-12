import { redirect } from "next/navigation";

import { SignupPageContent } from "@/components/auth/signup-page-content";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function SignupPage() {
  const session = await getSupabaseSession();

  if (session) {
    redirect("/dashboard/profile");
  }

  return <SignupPageContent />;
}
