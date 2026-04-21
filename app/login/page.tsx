import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginPageContent } from "@/components/auth/login-page-content";
import { buildPageMetadata } from "@/lib/config/site";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/login", { noIndex: true });

export default async function LoginPage() {
  const session = await getSupabaseSession();

  if (session) {
    redirect("/dashboard/profile");
  }

  return <LoginPageContent />;
}
