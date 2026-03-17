import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3, FileStack, GitPullRequestArrow, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/mvp/metric-card";
import { PreviewStudio } from "@/components/mvp/preview-studio";
import { TaskProgressPoller } from "@/components/mvp/task-progress-poller";
import { TaskStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatDuration } from "@/lib/format";
import { getTaskPageData, isNotFoundError } from "@/modules/mvp/page-data";

type TaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  let task;
  let repo;
  let progress;
  let previews;

  try {
    ({ task, repo, progress, previews } = await getTaskPageData(id));
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }

    throw error;
  }

  return (
    <AppShell
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href={`/repo/${repo.id}`}>回到仓库</Link>
          </Button>
          {task.prUrl ? (
            <Button asChild>
              <a href={task.prUrl} rel="noreferrer" target="_blank">
                打开 GitHub PR
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </>
      }
      description="任务详情页以轮询视图组织信息，包含当前文件、当前语言、README 导航预览与单文件翻译结果，不扩展到复杂 Diff 和失败重试工作台。"
      eyebrow="Task Detail"
      title={`${task.id} · ${task.type === "full" ? "全量翻译" : "增量翻译"}`}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          detail={`当前状态：${task.status}，已完成 ${progress.progressDone}/${progress.progressTotal} 项。`}
          icon={<FileStack className="h-5 w-5" />}
          label="执行进度"
          value={`${progress.percent}%`}
        />
        <MetricCard
          detail={`任务创建于 ${formatDateTime(task.createdAt)}，适合前端轮询刷新。`}
          icon={<Clock3 className="h-5 w-5" />}
          label="持续时间"
          value={formatDuration(task.startedAt, task.finishedAt)}
        />
        <MetricCard
          detail={task.prUrl ? "译文会持续推送到同一个长期 PR。" : "当前没有可跳转的 PR。"}
          icon={<GitPullRequestArrow className="h-5 w-5" />}
          label="目标语言"
          value={`${task.targetLanguages.length} 个`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <TaskProgressPoller
            initialProgress={progress}
            repoFullName={repo.fullName}
            task={task}
            taskId={task.id}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">变更文件</CardTitle>
              <CardDescription>后端按 compare / commits 过滤后的 Markdown 文件列表会在这里展示。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.changedFiles.map((file) => (
                <div key={file} className="rounded-[22px] border border-ink/8 bg-white/80 px-4 py-3 text-sm text-ink-soft">
                  {file}
                </div>
              ))}
            </CardContent>
          </Card>

          {task.errorSummary ? (
            <Card className="border-rose-200">
              <CardHeader>
                <div className="flex items-center gap-2 text-rose-700">
                  <TriangleAlert className="h-5 w-5" />
                  <CardTitle className="text-2xl text-rose-700">错误摘要</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-rose-700">{task.errorSummary}</CardContent>
            </Card>
          ) : null}
        </div>

        <PreviewStudio previews={previews} />
      </div>
    </AppShell>
  );
}
