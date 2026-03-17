import { AppError } from "@/lib/errors";
import { env, hasOpenRouterConfig } from "@/lib/env";
import { outboundFetch } from "@/lib/outbound-fetch";

const CODE_FENCE_REGEX = /```[\s\S]*?```/g;
const MAX_CHARS_PER_CHUNK = 3500;

type Segment =
  | { type: "code"; content: string }
  | { type: "text"; content: string };

function splitMarkdownIntoSegments(markdown: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of markdown.matchAll(CODE_FENCE_REGEX)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({
        type: "text",
        content: markdown.slice(lastIndex, index)
      });
    }

    segments.push({
      type: "code",
      content: match[0]
    });

    lastIndex = index + match[0].length;
  }

  if (lastIndex < markdown.length) {
    segments.push({
      type: "text",
      content: markdown.slice(lastIndex)
    });
  }

  return segments;
}

function splitTextSegment(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return [text];
  }

  const blocks = normalized.split(/\n(?=# )/g);
  const chunks: string[] = [];
  let buffer = "";

  for (const block of blocks) {
    if ((buffer + "\n" + block).length > MAX_CHARS_PER_CHUNK && buffer) {
      chunks.push(buffer);
      buffer = block;
      continue;
    }

    buffer = buffer ? `${buffer}\n${block}` : block;
  }

  if (buffer) {
    chunks.push(buffer);
  }

  return chunks;
}

async function translateChunk(options: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  modelId: string;
}) {
  if (!hasOpenRouterConfig()) {
    throw new AppError("OPENROUTER_NOT_CONFIGURED", 503, "OpenRouter 尚未配置");
  }

  const systemPrompt =
    "You translate Markdown documentation. Preserve markdown structure, headings, tables, blockquotes, HTML tags, HTML comments, URLs, file paths, command names, variable names, frontmatter keys, inline code, and fenced code blocks. Only return the translated markdown fragment without explanations.";

  const response = await outboundFetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_PLATFORM_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.APP_BASE_URL,
      "X-Title": "GitTrans"
    },
    body: JSON.stringify({
      model: options.modelId,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Source language: ${options.sourceLanguage}\nTarget language: ${options.targetLanguage}\n\nTranslate the following markdown fragment:\n\n${options.text}`
        }
      ],
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError(
      "OPENROUTER_TRANSLATION_FAILED",
      502,
      `OpenRouter 翻译失败: ${errorText.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new AppError("OPENROUTER_EMPTY_RESPONSE", 502, "OpenRouter 返回了空内容");
  }

  return content;
}

export async function translateMarkdown(options: {
  markdown: string;
  sourceLanguage: string;
  targetLanguage: string;
  modelId: string;
}) {
  const segments = splitMarkdownIntoSegments(options.markdown);
  let translated = "";

  for (const segment of segments) {
    if (segment.type === "code") {
      translated += segment.content;
      continue;
    }

    const chunks = splitTextSegment(segment.content);

    for (const chunk of chunks) {
      if (!chunk.trim()) {
        translated += chunk;
        continue;
      }

      translated += await translateChunk({
        text: chunk,
        sourceLanguage: options.sourceLanguage,
        targetLanguage: options.targetLanguage,
        modelId: options.modelId
      });
    }
  }

  return translated;
}
