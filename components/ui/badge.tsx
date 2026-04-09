import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/8 text-white/80",
        accent: "border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-soft)]",
        muted: "border-white/8 bg-black/30 text-[var(--foreground-muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
