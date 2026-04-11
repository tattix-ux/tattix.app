import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[128px] w-full rounded-[24px] border border-white/10 bg-black/30 px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/50 sm:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
