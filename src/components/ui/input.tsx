import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-ink/12 bg-white/90 px-4 py-2 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition-colors placeholder:text-ink-soft/70 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-100/70",
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
