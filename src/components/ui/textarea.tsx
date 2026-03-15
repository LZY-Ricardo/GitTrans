import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-28 w-full rounded-[24px] border border-ink/12 bg-white/90 px-4 py-3 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition-colors placeholder:text-ink-soft/70 focus-visible:border-brand-400 focus-visible:ring-4 focus-visible:ring-brand-100/70",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
