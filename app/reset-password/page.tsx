import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Logo } from "@/components/shared/logo";
import { AppShell, Container } from "@/components/shared/shell";
import { buildPageMetadata } from "@/lib/config/site";

export const metadata: Metadata = buildPageMetadata("/reset-password", { noIndex: true });

export default function ResetPasswordPage() {
  return (
    <AppShell>
      <Container className="py-6 sm:py-8">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/login" className="text-sm text-[var(--foreground-muted)] hover:text-white">
            Back to login
          </Link>
        </div>
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center py-10">
          <ResetPasswordForm />
        </div>
      </Container>
    </AppShell>
  );
}
