import Link from "next/link";
import { ArrowRight, FolderGit2, GitPullRequestArrow, Languages, Rocket } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ImportRepositoryPanel } from "@/components/mvp/import-repository-panel";
import { MetricCard } from "@/components/mvp/metric-card";
import { RepositoryList } from "@/components/mvp/repository-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          <CardContent>
            <RepositoryList repos={repos} />
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
