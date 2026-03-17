"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, GitFork, Languages, Save, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requestApi } from "@/lib/client-api";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BootstrapPayload, FileTreeItem, RepoConfig } from "@/modules/mvp/contracts";

type ConfigEditorProps = {
  config: RepoConfig;
  bootstrap: BootstrapPayload;
  files: FileTreeItem[];
  filesError?: string | null;
};

export function ConfigEditor({ config, bootstrap, files, filesError }: ConfigEditorProps) {
  const router = useRouter();
  const [baseBranch, setBaseBranch] = useState(config.baseBranch);
  const [baseLanguage, setBaseLanguage] = useState(config.baseLanguage);
  const [targetLanguages, setTargetLanguages] = useState<string[]>(config.targetLanguages);
  const [modelId, setModelId] = useState(config.modelId);
  const [ignoreRulesText, setIgnoreRulesText] = useState(config.ignoreRulesText);
  const [readmeNavigationEnabled, setReadmeNavigationEnabled] = useState(
    config.readmeNavigationEnabled,
  );
  const [selectedPaths, setSelectedPaths] = useState<string[]>(
    files.length > 0
      ? files.filter((item) => item.selected).map((item) => item.path)
      : config.includePaths,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("未保存更改");

  function toggleLanguage(code: string) {
    setTargetLanguages((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  function togglePath(path: string) {
    setSelectedPaths((current) =>
      current.includes(path) ? current.filter((item) => item !== path) : [...current, path],
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setSavedMessage("正在保存配置...");

    try {
      const payload = await requestApi<{ saved: boolean; configVersion: number }>(
        `/api/repos/${config.repoId}/config`,
        {
          method: "PUT",
          body: JSON.stringify({
            baseBranch,
            baseLanguage,
            targetLanguages,
            includePaths: selectedPaths,
            ignoreRulesText,
            modelId,
            readmeNavigationEnabled,
          }),
        },
      );

      setSavedMessage(`保存成功，配置版本 ${payload.configVersion}`);
      router.refresh();
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "保存配置失败");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Badge variant="default">翻译配置</Badge>
              <CardTitle className="mt-3">最小闭环字段已按接口文档对齐</CardTitle>
            </div>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <CardDescription>
            配置页覆盖基准分支、语言、模型、范围、ignore 规则和 README 导航开关，不加入 BYOK 与自动同步等非 MVP 功能。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-ink">基准分支</span>
              <Input value={baseBranch} onChange={(event) => setBaseBranch(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-ink">基准语言</span>
              <select
                className="flex h-11 w-full rounded-2xl border border-ink/12 bg-white/90 px-4 text-sm text-ink outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100/70"
                onChange={(event) => setBaseLanguage(event.target.value)}
                value={baseLanguage}
              >
                {bootstrap.languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.name} · {language.englishName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <Languages className="h-4 w-4 text-brand-700" />
              目标语言
            </div>
            <div className="flex flex-wrap gap-2">
              {bootstrap.languages
                .filter((language) => language.code !== baseLanguage)
                .map((language) => (
                  <button
                    key={language.code}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      targetLanguages.includes(language.code)
                        ? "border-brand-500 bg-brand-600 text-white"
                        : "border-ink/10 bg-white/80 text-ink-soft hover:border-brand-300 hover:text-brand-700",
                    )}
                    onClick={() => toggleLanguage(language.code)}
                    type="button"
                  >
                    {language.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <GitFork className="h-4 w-4 text-brand-700" />
              模型选择
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {bootstrap.models.map((model) => (
                <button
                  key={model.id}
                  className={cn(
                    "rounded-[24px] border p-4 text-left transition-colors",
                    modelId === model.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-ink/10 bg-white/80 hover:border-brand-300",
                  )}
                  onClick={() => setModelId(model.id)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink">{model.name}</p>
                      <p className="text-sm text-ink-soft">{model.id}</p>
                    </div>
                    {model.recommended ? <Badge variant="success">推荐</Badge> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">README 导航区</p>
                <p className="text-sm text-ink-soft">任务详情页会直接显示导航区预览</p>
              </div>
              <button
                aria-pressed={readmeNavigationEnabled}
                className={cn(
                  "inline-flex h-10 w-20 items-center rounded-full p-1 transition-colors",
                  readmeNavigationEnabled ? "bg-brand-600" : "bg-ink/10",
                )}
                onClick={() => setReadmeNavigationEnabled((current) => !current)}
                type="button"
              >
                <span
                  className={cn(
                    "h-8 w-8 rounded-full bg-white shadow transition-transform",
                    readmeNavigationEnabled ? "translate-x-10" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-ink">Ignore 规则</span>
            <Textarea
              onChange={(event) => setIgnoreRulesText(event.target.value)}
              value={ignoreRulesText}
            />
          </label>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">文件范围</CardTitle>
            <CardDescription>
              自动突出显示可翻译、已选择和被 ignore 排除的文件状态。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filesError ? (
              <div className="rounded-[22px] border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-7 text-amber-700">
                {filesError}
              </div>
            ) : null}
            {files.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-ink/12 bg-white/80 px-4 py-6 text-sm leading-7 text-ink-soft">
                当前还没有可展示的仓库文件树。基础配置仍然可以保存，等 GitHub 安装与仓库权限就绪后再读取实时文件列表。
              </div>
            ) : null}
            {files.map((item) => (
              <label
                key={item.path}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-[22px] border px-4 py-3 transition-colors",
                  item.ignored
                    ? "border-rose-100 bg-rose-50/60"
                    : item.selected
                      ? "border-brand-200 bg-brand-50/60"
                      : "border-ink/8 bg-white/80",
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      checked={selectedPaths.includes(item.path)}
                      className="h-4 w-4 accent-[#c53d22]"
                      disabled={item.ignored || !item.translatable}
                      onChange={() => togglePath(item.path)}
                      type="checkbox"
                    />
                    <span className="text-sm font-medium text-ink">{item.path}</span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {item.ignored
                      ? "已被 ignore 规则排除"
                      : item.translatable
                        ? "Markdown 文件，可纳入翻译范围"
                        : "目录或非 Markdown 项"}
                  </p>
                </div>
                {item.ignored ? <Badge variant="danger">Ignored</Badge> : null}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">保存状态</CardTitle>
            <CardDescription>保存会直接调用 `PUT /api/repos/:repoId/config`。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-brand-100 bg-brand-50/70 p-4 text-sm leading-7 text-ink-soft">
              <p>当前分支：{baseBranch}</p>
              <p>目标语言：{targetLanguages.length} 个</p>
              <p>选中文件/规则：{selectedPaths.length} 条 include 项</p>
            </div>
            <p className="text-sm leading-6 text-ink-soft">{savedMessage}</p>
            <Button
              disabled={isSaving || targetLanguages.length === 0 || selectedPaths.length === 0}
              onClick={handleSave}
            >
              {isSaving ? "保存中..." : "保存配置"}
              <Save className="h-4 w-4" />
            </Button>
            <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-7 text-emerald-700">
              <p className="font-medium">MVP 边界确认</p>
              <p>平台托管 Key 已固定为开启；BYOK、失败重试、Webhook 开关均不出现在当前页面。</p>
            </div>
            <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
              <div className="mb-2 flex items-center gap-2 text-ink">
                <CheckCheck className="h-4 w-4 text-brand-700" />
                表单校验约束
              </div>
              <p>`targetLanguages` 至少保留 1 个。</p>
              <p>`includePaths` 至少保留 1 项。</p>
              <p>`ignoreRulesText` 按纯文本编辑即可，不需要结构化对象。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
