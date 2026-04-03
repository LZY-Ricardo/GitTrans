import Link from "next/link";
import { ArrowRight, FolderGit2, GitPullRequestArrow, Languages, Rocket } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ImportRepositoryPanel } from "@/components/mvp/import-repository-panel";
import { MetricCard } from "@/components/mvp/metric-card";
import { RepoStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getLanguageLabel } from "@/modules/mvp/labels";
import { getDashboardPageData } from "@/modules/mvp/page-data";

export default async function DashboardPage() {
  const { repos, installations, installationsError, installUrl } = await getDashboardPageData();

  const uniqueLanguageCount = new Set(repos.flatMap((repo) => repo.targetLanguages)).size;
  const runningCount = repos.filter((repo) => repo.status === "running").length;
  const primaryRepo = repos.find((repo) => repo.status === "running") ?? repos[0] ?? null;

  return (
    <AppShell
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href="/settings">查看运行约束</Link>
          </Button>
          {primaryRepo ? (
            <Button asChild>
              <Link href={`/repo/${primaryRepo.id}`}>
                打开当前仓库
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </>
      }
      description=""
      eyebrow="Repository Control Room"
      title="以仓库为中心的翻译控制台"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={<FolderGit2 className="h-5 w-5" />}
          label="已导入仓库"
          value={String(repos.length)}
        />
        <MetricCard
          icon={<Rocket className="h-5 w-5" />}
          label="运行中任务"
          value={String(runningCount)}
        />
        <MetricCard
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
                <CardTitle className="mt-3">仓库列表</CardTitle>
              </div>
              <div className="rounded-full bg-brand-50 p-3 text-brand-700">
                <GitPullRequestArrow className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {repos.length > 0 ? (
              repos.map((repo) => (
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
                        <p className="text-sm leading-7 text-ink-soft">{formatDateTime(repo.lastSyncedAt)}</p>
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
                      <a className="underline" href={repo.currentPrUrl} rel="noreferrer" target="_blank">查看 PR</a>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-ink/12 bg-white/80 p-6 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">还没有导入任何仓库</p>
              </div>
            )}
          </CardContent>
        </Card>

        <ImportRepositoryPanel
          installations={installations}
          installationsError={installationsError}
          installUrl={installUrl}
        />
      </div>
    </AppShell>
  );
}
