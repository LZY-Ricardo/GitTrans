"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Clock3, FileStack, GitPullRequestArrow, Languages } from "lucide-react";

import { TaskStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requestApi } from "@/lib/client-api";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { TaskDetail, TaskProgress } from "@/modules/mvp/contracts";
import { getLanguageLabel } from "@/modules/mvp/labels";

type TaskProgressPollerProps = {
  taskId: string;
  repoFullName: string;
  task: Pick<
    TaskDetail,
    "triggerSource" | "prUrl" | "targetLanguages" | "changedFiles" | "createdAt" | "startedAt" | "finishedAt"
  >;
  initialProgress: TaskProgress;
};

const ACTIVE_STATUSES = new Set(["pending", "running"]);
const statusThemeMap = {
  pending: {
    cardClassName: "border-slate-200 bg-slate-50/70",
    metricClassName: "border-slate-200 bg-white/85",
    progressVariant: "muted" as const,
  },
  running: {
    cardClassName: "border-amber-200 bg-amber-50/75",
    metricClassName: "border-amber-100 bg-white/90",
    progressVariant: "warning" as const,
  },
  succeeded: {
    cardClassName: "border-emerald-200 bg-emerald-50/75",
    metricClassName: "border-emerald-100 bg-white/90",
    progressVariant: "success" as const,
  },
  failed: {
    cardClassName: "border-rose-200 bg-rose-50/75",
    metricClassName: "border-rose-100 bg-white/90",
    progressVariant: "danger" as const,
  },
  cancelled: {
    cardClassName: "border-slate-200 bg-slate-50/75",
    metricClassName: "border-slate-200 bg-white/90",
    progressVariant: "muted" as const,
  },
};

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
  const theme = statusThemeMap[progress.status];

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
    <Card className={`overflow-hidden ${theme.cardClassName}`}>
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
            <div className={`rounded-[22px] border px-4 py-3 text-sm text-ink-soft ${theme.metricClassName}`}>
              <p className="font-medium text-ink">
                {progress.progressDone}/{progress.progressTotal}
              </p>
              <p>已完成</p>
            </div>
            <div className={`rounded-[22px] border px-4 py-3 text-sm text-ink-soft ${theme.metricClassName}`}>
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
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <span>任务进度</span>
            <span>{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} variant={theme.progressVariant} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-[24px] border p-4 ${theme.metricClassName}`}>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <Languages className="h-4 w-4" />
              当前语言
            </div>
            <p className="text-sm font-medium leading-6 text-ink">
              {progress.currentLanguage ? getLanguageLabel(progress.currentLanguage) : "已结束"}
            </p>
          </div>

          <div className={`rounded-[24px] border p-4 ${theme.metricClassName}`}>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <FileStack className="h-4 w-4" />
              当前文件
            </div>
            <p className="text-sm font-medium leading-6 text-ink break-all">
              {progress.currentFile ?? "无"}
            </p>
          </div>

          <div className={`rounded-[24px] border p-4 ${theme.metricClassName}`}>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <GitPullRequestArrow className="h-4 w-4" />
              任务概览
            </div>
            <p className="text-sm font-medium leading-6 text-ink">
              {task.changedFiles.length} 个文件 · {task.targetLanguages.length} 个语言
            </p>
            <p className="mt-1 text-sm text-ink-soft">{formatDuration(task.startedAt, task.finishedAt)}</p>
          </div>

          <div className={`rounded-[24px] border p-4 ${theme.metricClassName}`}>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
              <Clock3 className="h-4 w-4" />
              仓库 / 触发
            </div>
            <p className="text-sm font-medium leading-6 text-ink break-all">{repoFullName}</p>
            <p className="mt-1 text-sm text-ink-soft">{task.triggerSource}</p>
          </div>
        </div>

        <div className={`rounded-[24px] border p-4 ${theme.metricClassName}`}>
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
            <Clock3 className="h-4 w-4" />
            时间
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p className="font-medium leading-6 text-ink">创建于 {formatDateTime(task.createdAt)}</p>
            <p className="font-medium leading-6 text-ink">开始于 {formatDateTime(task.startedAt)}</p>
            <p className="font-medium leading-6 text-ink">最近刷新 {formatDateTime(lastUpdatedAt)}</p>
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
