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
  let filesNotice;
  let filesError;
  let bootstrap;

  try {
    ({ repo, config, files, filesNotice, filesError, bootstrap } = await getRepoConfigPageData(id));
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
      description=""
      eyebrow="Configuration Workspace"
      title={`${repo.fullName} · 翻译配置`}
    >
      <ConfigEditor
        bootstrap={bootstrap}
        config={config}
        files={files}
        filesError={filesError}
        filesNotice={filesNotice}
      />
    </AppShell>
  );
}
