import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
};

export function Progress({ value, className }: ProgressProps) {
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-brand-100/80", className)}>
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#d9472f_0%,#8c1f16_100%)] transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
