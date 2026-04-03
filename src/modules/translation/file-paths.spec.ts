import assert from "node:assert/strict";

import {
  buildTranslatedOutputPath,
  sanitizeEnglishPathSegment,
} from "./file-paths.ts";

assert.equal(sanitizeEnglishPathSegment(" Quick Start Guide "), "quick-start-guide");
assert.equal(sanitizeEnglishPathSegment("README"), "readme");
assert.equal(
  buildTranslatedOutputPath({
    language: "ja",
    sourcePath: "docs/入门指南.md",
    translatedFileName: "Quick Start Guide",
  }),
  "translations/ja/docs/quick-start-guide.md",
);
assert.equal(
  buildTranslatedOutputPath({
    language: "fr",
    sourcePath: "README.md",
    translatedFileName: "README",
  }),
  "translations/fr/README.md",
);

console.log("file-paths spec passed");
