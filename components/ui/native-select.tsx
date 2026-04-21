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
          "h-11 w-full appearance-none rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[#16181C] px-4 pr-10 text-base text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition hover:border-[rgba(255,255,255,0.12)] focus:border-[rgba(214,165,116,0.42)] focus:bg-[#1D1F24] focus:ring-2 focus:ring-[rgba(214,165,116,0.12)] sm:text-sm",
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
