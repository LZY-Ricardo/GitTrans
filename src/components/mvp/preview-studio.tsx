"use client";

import { useState } from "react";
import { BookOpenText, FileText, Languages } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskPreview } from "@/modules/mvp/contracts";

type PreviewStudioProps = {
  previews: TaskPreview[];
};

export function PreviewStudio({ previews }: PreviewStudioProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePreview = previews[activeIndex];

  if (!activePreview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>暂无预览</CardTitle>
          <CardDescription>当前任务尚未返回单文件翻译预览。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="default">结果预览</Badge>
              <CardTitle className="mt-3 text-2xl">按文件与语言切换</CardTitle>
            </div>
            <Languages className="h-5 w-5 text-brand-700" />
          </div>
          <CardDescription>当前前端按接口文档支持单文件维度预览，不实现全文 Diff 工作台。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {previews.map((preview, index) => (
            <button
              key={`${preview.sourcePath}-${preview.targetLanguage}`}
              className={cn(
                "w-full rounded-[22px] border p-4 text-left transition-colors",
                index === activeIndex
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink/8 bg-white/80 hover:border-brand-300",
              )}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <p className="font-medium text-ink">{preview.sourcePath}</p>
              <p className="mt-1 text-sm text-ink-soft">{preview.targetPath}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activePreview.targetLanguage}</Badge>
              <Badge variant="muted">{activePreview.targetPath}</Badge>
            </div>
            <CardTitle className="text-2xl">README / Markdown 内容对照</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-ink/8 bg-paper p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-ink">
                <BookOpenText className="h-4 w-4 text-brand-700" />
                原文
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-ink-soft">
                {activePreview.sourceContent}
              </pre>
            </div>
            <div className="rounded-[24px] border border-brand-100 bg-brand-50/60 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-brand-800">
                <FileText className="h-4 w-4" />
                译文
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-7 text-brand-900/90">
                {activePreview.translatedContent}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
