import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
}: {
  className?: string;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/12 bg-[linear-gradient(135deg,#f7b15d,rgba(247,177,93,0.18))] text-sm font-semibold text-black">
        TX
      </span>
      <span className="font-display text-lg tracking-[0.24em] text-white">Tattix</span>
    </Link>
  );
}
