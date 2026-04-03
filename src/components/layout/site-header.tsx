import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentSessionPayload } from "@/modules/mvp/page-data";

const navItems = [
  { href: "/dashboard", label: "仓库", icon: LayoutDashboard },
  { href: "/settings", label: "设置", icon: Settings },
];

export async function SiteHeader() {
  const session = await getCurrentSessionPayload();

  return (
    <header className="sticky top-4 z-40 mx-auto w-[min(1200px,calc(100%-24px))] rounded-full border border-white/70 bg-paper/88 px-4 py-3 shadow-[0_20px_80px_rgba(71,28,19,0.12)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(140,31,22,0.25)]">
              GT
            </div>
            <div>
              <p className="font-serif text-xl text-ink">GitTrans</p>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-soft">MVP Frontend</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
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
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-ink">{session.user.name}</p>
                <p className="text-xs text-ink-soft">@{session.user.githubLogin}</p>
              </div>
              {session.user.avatarUrl ? (
                <img
                  alt={session.user.name}
                  className="h-10 w-10 rounded-full border border-white/80 object-cover shadow-[0_8px_24px_rgba(34,24,21,0.12)]"
                  src={session.user.avatarUrl}
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {session.user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              {session.githubApp.installUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={session.githubApp.installUrl} rel="noreferrer" target="_blank">
                    GitHub App
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
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
