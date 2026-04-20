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
          "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_14px_28px_rgba(0,0,0,0.28)] hover:-translate-y-0.5 hover:bg-[color:color-mix(in_srgb,var(--accent)_92%,white_8%)] hover:shadow-[0_18px_34px_rgba(0,0,0,0.34)]",
        secondary:
          "border border-[rgba(214,173,126,0.1)] bg-[linear-gradient(180deg,rgba(255,243,227,0.03),rgba(255,243,227,0.014))] text-white shadow-[inset_0_1px_0_rgba(255,244,228,0.03)] hover:bg-[linear-gradient(180deg,rgba(255,243,227,0.05),rgba(255,243,227,0.022))] hover:border-[rgba(214,173,126,0.16)]",
        ghost: "text-[var(--foreground-muted)] hover:bg-[rgba(255,243,227,0.04)] hover:text-white",
        outline:
          "border border-[rgba(214,173,126,0.12)] bg-transparent text-white hover:bg-[rgba(255,243,227,0.03)] hover:border-[rgba(214,173,126,0.18)]",
        destructive: "bg-red-500 text-white hover:bg-red-400",
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
