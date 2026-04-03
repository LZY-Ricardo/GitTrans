import { ArrowUpRight, KeyRound, ShieldCheck, UserCircle2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettingsPageData } from "@/modules/mvp/page-data";

export default async function SettingsPage() {
  const { session, bootstrap } = await getSettingsPageData();

  return (
    <AppShell
      description=""
      eyebrow="账户中心"
      title="设置"
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="self-start overflow-hidden">
          <CardHeader className="gap-6 border-b border-ink/6 pb-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {session?.user.avatarUrl ? (
                <img
                  alt={session.user.name}
                  className="h-20 w-20 rounded-full border border-white/80 object-cover shadow-[0_14px_36px_rgba(34,24,21,0.14)]"
                  src={session.user.avatarUrl}
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
                  {(session?.user.name ?? "访客").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={session?.authenticated ? "success" : "outline"}>
                    {session?.authenticated ? "已登录" : "未登录"}
                  </Badge>
                  <Badge variant="outline">
                    {session ? `@${session.user.githubLogin}` : "GitHub 未连接"}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-3xl">{session?.user.name ?? "访客"}</CardTitle>
                  <p className="mt-2 text-sm text-ink-soft">
                    {session ? "GitHub 账户已连接" : "请先完成 GitHub 登录"}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-ink-soft">昵称</p>
                <p className="mt-3 text-lg font-medium text-ink">{session?.user.name ?? "访客"}</p>
              </div>
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-ink-soft">GitHub</p>
                <p className="mt-3 text-lg font-medium text-ink">
                  {session ? `@${session.user.githubLogin}` : "未连接"}
                </p>
              </div>
              <div className="rounded-[24px] border border-ink/8 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-ink-soft">Session</p>
                <p className="mt-3 text-lg font-medium text-ink">
                  {session?.authenticated ? "有效" : "无"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-brand-100 bg-brand-50/45 p-4 md:grid-cols-3">
              <div className="rounded-[20px] bg-white/85 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-ink-soft">GitHub</p>
                <p className="mt-2 font-medium text-ink">{session ? "已连接" : "未连接"}</p>
              </div>
              <div className="rounded-[20px] bg-white/85 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-ink-soft">Session</p>
                <p className="mt-2 font-medium text-ink">{session?.authenticated ? "有效" : "无"}</p>
              </div>
              <div className="rounded-[20px] bg-white/85 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-ink-soft">Key</p>
                <p className="mt-2 font-medium text-ink">平台托管</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full bg-brand-50 p-3 text-brand-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <Badge variant={session?.githubApp.installUrl ? "success" : "outline"}>
                  {session?.githubApp.installUrl ? "可用" : "未配置"}
                </Badge>
              </div>
              <CardTitle>GitHub App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-ink-soft">
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-[20px] border border-ink/8 bg-white/80 px-4 py-3">
                  <span>登录</span>
                  <span className="font-medium text-ink">{session?.authenticated ? "已连接" : "未连接"}</span>
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-ink/8 bg-white/80 px-4 py-3">
                  <span>安装入口</span>
                  <span className="font-medium text-ink">{session?.githubApp.installUrl ? "已提供" : "不可用"}</span>
                </div>
              </div>
              {session?.githubApp.installUrl ? (
                <Button asChild className="w-full" variant="secondary">
                  <a href={session.githubApp.installUrl} rel="noreferrer" target="_blank">
                    查看安装
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full bg-brand-50 p-3 text-brand-700">
                  <KeyRound className="h-5 w-5" />
                </div>
                <Badge variant="success">平台托管</Badge>
              </div>
              <CardTitle>模型与密钥</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-ink-soft">
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">平台托管 Key</Badge>
                <Badge variant={bootstrap.features.byokEnabled ? "warning" : "outline"}>
                  BYOK {bootstrap.features.byokEnabled ? "已开启" : "关闭"}
                </Badge>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-[20px] border border-ink/8 bg-white/80 px-4 py-3">
                  <span>可用模型</span>
                  <span className="font-medium text-ink">{bootstrap.models.length} 个</span>
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-ink/8 bg-white/80 px-4 py-3">
                  <span>密钥输入</span>
                  <span className="font-medium text-ink">关闭</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
