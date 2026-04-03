"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Play, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requestApi } from "@/lib/client-api";
import type { TaskType } from "@/modules/mvp/contracts";

type TaskLauncherProps = {
  repoId: string;
  canRunIncremental: boolean;
};

export function TaskLauncher({ repoId, canRunIncremental }: TaskLauncherProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<TaskType | null>(null);
  const [isPending, startTransition] = useTransition();

  function launchTask(type: TaskType) {
    setPendingType(type);
    setMessage(null);

    startTransition(async () => {
      try {
        const data = await requestApi<{ taskId: string; status: string }>(`/api/repos/${repoId}/tasks`, {
          method: "POST",
          body: JSON.stringify({ type }),
        });

        router.push(`/task/${data.taskId}`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "创建任务失败");
      } finally {
        setPendingType(null);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Button disabled={isPending} onClick={() => launchTask("full")}>
          {isPending && pendingType === "full" ? "创建中..." : "开始全量翻译"}
          {isPending && pendingType === "full" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button
          disabled={isPending || !canRunIncremental}
          onClick={() => launchTask("incremental")}
          variant="secondary"
        >
          {isPending && pendingType === "incremental" ? "创建中..." : "开始增量同步"}
          {isPending && pendingType === "incremental" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
        </Button>
      </div>
      {message ? <p className="text-sm leading-6 text-ink-soft">{message}</p> : null}
    </div>
  );
}
