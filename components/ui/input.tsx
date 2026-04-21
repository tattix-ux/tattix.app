import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[#14161A] px-4 py-2 text-base text-[var(--text-primary)] placeholder:text-[var(--text-dim)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition hover:border-[rgba(255,255,255,0.12)] focus:border-[var(--ring)] focus:bg-[var(--surface-1)] focus:ring-2 focus:ring-[rgba(214,177,122,0.12)] sm:text-sm disabled:bg-[#111215] disabled:text-[#6F675E] disabled:border-[rgba(255,255,255,0.04)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
