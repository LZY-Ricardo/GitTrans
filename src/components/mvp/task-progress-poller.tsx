"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requestApi } from "@/lib/client-api";
import { formatDateTime } from "@/lib/format";
import type { TaskDetail, TaskProgress } from "@/modules/mvp/contracts";
import { getLanguageLabel } from "@/modules/mvp/labels";
import { TaskStatusBadge } from "@/components/mvp/status-badge";

type TaskProgressPollerProps = {
  taskId: string;
  repoFullName: string;
  task: Pick<TaskDetail, "triggerSource" | "readmeNavigationPreview">;
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="default">任务轮询状态</Badge>
            <CardTitle className="mt-3">进度与当前处理位置</CardTitle>
          </div>
          <TaskStatusBadge status={progress.status} />
        </div>
        <CardDescription>
          页面每 3 秒轮询一次 `GET /api/tasks/:taskId/progress`，任务结束后会自动刷新详情。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Progress value={progress.percent} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
            <p>
              <span className="font-medium text-ink">当前语言：</span>
              {progress.currentLanguage ? getLanguageLabel(progress.currentLanguage) : "已结束"}
            </p>
            <p>
              <span className="font-medium text-ink">当前文件：</span>
              {progress.currentFile ?? "无"}
            </p>
            <p>
              <span className="font-medium text-ink">完成度：</span>
              {progress.progressDone}/{progress.progressTotal}
            </p>
          </div>
          <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
            <p>
              <span className="font-medium text-ink">触发方式：</span>
              {task.triggerSource}
            </p>
            <p>
              <span className="font-medium text-ink">仓库：</span>
              {repoFullName}
            </p>
            <p>
              <span className="font-medium text-ink">最近刷新：</span>
              {formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </div>
        <div className="rounded-[24px] border border-brand-100 bg-brand-50/70 p-4">
          <p className="text-sm font-medium text-brand-800">README 导航预览</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-brand-900/90">
            {task.readmeNavigationPreview || "当前任务尚未生成 README 导航预览。"}
          </pre>
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
