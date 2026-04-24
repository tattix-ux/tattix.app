import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[16px] text-[13px] font-medium leading-none transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] xl:rounded-[13px] xl:text-[12px]",
  {
    variants: {
      variant: {
        default:
          "border border-white/8 [background:linear-gradient(180deg,var(--accent)_0%,var(--accent-deep-bronze)_100%)] text-[var(--accent-foreground)] shadow-[0_8px_24px_rgba(214,177,122,0.16)] hover:[background:linear-gradient(180deg,var(--accent-hover)_0%,var(--accent)_100%)] hover:shadow-[0_10px_26px_rgba(214,177,122,0.2)]",
        secondary:
          "border border-[var(--border-soft)] bg-[var(--surface-1)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]",
        ghost: "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.035)] hover:text-[var(--text-primary)]",
        outline:
          "border border-[var(--border-soft)] bg-transparent text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.028)] hover:border-[var(--border-strong)]",
        destructive: "border border-[rgba(184,106,99,0.28)] bg-[rgba(184,106,99,0.14)] text-white hover:bg-[rgba(184,106,99,0.2)]",
      },
      size: {
        default: "h-9 px-3.5 xl:h-[34px] xl:px-3",
        sm: "h-8 px-3 text-[12px] xl:h-[30px] xl:px-2.5 xl:text-[11px]",
        lg: "h-10 px-5 text-sm xl:h-[36px] xl:px-4 xl:text-[12.5px]",
        icon: "size-9 rounded-[15px] xl:size-[32px] xl:rounded-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
