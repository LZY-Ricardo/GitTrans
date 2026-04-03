import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, Settings } from "lucide-react";

import { AccountMenu } from "@/components/layout/account-menu";
import { Button } from "@/components/ui/button";
import { getCurrentSessionPayload } from "@/modules/mvp/page-data";

const navItems = [
  { href: "/dashboard", label: "仓库", icon: LayoutDashboard },
  { href: "/settings", label: "设置", icon: Settings },
];

export async function SiteHeader() {
  const session = await getCurrentSessionPayload();

  return (
    <header className="sticky top-2 z-40 mx-auto w-[min(1200px,calc(100%-16px))] rounded-[28px] border border-white/70 bg-paper/88 px-4 py-3 shadow-[0_20px_80px_rgba(71,28,19,0.12)] backdrop-blur-xl md:top-4 md:w-[min(1200px,calc(100%-24px))] md:rounded-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 md:gap-5">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(140,31,22,0.25)]">
              GT
            </div>
            <p className="font-serif text-xl text-ink">GitTrans</p>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-800"
                  href={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              {session.githubApp.installUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={session.githubApp.installUrl} rel="noreferrer" target="_blank">
                    GitHub App
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
              <AccountMenu session={session} />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/api/auth/github/start">使用 GitHub 登录</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
