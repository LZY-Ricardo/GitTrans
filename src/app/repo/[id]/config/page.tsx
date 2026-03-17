import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ConfigEditor } from "@/components/mvp/config-editor";
import { Button } from "@/components/ui/button";
import { getRepoConfigPageData, isNotFoundError } from "@/modules/mvp/page-data";

type RepoConfigPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RepoConfigPage({ params }: RepoConfigPageProps) {
  const { id } = await params;
  let repo;
  let config;
  let files;
  let filesError;
  let bootstrap;

  try {
    ({ repo, config, files, filesError, bootstrap } = await getRepoConfigPageData(id));
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
            <Link href={`/repo/${repo.id}`}>回到仓库详情</Link>
          </Button>
          {repo.latestTask ? (
            <Button asChild>
              <Link href={`/task/${repo.latestTask.id}`}>查看当前任务</Link>
            </Button>
          ) : null}
        </>
      }
      description="配置页对齐 `GET/PUT /api/repos/:repoId/config` 与 `GET /api/repos/:repoId/files`，所有字段都能直接映射到后端契约。"
      eyebrow="Configuration Workspace"
      title={`${repo.fullName} · 翻译配置`}
    >
      <ConfigEditor bootstrap={bootstrap} config={config} files={files} filesError={filesError} />
    </AppShell>
  );
}
