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
          "h-11 w-full appearance-none rounded-[18px] border border-[rgba(214,173,126,0.1)] bg-[linear-gradient(180deg,rgba(18,15,17,0.96),rgba(24,20,22,1))] px-4 pr-10 text-base text-white shadow-[inset_0_1px_0_rgba(255,244,228,0.035)] outline-none transition focus:border-[rgba(247,177,93,0.38)] focus:bg-[linear-gradient(180deg,rgba(23,18,20,0.98),rgba(29,23,25,1))] focus:ring-2 focus:ring-[rgba(247,177,93,0.14)] sm:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[rgba(216,171,118,0.68)]" />
    </div>
  );
}
