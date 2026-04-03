import assert from "node:assert/strict";

import { DEFAULT_MODEL_ID, getFallbackModels } from "./model-routing.ts";

assert.equal(DEFAULT_MODEL_ID, "openrouter/auto");
assert.deepEqual(getFallbackModels("openai/gpt-5.2"), ["openrouter/auto"]);
assert.deepEqual(getFallbackModels("openrouter/auto"), []);

console.log("model-routing spec passed");
