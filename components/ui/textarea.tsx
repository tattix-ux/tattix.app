import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[128px] w-full rounded-[22px] border border-white/8 bg-[color:color-mix(in_srgb,var(--background)_82%,white_5%)] px-4 py-3 text-base text-white placeholder:text-white/32 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition focus:border-[var(--accent)]/42 focus:bg-[color:color-mix(in_srgb,var(--background)_78%,white_7%)] focus:ring-2 focus:ring-[var(--accent)]/14 sm:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
