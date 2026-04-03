import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3, FileStack, GitPullRequestArrow, Languages, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PreviewStudio } from "@/components/mvp/preview-studio";
import { TaskProgressPoller } from "@/components/mvp/task-progress-poller";
import { TaskStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      description=""
      eyebrow="Task Detail"
      mainClassName="w-[min(1500px,calc(100%-24px))]"
      title={`${task.id} · ${task.type === "full" ? "全量翻译" : "增量翻译"}`}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">任务状态</p>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-2xl font-semibold text-ink">{progress.percent}%</p>
                <TaskStatusBadge status={task.status} />
              </div>
            </div>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700">
              <FileStack className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">目标语言</p>
              <p className="mt-3 text-2xl font-semibold text-ink">{task.targetLanguages.length} 个</p>
            </div>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700">
              <Languages className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">变更文件</p>
              <p className="mt-3 text-2xl font-semibold text-ink">{task.changedFiles.length} 个</p>
            </div>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700">
              <GitPullRequestArrow className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">持续时间</p>
              <p className="mt-3 text-2xl font-semibold text-ink">{formatDuration(task.startedAt, task.finishedAt)}</p>
              <p className="mt-1 text-sm text-ink-soft">{formatDateTime(task.createdAt)}</p>
            </div>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700">
              <Clock3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <TaskProgressPoller initialProgress={progress} repoFullName={repo.fullName} task={task} taskId={task.id} />

      <PreviewStudio previews={previews} prUrl={task.prUrl} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">变更文件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.changedFiles.map((file) => (
              <div key={file} className="rounded-[22px] border border-ink/8 bg-white/80 px-4 py-3 text-sm text-ink-soft">
                {file}
              </div>
            ))}
          </CardContent>
        </Card>

        {task.readmeNavigationPreview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">README 导航预览</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-[24px] border border-brand-100 bg-brand-50/70 p-5 text-sm leading-7 text-brand-900/90">
                {task.readmeNavigationPreview}
              </pre>
            </CardContent>
          </Card>
        ) : null}
      </div>

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
    </AppShell>
  );
}
