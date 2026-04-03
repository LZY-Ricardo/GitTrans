"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FolderGit2, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requestApi } from "@/lib/client-api";
import type { ImportableRepository, InstallationSummary } from "@/modules/mvp/contracts";

type ImportRepositoryPanelProps = {
  installations: InstallationSummary[];
  installUrl: string | null;
  installationsError?: string | null;
};

export function ImportRepositoryPanel({
  installations,
  installUrl,
  installationsError,
}: ImportRepositoryPanelProps) {
  const router = useRouter();
  const [selectedInstallationId, setSelectedInstallationId] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<ImportableRepository[]>([]);
  const [loadError, setLoadError] = useState<string | null>(installationsError ?? null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadingInstallationId, setLoadingInstallationId] = useState<string | null>(null);
  const [importingRepoId, setImportingRepoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadRepositories(installationId: string) {
    setSelectedInstallationId(installationId);
    setLoadingInstallationId(installationId);
    setLoadError(null);
    setActionMessage(null);

    startTransition(async () => {
      try {
        const data = await requestApi<{
          items: ImportableRepository[];
          pagination: { page: number; pageSize: number; total: number };
        }>(`/api/github/installations/${installationId}/repositories?page=1&pageSize=50`);

        setRepositories(data.items);
      } catch (error) {
        setRepositories([]);
        setLoadError(error instanceof Error ? error.message : "读取仓库列表失败");
      } finally {
        setLoadingInstallationId(null);
      }
    });
  }

  function importRepository(repository: ImportableRepository) {
    if (!selectedInstallationId) {
      return;
    }

    setImportingRepoId(repository.githubRepoId);
    setActionMessage(null);

    startTransition(async () => {
      try {
        const data = await requestApi<{
          repo: {
            id: string;
            fullName: string;
            defaultBranch: string;
            status: string;
          };
        }>("/api/repos/import", {
          method: "POST",
          body: JSON.stringify({
            installationId: selectedInstallationId,
            owner: repository.owner,
            name: repository.name,
          }),
        });

        router.push(`/repo/${data.repo.id}/config`);
        router.refresh();
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : "导入仓库失败");
      } finally {
        setImportingRepoId(null);
      }
    });
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="default">导入仓库</Badge>
            <CardTitle className="mt-3">选择 GitHub App 安装</CardTitle>
          </div>
          <div className="rounded-full bg-brand-50 p-3 text-brand-700">
            <FolderGit2 className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            {installations.length > 0 ? (
              installations.map((installation) => (
                <div
                  key={installation.installationId}
                  className={`w-full rounded-[24px] border p-4 text-left transition-colors ${
                    selectedInstallationId === installation.installationId
                      ? "border-brand-400 bg-brand-50/80"
                      : "border-ink/8 bg-white/80 hover:border-brand-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{installation.accountLogin}</p>
                      <p className="text-sm text-ink-soft">
                        {installation.accountType} ·{" "}
                        {installation.repositoriesCount === null
                          ? "仓库数量待 GitHub 返回"
                          : `${installation.repositoriesCount} 个仓库`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingInstallationId === installation.installationId ? (
                        <LoaderCircle className="h-4 w-4 animate-spin text-brand-700" />
                      ) : null}
                      <Button
                        onClick={() => loadRepositories(installation.installationId)}
                        size="sm"
                        variant={
                          selectedInstallationId === installation.installationId
                            ? "default"
                            : "secondary"
                        }
                      >
                        选择安装
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <a href={installation.installUrl} rel="noreferrer" target="_blank">
                          查看安装
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-ink/12 bg-white/70 p-5 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">暂无可用安装</p>
                {installationsError ? <p className="mt-2">{installationsError}</p> : null}
                {installUrl ? (
                  <Button asChild className="mt-4" size="sm">
                    <a href={installUrl} rel="noreferrer" target="_blank">
                      去安装 GitHub App
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {installations.length > 0 && loadError ? (
              <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-5 text-sm leading-7 text-rose-700">
                {loadError}
              </div>
            ) : null}
            {repositories.length === 0 && installations.length > 0 && !loadError ? (
              <div className="rounded-[24px] border border-dashed border-ink/12 bg-white/70 p-5 text-sm leading-7 text-ink-soft">
                <p className="font-medium text-ink">请选择安装</p>
              </div>
            ) : null}
            {repositories.map((repository) => (
              <div
                key={repository.githubRepoId}
                className="rounded-[24px] border border-ink/8 bg-white/80 p-4"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-ink">{repository.fullName}</p>
                    <p className="text-sm text-ink-soft">{repository.defaultBranch}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={repository.alreadyImported ? "outline" : "success"}>
                      {repository.alreadyImported ? "已导入" : "可导入"}
                    </Badge>
                    <Button
                      disabled={isPending || repository.alreadyImported}
                      onClick={() => importRepository(repository)}
                      size="sm"
                      variant={repository.alreadyImported ? "secondary" : "default"}
                    >
                      {importingRepoId === repository.githubRepoId ? "导入中..." : "导入"}
                      {importingRepoId === repository.githubRepoId ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : null}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {actionMessage ? (
              <div className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-4 text-sm leading-7 text-amber-700">
                {actionMessage}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
