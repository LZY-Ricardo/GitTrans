import assert from "node:assert/strict";

import { collectPublishedReadmeLanguages } from "./published-languages.ts";

assert.deepEqual(
  collectPublishedReadmeLanguages({
    targetLanguages: ["en", "ja", "fr"],
    items: [
      { filePath: "README.md", language: "en", status: "succeeded" },
      { filePath: "README.md", language: "ja", status: "failed" },
      { filePath: "docs/guide.md", language: "fr", status: "succeeded" },
    ],
  }),
  ["en"],
);

assert.deepEqual(
  collectPublishedReadmeLanguages({
    targetLanguages: ["en", "ja"],
    items: [
      { filePath: "README.md", language: "ja", status: "succeeded" },
      { filePath: "README.md", language: "en", status: "succeeded" },
    ],
  }),
  ["en", "ja"],
);

console.log("published-languages spec passed");
