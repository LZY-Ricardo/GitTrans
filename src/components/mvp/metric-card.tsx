import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
};

export function MetricCard({ label, value, detail, icon }: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs uppercase tracking-[0.28em] text-ink-soft/80">
            {label}
          </CardDescription>
          <div className="rounded-full bg-brand-50 p-3 text-brand-700">{icon}</div>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {detail ? <CardContent className="pt-0 text-sm leading-6 text-ink-soft">{detail}</CardContent> : null}
    </Card>
  );
}
