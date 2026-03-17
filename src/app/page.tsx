import Link from "next/link";
import { ArrowRight, FolderGit2, Languages, Sparkles, Workflow } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HomePageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const valueProps = [
  {
    title: "接 GitHub，不接命令行",
    description: "用登录、安装、仓库导入和配置页完成首次接入，避免要求用户理解 Actions 或 CI。",
    icon: FolderGit2,
  },
  {
    title: "多语言输出固定",
    description: "MVP 只处理 Markdown / README，并统一写入 translations/{lang}/... 结构。",
    icon: Languages,
  },
  {
    title: "同步链路可追踪",
    description: "任务详情页直接暴露进度、当前文件、README 导航预览和 PR 去向。",
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
              <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">SaaS MVP Frontend</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline">中国红主题</Badge>
            <Button asChild variant="ghost">
              <Link href="/settings">MVP 边界</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                进入演示控制台
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
              <p className="section-eyebrow">Zero-config Translation Loop</p>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-serif text-5xl leading-tight text-ink md:text-7xl">
                  让 GitHub 文档仓库
                  <span className="paper-accent"> 在一个工作台里完成多语言接入</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-ink-soft">
                  这版前端只做 MVP 闭环：登录、导入仓库、配置语言与范围、触发全量或增量翻译、查看任务进度和 PR 去向。
                  不加入图片翻译、BYOK、人工审校等后置功能。
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    查看仓库工作台
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/settings">查看账户与运行边界</Link>
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { value: "6", label: "页面路由" },
                  { value: "17", label: "MVP 接口映射" },
                  { value: "1", label: "中国红主色体系" },
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
                    <Badge variant="default">MVP 流程</Badge>
                    <CardTitle className="mt-3 text-3xl">前端按文档收敛后的最小闭环</CardTitle>
                  </div>
                  <Sparkles className="h-5 w-5 text-brand-700" />
                </div>
                <CardDescription>
                  所有步骤都对应 `docs/MVP接口文档.md` 中已定义的页面与字段，不引入额外业务能力。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "GitHub 登录 / 安装 GitHub App",
                  "导入公共仓库并拉取文件树",
                  "选择目标语言、模型和路径范围",
                  "触发全量或增量翻译任务",
                  "查看 README 导航预览与单文件结果",
                  "跳转到 GitHub Pull Request",
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
                <CardContent className="text-sm leading-7 text-ink-soft">{item.description}</CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
