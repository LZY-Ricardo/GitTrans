"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Expand,
  FileText,
  Folder,
  FolderOpen,
  GitFork,
  Languages,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  filesNotice?: string | null;
  filesError?: string | null;
};

type FileLeafNode = {
  kind: "file";
  path: string;
  name: string;
  item: FileTreeItem;
};

type DirectoryNode = {
  kind: "dir";
  path: string;
  name: string;
  children: TreeNode[];
};

type TreeNode = FileLeafNode | DirectoryNode;

function buildFileTree(files: FileTreeItem[]) {
  const expandedPaths = new Set<string>();

  function normalize(level: Map<string, TreeNode>): TreeNode[] {
    return Array.from(level.values())
      .map((node) => {
        if (node.kind === "dir") {
          const childMap = new Map(node.children.map((child) => [child.path, child] as const));
          node.children = normalize(childMap);
        }

        return node;
      })
      .sort((left, right) => {
        if (left.kind !== right.kind) {
          return left.kind === "dir" ? -1 : 1;
        }

        return left.name.localeCompare(right.name, "zh-CN");
      });
  }

  const levelStack = new Map<string, Map<string, TreeNode>>();

  for (const item of files) {
    const segments = item.path.split("/");
    let currentPath = "";
    let key = "__root__";

    if (!levelStack.has(key)) {
      levelStack.set(key, new Map());
    }

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      const nextPath = currentPath ? `${currentPath}/${segment}` : segment;
      const currentLevel = levelStack.get(key)!;

      if (isFile) {
        currentLevel.set(nextPath, {
          kind: "file",
          path: nextPath,
          name: segment,
          item,
        });
      } else {
        let dirNode = currentLevel.get(nextPath);

        if (!dirNode || dirNode.kind !== "dir") {
          dirNode = {
            kind: "dir",
            path: nextPath,
            name: segment,
            children: [],
          };
          currentLevel.set(nextPath, dirNode);
        }

        if (!levelStack.has(nextPath)) {
          levelStack.set(nextPath, new Map());
        }

        currentPath = nextPath;
        key = nextPath;
      }
    });
  }

  for (const [path, level] of levelStack.entries()) {
    if (path === "__root__") {
      continue;
    }

    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "__root__";
    const parentLevel = levelStack.get(parentPath);
    const currentNode = parentLevel?.get(path);

    if (currentNode?.kind === "dir") {
      currentNode.children = normalize(level);
    }
  }

  return {
    nodes: normalize(levelStack.get("__root__") ?? new Map()),
    defaultExpandedPaths: Array.from(expandedPaths),
  };
}

function countSelectedFiles(files: FileTreeItem[], selectedPaths: string[]) {
  const selectedSet = new Set(selectedPaths);
  return files.filter((item) => selectedSet.has(item.path)).length;
}

