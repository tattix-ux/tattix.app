import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { getSupabaseSession } from "@/lib/supabase/server";

export default async function LoginPage() {
  const session = await getSupabaseSession();

  if (session) {
    redirect("/dashboard/profile");
  }

  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-white">
            Back home
          </Link>
        </div>
        <div className="mx-auto grid min-h-[80vh] max-w-5xl gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">Artist dashboard</p>
            <h1 className="font-display text-5xl text-white">Manage your leads, pricing, and public page.</h1>
            <p className="max-w-lg text-base leading-8 text-[var(--foreground-muted)]">
              Sign in to update your artist profile, feature designs, and review incoming Tattix submissions.
            </p>
          </div>
          <LoginForm />
        </div>
      </Container>
    </AppShell>
  );
}
