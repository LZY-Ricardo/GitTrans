import { KeyRound, LockKeyhole, UserCircle2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBootstrapPayload, getDemoSession } from "@/modules/mvp/mock-data";

export default async function SettingsPage() {
  const [session, bootstrap] = await Promise.all([getDemoSession(), getBootstrapPayload()]);

  return (
    <AppShell
      description="设置页在当前版本只承载账户信息、平台能力边界和密钥策略说明。接口文档里没有进入 MVP 的设置项，这里也不会额外补充。"
      eyebrow="Platform Settings"
      title="账户与平台边界"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700 w-fit">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">当前账户</CardTitle>
            <CardDescription>登录态、头像和 GitHub 账号信息应来自 `GET /api/auth/session`。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-ink-soft">
            <p><span className="font-medium text-ink">昵称：</span>{session.user.name}</p>
            <p><span className="font-medium text-ink">GitHub：</span>@{session.user.githubLogin}</p>
            <p><span className="font-medium text-ink">Session：</span>{session.authenticated ? "已登录" : "未登录"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700 w-fit">
              <KeyRound className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">密钥策略</CardTitle>
            <CardDescription>平台托管 OpenRouter Key 是当前 P0 能力，自带 Key 保持关闭。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-ink-soft">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">平台托管 Key</Badge>
              <Badge variant={bootstrap.features.byokEnabled ? "warning" : "outline"}>
                BYOK {bootstrap.features.byokEnabled ? "已开启" : "未进入 MVP"}
              </Badge>
            </div>
            <p>前端不保存 OpenRouter Key，也不提供密钥输入表单。</p>
            <p>模型列表全部来自后端 allowlist，不在前端硬编码供应商或计费规则。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="rounded-full bg-brand-50 p-3 text-brand-700 w-fit">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">本轮不做</CardTitle>
            <CardDescription>严格按文档保持 MVP 边界，避免页面蔓延成平台后台。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-ink-soft">
            <p>不做用户自带 Key 管理。</p>
            <p>不做 Webhook 自动同步开关。</p>
            <p>不做失败任务重试、历史对比和团队权限。</p>
            <p>不做图片、Notebook、MDX、人工审校工作台。</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
