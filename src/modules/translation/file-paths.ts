import { posix } from "node:path";

import { AppError } from "@/lib/errors";
import { env, hasOpenRouterConfig } from "@/lib/env";
import { outboundFetch } from "@/lib/outbound-fetch";
import { normalizePath } from "@/lib/paths";

const README_STEM = /^readme$/i;
const ASCII_ONLY = /^[\x00-\x7F]+$/;

export function sanitizeEnglishPathSegment(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "document";
  }

  if (README_STEM.test(trimmed)) {
    return "README";
  }

  const sanitized = trimmed
    .normalize("NFKD")
    .replace(/[`"'()[\]{}<>/\\|!?@#$%^&*+=~.,:;]+/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return sanitized || "document";
}

async function translateFileNameStemToEnglish(options: {
  sourceLanguage: string;
  modelId: string;
  stem: string;
}) {
  if (!hasOpenRouterConfig()) {
    throw new AppError("OPENROUTER_NOT_CONFIGURED", 503, "OpenRouter 尚未配置");
  }

  const response = await outboundFetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_PLATFORM_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.APP_BASE_URL,
      "X-Title": "GitTrans",
    },
    body: JSON.stringify({
      model: options.modelId,
      messages: [
        {
          role: "system",
          content:
            "You translate document file names into concise English slugs. Return only the English filename stem in kebab-case. Do not include file extensions, quotes, explanations, numbering, or markdown.",
        },
        {
          role: "user",
          content: `Source language: ${options.sourceLanguage}\nFilename stem: ${options.stem}`,
        },
      ],
      max_tokens: 32,
      temperature: 0,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(
      "OPENROUTER_FILENAME_TRANSLATION_FAILED",
      502,
      `OpenRouter 文件名翻译失败: ${errorText.slice(0, 200)}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError("OPENROUTER_EMPTY_RESPONSE", 502, "OpenRouter 返回了空内容");
  }

  return sanitizeEnglishPathSegment(content);
}

export async function resolveEnglishFileStem(options: {
  sourceLanguage: string;
  modelId: string;
  stem: string;
}) {
  if (!options.stem.trim()) {
    return "document";
  }

  if (README_STEM.test(options.stem)) {
    return "README";
  }

  if (ASCII_ONLY.test(options.stem)) {
    return sanitizeEnglishPathSegment(options.stem);
  }

  return translateFileNameStemToEnglish(options);
}

export function buildTranslatedOutputPath(options: {
  language: string;
  sourcePath: string;
  translatedFileName: string;
}) {
  const normalizedSourcePath = normalizePath(options.sourcePath);
  const sourceDir = posix.dirname(normalizedSourcePath);
  const extension = posix.extname(normalizedSourcePath);
  const translatedStem = sanitizeEnglishPathSegment(options.translatedFileName);
  const translatedRelativePath =
    sourceDir === "."
      ? `${translatedStem}${extension}`
      : `${sourceDir}/${translatedStem}${extension}`;

  return normalizePath(`translations/${options.language}/${translatedRelativePath}`);
}
