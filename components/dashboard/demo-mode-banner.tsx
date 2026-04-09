import { Badge } from "@/components/ui/badge";

export function DemoModeBanner() {
  return (
    <div className="rounded-[24px] border border-[var(--accent)]/20 bg-[var(--accent)]/10 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="accent">Demo mode</Badge>
        <p className="text-sm leading-6 text-[var(--accent-soft)]">
          Supabase isn&apos;t configured yet, so the dashboard is showing seeded demo data.
          Connect your project env vars to unlock real auth, persistence, and storage uploads.
        </p>
      </div>
    </div>
  );
}
