import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-white shadow-[0_18px_40px_rgba(140,31,22,0.22)] hover:bg-brand-700",
        secondary:
          "bg-white/80 text-ink shadow-[0_10px_30px_rgba(34,24,21,0.08)] ring-1 ring-ink/10 hover:bg-white",
        outline:
          "border border-brand-300 bg-brand-50/80 text-brand-800 hover:border-brand-500 hover:bg-brand-100",
        ghost: "bg-transparent text-ink hover:bg-brand-50",
        danger: "bg-brand-800 text-white hover:bg-brand-900",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 rounded-full",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
