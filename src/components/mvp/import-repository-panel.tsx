import { ArrowUpRight, FolderGit2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImportableRepository, InstallationSummary } from "@/modules/mvp/contracts";

type ImportRepositoryPanelProps = {
  installations: InstallationSummary[];
  repositories: ImportableRepository[];
};

export function ImportRepositoryPanel({
  installations,
  repositories,
}: ImportRepositoryPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="default">导入仓库</Badge>
            <CardTitle className="mt-3">按 GitHub App 安装范围选择仓库</CardTitle>
          </div>
          <div className="rounded-full bg-brand-50 p-3 text-brand-700">
            <FolderGit2 className="h-5 w-5" />
          </div>
        </div>
        <CardDescription>
          MVP 按安装范围拉取仓库列表。前端只消费平台聚合后的安装与仓库数据，不直连 GitHub API。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "1. 选择安装", detail: "先选 GitHub App 的安装主体" },
            { icon: FolderGit2, title: "2. 选择仓库", detail: "仅显示当前安装下可见仓库" },
            { icon: Sparkles, title: "3. 导入并配置", detail: "进入配置页完成语言、范围与模型设置" },
          ].map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-[24px] border border-brand-100 bg-brand-50/60 p-4"
              >
                <Icon className="mb-3 h-5 w-5 text-brand-700" />
                <p className="font-medium text-ink">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{step.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            {installations.map((installation) => (
              <div
                key={installation.installationId}
                className="rounded-[24px] border border-ink/8 bg-white/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{installation.accountLogin}</p>
                    <p className="text-sm text-ink-soft">
                      {installation.accountType} · {installation.repositoriesCount} 个仓库
                    </p>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <a href={installation.installUrl} rel="noreferrer" target="_blank">
                      查看安装
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {repositories.map((repository) => (
              <div
                key={repository.githubRepoId}
                className="rounded-[24px] border border-ink/8 bg-white/80 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-ink">{repository.fullName}</p>
                    <p className="text-sm text-ink-soft">
                      默认分支 {repository.defaultBranch} · {repository.private ? "私有" : "公共"} 仓库
                    </p>
                  </div>
                  <Badge variant={repository.alreadyImported ? "outline" : "success"}>
                    {repository.alreadyImported ? "已导入" : "可导入"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
