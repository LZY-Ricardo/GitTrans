import type { ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import type { RepoStatus, TaskStatus } from "@/modules/mvp/contracts";

const repoStatusMap: Record<RepoStatus, { label: string; variant: ComponentProps<typeof Badge>["variant"] }> = {
  ready: { label: "可翻译", variant: "success" },
  running: { label: "同步中", variant: "warning" },
  error: { label: "需处理", variant: "danger" },
  disconnected: { label: "已断开", variant: "outline" },
};

const taskStatusMap: Record<TaskStatus, { label: string; variant: ComponentProps<typeof Badge>["variant"] }> = {
  pending: { label: "等待中", variant: "outline" },
  running: { label: "执行中", variant: "warning" },
  succeeded: { label: "已完成", variant: "success" },
  failed: { label: "失败", variant: "danger" },
  cancelled: { label: "已取消", variant: "muted" },
};

export function RepoStatusBadge({ status }: { status: RepoStatus }) {
  const config = repoStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = taskStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
