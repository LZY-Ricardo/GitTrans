import Link from "next/link";
import { ArrowRight, FolderGit2, Languages, Sparkles, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HomePageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const valueProps = [
  {
    title: "GitHub 接入",
    icon: FolderGit2,
  },
  {
    title: "多语言输出",
    icon: Languages,
  },
  {
    title: "任务可追踪",
    icon: Workflow,
  },
];

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const error = params?.error ?? null;
  const errorMessage =
    error === "github_network_unreachable"
      ? "GitHub 登录失败：后端无法连接 github.com:443。请开启 VPN/代理，或在 .env 设置 HTTPS_PROXY 后重试。"
      : error === "github_auth_failed"
        ? "GitHub 登录失败：请回到首页重新点击“使用 GitHub 登录”再试一次。"
        : null;

  return (
    <main className="pb-16">
      <div className="mx-auto mt-4 w-[min(1200px,calc(100%-24px))]">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/70 bg-paper/88 px-5 py-3 shadow-[0_20px_80px_rgba(71,28,19,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(140,31,22,0.25)]">
              GT
            </div>
            <div>
              <p className="font-serif text-xl text-ink">GitTrans</p>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">文档翻译平台</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/dashboard">
                进入控制台
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <div className="mt-5 rounded-[28px] border border-rose-100 bg-rose-50/70 p-5 text-sm leading-7 text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="hero-mesh mt-8 overflow-hidden rounded-[40px] border border-white/70 px-6 py-10 shadow-[0_32px_100px_rgba(71,28,19,0.08)] md:px-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <p className="section-eyebrow">GitHub 文档多语言管理</p>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-serif text-5xl leading-tight text-ink md:text-7xl">
                  让 GitHub 文档仓库
                  <span className="paper-accent"> 在一个工作台里完成多语言接入</span>
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    查看控制台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/settings">查看产品设置</Link>
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "6", label: "核心页面" },
                  { value: "17", label: "核心能力覆盖" },
                  { value: "1", label: "视觉主题" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[28px] border border-white/70 bg-white/78 p-5">
                    <p className="font-serif text-4xl text-brand-700">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-soft">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="hero-mesh">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Badge variant="default">使用流程</Badge>
                    <CardTitle className="mt-3 text-3xl">开始使用</CardTitle>
                  </div>
                  <Sparkles className="h-5 w-5 text-brand-700" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "连接 GitHub 账号并完成授权",
                  "导入仓库并同步文档内容",
                  "配置目标语言与翻译范围",
                  "发起文档翻译任务",
                  "查看翻译结果与导航预览",
                  "回到 GitHub 查看变更记录",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-4 rounded-[24px] border border-white/70 bg-white/72 p-4"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="pt-2 text-sm leading-7 text-ink">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {valueProps.map((item) => {
            const Icon = item.icon;
            return (
                <Card key={item.title}>
                  <CardHeader>
                    <div className="rounded-full bg-brand-50 p-3 text-brand-700 w-fit">
                      <Icon className="h-5 w-5" />
                    </div>
                  <CardTitle className="mt-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-ink-soft" />
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
