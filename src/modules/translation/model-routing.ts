export const DEFAULT_MODEL_ID = "openrouter/auto";

const MODEL_FALLBACKS: Record<string, string[]> = {
  "openai/gpt-5.2": [DEFAULT_MODEL_ID],
  [DEFAULT_MODEL_ID]: [],
};

export function getFallbackModels(modelId: string) {
  return MODEL_FALLBACKS[modelId] ?? [DEFAULT_MODEL_ID].filter((candidate) => candidate !== modelId);
}
