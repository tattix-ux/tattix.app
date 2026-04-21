import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  {
    variants: {
      variant: {
        default:
          "border border-white/8 bg-[linear-gradient(180deg,#D6A574_0%,#C8925F_100%)] text-[var(--accent-foreground)] shadow-[0_8px_24px_rgba(214,165,116,0.18)] hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#E4C08D_0%,#D6A574_100%)] hover:shadow-[0_10px_28px_rgba(214,165,116,0.24)] active:bg-[linear-gradient(180deg,#C8925F_0%,#B67C49_100%)]",
        secondary:
          "border border-[rgba(255,255,255,0.09)] bg-[#1D1F24] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-[#23262C] hover:border-[rgba(255,255,255,0.14)]",
        ghost: "text-[var(--foreground-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]",
        outline:
          "border border-[rgba(255,255,255,0.09)] bg-transparent text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.14)]",
        destructive: "border border-[rgba(184,106,99,0.28)] bg-[rgba(184,106,99,0.14)] text-white hover:bg-[rgba(184,106,99,0.2)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10 rounded-full",
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
