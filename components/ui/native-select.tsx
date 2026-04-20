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
          "h-11 w-full appearance-none rounded-[18px] border border-white/8 bg-[color:color-mix(in_srgb,var(--background)_82%,white_5%)] px-4 pr-10 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[var(--accent)]/42 focus:bg-[color:color-mix(in_srgb,var(--background)_78%,white_7%)] focus:ring-2 focus:ring-[var(--accent)]/14 sm:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/48" />
    </div>
  );
}
