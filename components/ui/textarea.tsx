import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[136px] w-full rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[#14161A] px-4 py-3.5 text-base text-[var(--text-primary)] placeholder:text-[var(--text-dim)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition hover:border-[rgba(255,255,255,0.12)] focus:border-[var(--ring)] focus:bg-[var(--surface-1)] focus:ring-2 focus:ring-[rgba(214,177,122,0.12)] sm:text-sm disabled:bg-[#111215] disabled:text-[#6F675E] disabled:border-[rgba(255,255,255,0.04)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
