import Link from "next/link";
import { ArrowRight, FolderGit2, GitPullRequestArrow, Languages, Rocket } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ImportRepositoryPanel } from "@/components/mvp/import-repository-panel";
import { MetricCard } from "@/components/mvp/metric-card";
import { RepoStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getLanguageLabel, listImportableRepositories, listInstallations, listRepos } from "@/modules/mvp/mock-data";

export default async function DashboardPage() {
  const [repos, installations, repositories] = await Promise.all([
    listRepos(),
    listInstallations(),
    listImportableRepositories(),
  ]);

  const uniqueLanguageCount = new Set(repos.flatMap((repo) => repo.targetLanguages)).size;
  const runningCount = repos.filter((repo) => repo.status === "running").length;

  return (
    <AppShell
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href="/settings">查看运行约束</Link>
          </Button>
          <Button asChild>
            <Link href="/repo/repo_456">
              打开运行中仓库
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
      description="仪表盘聚合仓库状态、当前 PR、最近同步时间和导入入口。布局保持信息密度，但不引入图表中心、团队管理等非 MVP 板块。"
      eyebrow="Repository Control Room"
      title="以仓库为中心的翻译控制台"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          detail="当前已经导入 3 个公共仓库，保持单仓库串行任务模型。"
          icon={<FolderGit2 className="h-5 w-5" />}
          label="已导入仓库"
          value={String(repos.length)}
        />
        <MetricCard
          detail="运行态任务与仓库状态同步展示，便于快速回到处理中断点。"
          icon={<Rocket className="h-5 w-5" />}
          label="运行中任务"
          value={String(runningCount)}
        />
        <MetricCard
          detail="语言列表来自 bootstrap 接口，不在前端硬编码。"
          icon={<Languages className="h-5 w-5" />}
          label="目标语言"
          value={String(uniqueLanguageCount)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge variant="default">已导入仓库</Badge>
                <CardTitle className="mt-3">仓库列表与快速跳转</CardTitle>
              </div>
              <div className="rounded-full bg-brand-50 p-3 text-brand-700">
                <GitPullRequestArrow className="h-5 w-5" />
              </div>
            </div>
            <CardDescription>
              每张卡片只保留 MVP 必需信息：仓库名、基础分支、目标语言、最近同步、当前 PR 与最近任务。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="rounded-[28px] border border-ink/8 bg-white/80 p-5 transition-colors hover:border-brand-200"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <RepoStatusBadge status={repo.status} />
                      <Badge variant="outline">{repo.baseBranch}</Badge>
                      <Badge variant="muted">{repo.baseLanguage}</Badge>
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl text-ink">{repo.fullName}</h2>
                      <p className="text-sm leading-7 text-ink-soft">
                        最近同步 {formatDateTime(repo.lastSyncedAt)} · 默认分支 {repo.defaultBranch}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {repo.targetLanguages.map((language) => (
                        <Badge key={language} variant="outline">
                          {getLanguageLabel(language)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/repo/${repo.id}`}>仓库详情</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/repo/${repo.id}/config`}>配置</Link>
                    </Button>
                    {repo.currentTask ? (
                      <Button asChild>
                        <Link href={`/task/${repo.currentTask.id}`}>任务详情</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
                {repo.currentPrUrl ? (
                  <div className="mt-4 rounded-[22px] border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">
                    当前 PR：<a className="underline" href={repo.currentPrUrl} rel="noreferrer" target="_blank">{repo.currentPrUrl}</a>
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <ImportRepositoryPanel installations={installations} repositories={repositories} />
      </div>
    </AppShell>
  );
}
