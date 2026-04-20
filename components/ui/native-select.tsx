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
          "h-11 w-full appearance-none rounded-[18px] border border-[rgba(233,199,158,0.12)] bg-[linear-gradient(180deg,rgba(21,15,13,0.94),rgba(28,20,18,0.98))] px-4 pr-10 text-base text-white shadow-[inset_0_1px_0_rgba(255,244,228,0.04)] outline-none transition focus:border-[rgba(247,177,93,0.44)] focus:bg-[linear-gradient(180deg,rgba(27,19,16,0.98),rgba(33,23,20,1))] focus:ring-2 focus:ring-[rgba(247,177,93,0.16)] sm:text-sm",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[rgba(240,197,143,0.72)]" />
    </div>
  );
}
