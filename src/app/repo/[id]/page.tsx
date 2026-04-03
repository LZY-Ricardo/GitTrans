import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Clock3, FolderTree, Languages, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/mvp/metric-card";
import { RepoStatusBadge, TaskStatusBadge } from "@/components/mvp/status-badge";
import { TaskLauncher } from "@/components/mvp/task-launcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getLanguageLabel } from "@/modules/mvp/labels";
import { getRepoPageData, isNotFoundError } from "@/modules/mvp/page-data";

type RepoPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepoPage({ params }: RepoPageProps) {
  const { id } = await params;
  let repo;
  let config;
  let tasks;

  try {
    ({ repo, config, tasks } = await getRepoPageData(id));
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
            <Link href={`/repo/${repo.id}/config`}>进入配置页</Link>
          </Button>
          <TaskLauncher
            canRunIncremental={Boolean(repo.syncState.lastSyncedSha)}
            repoId={repo.id}
          />
        </>
      }
      description=""
      eyebrow="Repository Detail"
      title={repo.fullName}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Sparkles className="h-5 w-5" />}
          label="仓库状态"
          value={repo.status === "ready" ? "Ready" : repo.status === "running" ? "Running" : "Attention"}
        />
        <MetricCard
          detail={
            repo.syncState.lastSyncedSha && repo.syncState.lastSyncedAt
              ? `${repo.syncState.lastSyncedSha.slice(0, 7)} · ${formatDateTime(repo.syncState.lastSyncedAt)}`
              : repo.syncState.lastSyncedSha
                ? repo.syncState.lastSyncedSha.slice(0, 7)
                : repo.syncState.lastSyncedAt
                  ? formatDateTime(repo.syncState.lastSyncedAt)
                  : undefined
          }
          icon={<Clock3 className="h-5 w-5" />}
          label="最近同步"
          value={repo.syncState.lastSyncedAt ? formatDateTime(repo.syncState.lastSyncedAt) : "未同步"}
        />
        <MetricCard
          icon={<FolderTree className="h-5 w-5" />}
          label="目标语言"
          value={`${repo.targetLanguages.length} 个`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge variant="default">仓库概览</Badge>
                  <CardTitle className="mt-3">仓库概览</CardTitle>
                </div>
                <RepoStatusBadge status={repo.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-ink-soft">
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4">
                <p><span className="font-medium text-ink">翻译分支：</span>{repo.translationBranch}</p>
                <p><span className="font-medium text-ink">基准分支：</span>{repo.baseBranch}</p>
                <p><span className="font-medium text-ink">基准语言：</span>{getLanguageLabel(repo.baseLanguage)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {repo.targetLanguages.map((language) => (
                  <Badge key={language} variant="outline">
                    {getLanguageLabel(language)}
                  </Badge>
                ))}
              </div>
              {repo.currentPr ? (
                <div className="rounded-[24px] border border-brand-100 bg-brand-50/70 p-4">
                  <p className="font-medium text-brand-800">当前翻译 PR</p>
                  <a
                    className="mt-2 inline-flex items-center gap-2 underline"
                    href={repo.currentPr.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    PR #{repo.currentPr.number}
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-4 text-amber-700">
                  当前没有打开中的翻译 PR，通常表示尚未完成首次翻译或上一次任务失败。
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">配置快照</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">Include Paths</p>
                {config.includePaths.map((path) => (
                  <p key={path}>{path}</p>
                ))}
              </div>
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">Ignore Rules</p>
                <pre className="whitespace-pre-wrap">{config.ignoreRulesText}</pre>
              </div>
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">模型</p>
                <p>{config.modelId}</p>
              </div>
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">README 导航</p>
                <p>{config.readmeNavigationEnabled ? "启用" : "关闭"}</p>
                <p>{config.usePlatformKey ? "平台托管 Key" : "用户自带 Key"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge variant="default">最近任务</Badge>
                <CardTitle className="mt-3">任务流转历史</CardTitle>
              </div>
              <Languages className="h-4 w-4 text-brand-700" />
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-[24px] border border-ink/8 bg-white/80 p-5">
                    <div className="flex h-full flex-col gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <TaskStatusBadge status={task.status} />
                          <Badge variant="outline">{task.type === "full" ? "全量翻译" : "增量翻译"}</Badge>
                        </div>
                        <div>
                          <p className="truncate font-medium text-ink" title={task.id}>{task.id}</p>
                          <p className="text-sm text-ink-soft">
                            {task.progressDone}/{task.progressTotal} 项 · 创建于 {formatDateTime(task.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-wrap gap-2">
                        {task.prUrl ? (
                          <Button asChild size="sm" variant="secondary">
                            <a href={task.prUrl} rel="noreferrer" target="_blank">
                              查看 PR
                            </a>
                          </Button>
                        ) : null}
                        <Button asChild size="sm">
                          <Link href={`/task/${task.id}`}>任务详情</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink/12 bg-white/80 p-5 text-sm leading-7 text-ink-soft">
                暂无任务记录
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
