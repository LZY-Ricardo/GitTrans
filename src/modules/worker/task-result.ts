import { TaskStatus } from "@prisma/client";

export function deriveTaskResult(options: {
  progressDone: number;
  progressFailed: number;
  firstItemError: string | null;
  hasFileMutations: boolean;
}) {
  const allFailed = options.progressDone === 0 && options.progressFailed > 0;

  return {
    finalStatus: allFailed ? TaskStatus.failed : TaskStatus.succeeded,
    errorSummary: allFailed ? options.firstItemError ?? "全部翻译任务项均失败" : null,
    shouldPublishArtifacts: options.hasFileMutations && !allFailed,
  };
}
