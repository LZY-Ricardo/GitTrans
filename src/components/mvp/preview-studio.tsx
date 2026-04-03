"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpenText, FileText, Languages } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TaskPreview } from "@/modules/mvp/contracts";
import { getLanguageLabel } from "@/modules/mvp/labels";

type PreviewStudioProps = {
  previews: TaskPreview[];
  prUrl?: string | null;
};

export function PreviewStudio({ previews, prUrl }: PreviewStudioProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePreview = previews[activeIndex];

  if (!activePreview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>暂无结果预览</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Badge variant="default">结果预览</Badge>
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl md:text-3xl">原文与译文对照</CardTitle>
              <Languages className="h-5 w-5 text-brand-700" />
            </div>
          </div>
          {prUrl ? (
            <Button asChild variant="secondary">
              <a href={prUrl} rel="noreferrer" target="_blank">
                查看 PR
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="max-h-[860px] space-y-3 overflow-y-auto pr-1">
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
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={index === activeIndex ? "default" : "outline"}>
                  {getLanguageLabel(preview.targetLanguage)}
                </Badge>
              </div>
              <p className="mt-3 font-medium text-ink">{preview.sourcePath}</p>
              <p className="mt-1 text-sm leading-6 text-ink-soft">{preview.targetPath}</p>
            </button>
          ))}
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <section className="rounded-[28px] border border-ink/8 bg-paper p-5">
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <BookOpenText className="h-4 w-4 text-brand-700" />
                原文
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{getLanguageLabel(activePreview.targetLanguage)}</Badge>
                <Badge variant="muted">{activePreview.sourcePath}</Badge>
              </div>
            </div>
            <div className="min-h-[560px] max-h-[760px] overflow-auto rounded-[20px] border border-ink/8 bg-white/70 p-5">
              <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-ink-soft">
                {activePreview.sourceContent}
              </pre>
            </div>
          </section>

          <section className="rounded-[28px] border border-brand-100 bg-brand-50/60 p-5">
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-800">
                <FileText className="h-4 w-4" />
                译文
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{getLanguageLabel(activePreview.targetLanguage)}</Badge>
                <Badge variant="muted">{activePreview.targetPath}</Badge>
              </div>
            </div>
            <div className="min-h-[560px] max-h-[760px] overflow-auto rounded-[20px] border border-brand-100 bg-white/80 p-5">
              <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-brand-900/90">
                {activePreview.translatedContent}
              </pre>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
