import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignupPageContent } from "@/components/auth/signup-page-content";
import { buildPageMetadata } from "@/lib/config/site";
import { getSupabaseSession } from "@/lib/supabase/server";

export const metadata: Metadata = buildPageMetadata("/signup", { noIndex: true });

export default async function SignupPage() {
  const session = await getSupabaseSession();

  if (session) {
    redirect("/dashboard/profile");
  }

  return <SignupPageContent />;
}
