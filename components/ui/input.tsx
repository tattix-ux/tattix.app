import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[18px] border border-[rgba(214,173,126,0.1)] bg-[linear-gradient(180deg,rgba(18,15,17,0.96),rgba(24,20,22,1))] px-4 py-2 text-base text-white placeholder:text-[rgba(247,239,228,0.3)] shadow-[inset_0_1px_0_rgba(255,244,228,0.035)] outline-none transition focus:border-[rgba(247,177,93,0.38)] focus:bg-[linear-gradient(180deg,rgba(23,18,20,0.98),rgba(29,23,25,1))] focus:ring-2 focus:ring-[rgba(247,177,93,0.14)] sm:text-sm",
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
