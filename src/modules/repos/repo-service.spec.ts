import assert from "node:assert/strict";

import { AppError } from "@/lib/errors";

import { shouldRetryRepositoryFilesWithDefaultBranch } from "./repo-service.ts";

assert.equal(
  shouldRetryRepositoryFilesWithDefaultBranch({
    error: new AppError("GITHUB_RESOURCE_NOT_FOUND", 404, "missing"),
    requestedRef: "feature/docs",
    defaultBranch: "main",
  }),
  true,
);

assert.equal(
  shouldRetryRepositoryFilesWithDefaultBranch({
    error: new AppError("GITHUB_RESOURCE_NOT_FOUND", 404, "missing"),
    requestedRef: "main",
    defaultBranch: "main",
  }),
  false,
);

assert.equal(
  shouldRetryRepositoryFilesWithDefaultBranch({
    error: new AppError("GITHUB_FORBIDDEN", 403, "forbidden"),
    requestedRef: "feature/docs",
    defaultBranch: "main",
  }),
  false,
);

console.log("repo-service spec passed");
