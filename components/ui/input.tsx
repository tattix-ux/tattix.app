import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-[18px] border border-[rgba(233,199,158,0.12)] bg-[linear-gradient(180deg,rgba(21,15,13,0.94),rgba(28,20,18,0.98))] px-4 py-2 text-base text-white placeholder:text-[rgba(247,239,228,0.32)] shadow-[inset_0_1px_0_rgba(255,244,228,0.04)] outline-none transition focus:border-[rgba(247,177,93,0.44)] focus:bg-[linear-gradient(180deg,rgba(27,19,16,0.98),rgba(33,23,20,1))] focus:ring-2 focus:ring-[rgba(247,177,93,0.16)] sm:text-sm",
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
