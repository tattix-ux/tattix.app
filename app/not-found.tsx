import Link from "next/link";

import { AppShell, Container } from "@/components/shared/shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <AppShell>
      <Container className="flex min-h-screen items-center justify-center py-20">
        <div className="max-w-md space-y-5 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent-soft)]">404</p>
          <h1 className="font-display text-5xl text-white">Artist page not found</h1>
          <p className="text-sm leading-7 text-[var(--foreground-muted)]">
            The link may be inactive, misspelled, or not published yet.
          </p>
          <Button asChild>
            <Link href="/">Back to TatBot home</Link>
          </Button>
        </div>
      </Container>
    </AppShell>
  );
}
