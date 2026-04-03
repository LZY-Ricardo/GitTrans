"use client";

import Link from "next/link";
import { GitPullRequestArrow, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { RepoStatusBadge } from "@/components/mvp/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { getLanguageLabel } from "@/modules/mvp/labels";
import type { RepoSummary } from "@/modules/mvp/contracts";

export function RepositoryList({ repos }: { repos: RepoSummary[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRepos = useMemo(
    () =>
      repos.filter((repo) => repo.fullName.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, repos],
  );

  return (
    <div className="space-y-4">
      {repos.length > 0 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            className="pl-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索已安装仓库"
            value={query}
          />
        </div>
      ) : null}

      <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="rounded-[28px] border border-ink/8 bg-white/80 p-5 transition-colors hover:border-brand-200"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <RepoStatusBadge status={repo.status} />
                  <Badge variant="outline">{repo.baseBranch}</Badge>
                  <Badge variant="muted">{repo.baseLanguage}</Badge>
                </div>
                <div>
                  <h2 className="break-all font-serif text-2xl text-ink">{repo.fullName}</h2>
                  <p className="text-sm leading-7 text-ink-soft">{formatDateTime(repo.lastSyncedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {repo.targetLanguages.map((language) => (
                    <Badge key={language} variant="outline">
                      {getLanguageLabel(language)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
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
                {repo.currentPrUrl ? (
                  <div className="rounded-[22px] border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">
                    <a className="underline" href={repo.currentPrUrl} rel="noreferrer" target="_blank">
                      查看 PR
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        ) : repos.length > 0 ? (
          <div className="rounded-[28px] border border-dashed border-ink/12 bg-white/80 p-6 text-sm leading-7 text-ink-soft">
            <p className="font-medium text-ink">没有匹配的仓库</p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-ink/12 bg-white/80 p-6 text-sm leading-7 text-ink-soft">
            <p className="font-medium text-ink">还没有导入任何仓库</p>
          </div>
        )}
      </div>
    </div>
  );
}