function findTreeNodeByPath(nodes: TreeNode[], path: string): TreeNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }

    if (node.kind === "dir") {
      const found = findTreeNodeByPath(node.children, path);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

type TreeViewProps = {
  nodes: TreeNode[];
  expandedPaths: Set<string>;
  selectedPaths: string[];
  onToggleDirectory: (path: string) => void;
  onToggleFile: (path: string) => void;
  onToggleDirectorySelection: (path: string) => void;
};

function collectSelectableFilePaths(node: TreeNode): string[] {
  if (node.kind === "file") {
    return node.item.translatable && !node.item.ignored ? [node.path] : [];
  }

  return node.children.flatMap((child) => collectSelectableFilePaths(child));
}

function getDirectorySelectionState(node: DirectoryNode, selectedPaths: string[]) {
  const selectablePaths = collectSelectableFilePaths(node);
  const selectedSet = new Set(selectedPaths);
  const selectedCount = selectablePaths.filter((path) => selectedSet.has(path)).length;

  return {
    selectablePaths,
    allSelected: selectablePaths.length > 0 && selectedCount === selectablePaths.length,
    partiallySelected: selectedCount > 0 && selectedCount < selectablePaths.length,
  };
}

function FileTreeView({
  nodes,
  expandedPaths,
  selectedPaths,
  onToggleDirectory,
  onToggleFile,
  onToggleDirectorySelection,
}: TreeViewProps) {
  function renderNodes(items: TreeNode[], depth = 0): React.ReactNode {
    return items.map((node) => {
      if (node.kind === "dir") {
        const expanded = expandedPaths.has(node.path);
        const selectionState = getDirectorySelectionState(node, selectedPaths);

        return (
          <div key={node.path} className="space-y-2">
            <div
              className="flex items-center gap-2 rounded-2xl px-2 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-50"
              style={{ paddingLeft: `${depth * 18 + 8}px` }}
            >
              <button
                className="flex shrink-0 items-center"
                onClick={() => onToggleDirectory(node.path)}
                type="button"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-ink-soft" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
                )}
              </button>
              <input
                checked={selectionState.allSelected}
                className="h-4 w-4 shrink-0 accent-[#c53d22]"
                onChange={() => onToggleDirectorySelection(node.path)}
                ref={(element) => {
                  if (element) {
                    element.indeterminate = selectionState.partiallySelected;
                  }
                }}
                type="checkbox"
              />
              {expanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-brand-700" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-brand-700" />
              )}
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onToggleDirectory(node.path)}
                type="button"
              >
                <span className="break-all">{node.name}</span>
              </button>
            </div>
            {expanded ? <div className="space-y-2">{renderNodes(node.children, depth + 1)}</div> : null}
          </div>
        );
      }

      const selected = selectedPaths.includes(node.path);

      return (
        <label
          key={node.path}
          className={cn(
            "flex items-start justify-between gap-3 rounded-[20px] border px-3 py-3 transition-colors",
            node.item.ignored
              ? "border-rose-100 bg-rose-50/60"
              : selected
                ? "border-brand-200 bg-brand-50/60"
                : "border-ink/8 bg-white/80",
          )}
          style={{ marginLeft: `${depth * 18 + 8}px` }}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex items-start gap-2">
              <input
                checked={selected}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#c53d22]"
                disabled={node.item.ignored || !node.item.translatable}
                onChange={() => onToggleFile(node.path)}
                type="checkbox"
              />
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
              <span className="break-all text-sm font-medium text-ink">{node.name}</span>
            </div>
            <div className="pl-6">
              <p className="break-all text-xs text-ink-soft">{node.path}</p>
              <p className="text-xs text-ink-soft">{node.item.ignored ? "已排除" : "Markdown"}</p>
            </div>
          </div>
          {node.item.ignored ? <Badge variant="danger">已排除</Badge> : null}
        </label>
      );
    });
  }

  return <div className="space-y-2">{renderNodes(nodes)}</div>;
}

