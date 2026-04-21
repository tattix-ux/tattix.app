import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(214,177,122,0.14)] bg-[rgba(255,255,255,0.028)] text-[var(--text-secondary)]",
        accent:
          "border-[rgba(214,177,122,0.3)] bg-[rgba(214,177,122,0.14)] text-[var(--accent-soft)]",
        muted:
          "border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] text-[var(--text-muted)]",
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
