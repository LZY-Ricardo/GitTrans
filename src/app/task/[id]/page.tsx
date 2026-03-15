import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3, FileStack, GitPullRequestArrow, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/mvp/metric-card";
import { PreviewStudio } from "@/components/mvp/preview-studio";
import { TaskStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDateTime, formatDuration } from "@/lib/format";
import { getLanguageLabel, getRepoDetail, getTaskDetail, getTaskPreviews, getTaskProgress } from "@/modules/mvp/mock-data";

type TaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskPage({ params }: TaskPageProps) {
  const { id } = await params;
  const task = await getTaskDetail(id);

  if (!task) {
    notFound();
  }

  const [repo, progress, previews] = await Promise.all([
    getRepoDetail(task.repoId),
    getTaskProgress(task.id),
    getTaskPreviews(task.id),
  ]);

  if (!repo || !progress) {
    notFound();
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge variant="default">任务轮询状态</Badge>
                  <CardTitle className="mt-3">进度与当前处理位置</CardTitle>
                </div>
                <TaskStatusBadge status={task.status} />
              </div>
              <CardDescription>MVP 前端按 `GET /api/tasks/:taskId/progress` 的语义组织轮询结果。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress value={progress.percent} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
                  <p><span className="font-medium text-ink">当前语言：</span>{task.currentLanguage ? getLanguageLabel(task.currentLanguage) : "已结束"}</p>
                  <p><span className="font-medium text-ink">当前文件：</span>{task.currentFile ?? "无"}</p>
                </div>
                <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
                  <p><span className="font-medium text-ink">触发方式：</span>{task.triggerSource}</p>
                  <p><span className="font-medium text-ink">仓库：</span>{repo.fullName}</p>
                </div>
              </div>
              <div className="rounded-[24px] border border-brand-100 bg-brand-50/70 p-4">
                <p className="text-sm font-medium text-brand-800">README 导航预览</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-brand-900/90">
                  {task.readmeNavigationPreview}
                </pre>
              </div>
            </CardContent>
          </Card>

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
