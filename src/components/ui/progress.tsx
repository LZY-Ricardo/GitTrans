import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  variant?: "brand" | "success" | "warning" | "danger" | "muted";
};

const variantClasses: Record<NonNullable<ProgressProps["variant"]>, string> = {
  brand: "bg-[linear-gradient(90deg,#d9472f_0%,#8c1f16_100%)]",
  success: "bg-[linear-gradient(90deg,#22c55e_0%,#15803d_100%)]",
  warning: "bg-[linear-gradient(90deg,#f59e0b_0%,#d97706_100%)]",
  danger: "bg-[linear-gradient(90deg,#fb7185_0%,#e11d48_100%)]",
  muted: "bg-[linear-gradient(90deg,#94a3b8_0%,#64748b_100%)]",
};

export function Progress({ value, className, variant = "brand" }: ProgressProps) {
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-brand-100/80", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", variantClasses[variant])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
