"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, FileStack, GitPullRequestArrow, Languages } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requestApi } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import type { TaskDetail, TaskProgress } from "@/modules/mvp/contracts";
import { getLanguageLabel } from "@/modules/mvp/labels";
import { TaskStatusBadge } from "@/components/mvp/status-badge";

type TaskProgressPollerProps = {
  taskId: string;
  repoFullName: string;
  task: Pick<TaskDetail, "triggerSource" | "prUrl">;
  initialProgress: TaskProgress;
};

const ACTIVE_STATUSES = new Set(["pending", "running"]);

export function TaskProgressPoller({
  taskId,
  repoFullName,
  task,
  initialProgress,
}: TaskProgressPollerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [pollError, setPollError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const refreshedRef = useRef(false);

  useEffect(() => {
    if (!ACTIVE_STATUSES.has(progress.status)) {
      if (!refreshedRef.current) {
        refreshedRef.current = true;
        router.refresh();
      }

      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const nextProgress = await requestApi<TaskProgress>(`/api/tasks/${taskId}/progress`, {
          cache: "no-store",
        });
        setProgress(nextProgress);
        setLastUpdatedAt(new Date().toISOString());
        setPollError(null);

        if (!ACTIVE_STATUSES.has(nextProgress.status) && !refreshedRef.current) {
          refreshedRef.current = true;
          router.refresh();
        }
      } catch (error) {
        setPollError(error instanceof Error ? error.message : "轮询任务进度失败");
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [progress.status, router, taskId]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge variant="default">任务状态</Badge>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-3xl md:text-4xl">{progress.percent}%</CardTitle>
              <TaskStatusBadge status={progress.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[22px] border border-ink/8 bg-white/80 px-4 py-3 text-sm text-ink-soft">
              <p className="font-medium text-ink">
                {progress.progressDone}/{progress.progressTotal}
              </p>
              <p>已完成</p>
            </div>
            <div className="rounded-[22px] border border-ink/8 bg-white/80 px-4 py-3 text-sm text-ink-soft">
              <p className="font-medium text-ink">{progress.progressFailed}</p>
              <p>失败项</p>
            </div>
            {progress.prUrl ?? task.prUrl ? (
              <Button asChild>
                <a href={progress.prUrl ?? task.prUrl ?? "#"} rel="noreferrer" target="_blank">
                  查看 PR
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={progress.percent} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-ink/8 bg-white/85 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <Languages className="h-4 w-4" />
              当前语言
            </div>
            <p className="text-sm font-medium leading-6 text-ink">
              {progress.currentLanguage ? getLanguageLabel(progress.currentLanguage) : "已结束"}
            </p>
          </div>
          <div className="rounded-[24px] border border-ink/8 bg-white/85 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <FileStack className="h-4 w-4" />
              当前文件
            </div>
            <p className="text-sm font-medium leading-6 text-ink">{progress.currentFile ?? "无"}</p>
          </div>
          <div className="rounded-[24px] border border-ink/8 bg-white/85 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <GitPullRequestArrow className="h-4 w-4" />
              仓库 / 触发
            </div>
            <p className="text-sm font-medium leading-6 text-ink">{repoFullName}</p>
            <p className="mt-1 text-sm text-ink-soft">{task.triggerSource}</p>
          </div>
          <div className="rounded-[24px] border border-ink/8 bg-white/85 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <Clock3 className="h-4 w-4" />
              最近刷新
            </div>
            <p className="text-sm font-medium leading-6 text-ink">{formatDateTime(lastUpdatedAt)}</p>
          </div>
        </div>
        {pollError ? (
          <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-4 text-sm leading-7 text-rose-700">
            {pollError}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