export function ConfigEditor({ config, bootstrap, files, filesNotice, filesError }: ConfigEditorProps) {
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
  const [isTreePreviewOpen, setIsTreePreviewOpen] = useState(false);
  const { nodes, defaultExpandedPaths } = useMemo(() => buildFileTree(files), [files]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(defaultExpandedPaths),
  );
  const selectedCount = useMemo(
    () => countSelectedFiles(files, selectedPaths),
    [files, selectedPaths],
  );

  useEffect(() => {
    setExpandedPaths(new Set(defaultExpandedPaths));
  }, [defaultExpandedPaths]);

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

  function toggleDirectory(path: string) {
    setExpandedPaths((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  }

  function toggleDirectorySelection(path: string) {
    const targetNode = findTreeNodeByPath(nodes, path);

    if (!targetNode || targetNode.kind !== "dir") {
      return;
    }

    const { selectablePaths, allSelected } = getDirectorySelectionState(targetNode, selectedPaths);

    setSelectedPaths((current) => {
      const next = new Set(current);

      if (allSelected) {
        selectablePaths.forEach((itemPath) => next.delete(itemPath));
      } else {
        selectablePaths.forEach((itemPath) => next.add(itemPath));
      }

      return Array.from(next);
    });
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
              <CardTitle className="mt-3">翻译配置</CardTitle>
            </div>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">文件范围</CardTitle>
                {files.length > 0 ? (
                  <p className="mt-2 text-sm text-ink-soft">已选择 {selectedCount} 个 Markdown 文件</p>
                ) : null}
              </div>
              {files.length > 0 ? (
                <Button onClick={() => setIsTreePreviewOpen(true)} size="sm" variant="secondary">
                  全屏预览
                  <Expand className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filesNotice ? (
              <div className="rounded-[22px] border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-7 text-sky-700">
                {filesNotice}
              </div>
            ) : null}
            {filesError ? (
              <div className="rounded-[22px] border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm text-amber-700">
                <p className="leading-7">{filesError}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard">返回仓库列表</Link>
                  </Button>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/repo/${config.repoId}`}>回到仓库详情</Link>
                  </Button>
                </div>
              </div>
            ) : null}
            {files.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-ink/12 bg-white/80 px-4 py-6 text-sm leading-7 text-ink-soft">
                暂无文件树
              </div>
            ) : null}
            {files.length > 0 ? (
              <div className="rounded-[24px] border border-ink/8 bg-white/70 p-3">
                <div className="max-h-[420px] overflow-y-auto pr-1 md:max-h-[560px]">
                  <FileTreeView
                    expandedPaths={expandedPaths}
                    nodes={nodes}
                    onToggleDirectory={toggleDirectory}
                    onToggleDirectorySelection={toggleDirectorySelection}
                    onToggleFile={togglePath}
                    selectedPaths={selectedPaths}
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">保存状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-brand-100 bg-brand-50/70 p-4 text-sm leading-7 text-ink-soft">
              <p>当前分支：{baseBranch}</p>
              <p>目标语言：{targetLanguages.length} 个</p>
              <p>选中文件/规则：{selectedPaths.length} 条 include 项</p>
            </div>
            <div
              className={cn(
                "rounded-[20px] px-4 py-3 text-sm leading-6",
                savedMessage.includes("成功")
                  ? "border border-emerald-100 bg-emerald-50/70 text-emerald-700"
                  : savedMessage.includes("正在")
                    ? "border border-amber-100 bg-amber-50/70 text-amber-700"
                    : "border border-ink/8 bg-white/80 text-ink-soft",
              )}
            >
              {savedMessage}
            </div>
            <Button
              disabled={isSaving || targetLanguages.length === 0 || selectedPaths.length === 0}
              onClick={handleSave}
            >
              {isSaving ? "保存中..." : "保存配置"}
              <Save className="h-4 w-4" />
            </Button>
            <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4 text-sm leading-7 text-ink-soft">
              <div className="mb-2 flex items-center gap-2 text-ink">
                <CheckCheck className="h-4 w-4 text-brand-700" />
                校验
              </div>
              <p>目标语言至少 1 个。</p>
              <p>Include 路径至少 1 项。</p>
              <p>Ignore 规则为纯文本。</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isTreePreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 px-4 py-6 backdrop-blur-sm">
          <div className="flex h-[min(88vh,960px)] w-full max-w-6xl flex-col rounded-[32px] border border-white/60 bg-paper shadow-[0_32px_120px_rgba(34,24,21,0.28)]">
            <div className="flex items-center justify-between gap-4 border-b border-ink/8 px-5 py-4 md:px-7">
              <div>
                <h2 className="text-2xl font-semibold text-ink">文件范围预览</h2>
                <p className="mt-1 text-sm text-ink-soft">已选择 {selectedCount} 个 Markdown 文件</p>
              </div>
              <Button
                onClick={() => setIsTreePreviewOpen(false)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
              <div className="rounded-[28px] border border-ink/8 bg-white/70 p-4">
                <FileTreeView
                  expandedPaths={expandedPaths}
                  nodes={nodes}
                  onToggleDirectory={toggleDirectory}
                  onToggleDirectorySelection={toggleDirectorySelection}
                  onToggleFile={togglePath}
                  selectedPaths={selectedPaths}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
