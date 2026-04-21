import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]",
        accent:
          "border-[rgba(214,165,116,0.3)] bg-[rgba(214,165,116,0.14)] text-[#E4C08D]",
        muted:
          "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.025)] text-[var(--text-muted)]",
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
