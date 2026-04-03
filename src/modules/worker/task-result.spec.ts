import assert from "node:assert/strict";

import { deriveTaskResult } from "./task-result";

const failedResult = deriveTaskResult({
  progressDone: 0,
  progressFailed: 2,
  firstItemError: "OpenRouter 翻译失败: 当前模型在所在区域不可用",
  hasFileMutations: false,
});

assert.equal(failedResult.finalStatus, "failed");
assert.equal(failedResult.errorSummary, "OpenRouter 翻译失败: 当前模型在所在区域不可用");
assert.equal(failedResult.shouldPublishArtifacts, false);

const succeededResult = deriveTaskResult({
  progressDone: 1,
  progressFailed: 1,
  firstItemError: "某个文件翻译失败",
  hasFileMutations: true,
});

assert.equal(succeededResult.finalStatus, "succeeded");
assert.equal(succeededResult.errorSummary, null);
assert.equal(succeededResult.shouldPublishArtifacts, true);

console.log("task-result spec passed");
