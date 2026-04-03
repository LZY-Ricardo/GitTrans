import Link from "next/link";
import { Globe, Heart } from "lucide-react";

const relatedLinks = [
  { label: "博客", href: "https://blog.sunandyu.top/" },
  { label: "GitHub 主页", href: "https://github.com/LZY-Ricardo" },
  { label: "GitTrans 仓库", href: "https://github.com/LZY-Ricardo/GitTrans" },
];

const openSourceLinks = [
  { label: "GitHub", href: "https://github.com/LZY-Ricardo" },
  { label: "GitTrans", href: "https://github.com/LZY-Ricardo/GitTrans" },
];

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/70 bg-white/92">
      <div className="mx-auto grid w-[min(1200px,calc(100%-16px))] gap-6 px-4 py-8 md:w-[min(1200px,calc(100%-24px))] md:grid-cols-[1.3fr_0.9fr_0.8fr] md:px-6">
        <div className="space-y-3">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 text-white">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="font-serif text-2xl text-ink">GitTrans</p>
            </div>
          </Link>
          <p className="max-w-xl text-sm leading-7 text-ink-soft">
            GitHub 仓库多语言翻译 SaaS 平台。
          </p>
          <div className="flex items-center gap-2 text-sm text-ink-soft">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-brand-500 text-brand-500" />
            <a
              className="font-medium text-ink transition-colors hover:text-brand-700"
              href="https://github.com/LZY-Ricardo"
              rel="noreferrer"
              target="_blank"
            >
              by LZY-Ricardo
            </a>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">相关链接</p>
          <div className="grid gap-2 text-sm text-ink-soft">
            {relatedLinks.map((item) => (
              <a
                key={item.href}
                className="transition-colors hover:text-brand-700"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">开源项目</p>
          <div className="grid gap-2 text-sm text-ink-soft">
            {openSourceLinks.map((item) => (
              <a
                key={item.href}
                className="transition-colors hover:text-brand-700"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
