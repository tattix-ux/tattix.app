import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function NativeSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[#14161A] px-4 pr-10 text-base text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition hover:border-[rgba(255,255,255,0.12)] focus:border-[var(--ring)] focus:bg-[var(--surface-1)] focus:ring-2 focus:ring-[rgba(214,177,122,0.12)] sm:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
    </div>
  );
}
