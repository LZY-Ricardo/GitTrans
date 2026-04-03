import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

import { SiteHeader } from "@/components/layout/site-header";

type AppShellProps = {
  title: string;
  description: string;
  eyebrow: string;
  actions?: ReactNode;
  children: ReactNode;
  mainClassName?: string;
};

export async function AppShell({
  title,
  description,
  eyebrow,
  actions,
  children,
  mainClassName,
}: AppShellProps) {
  return (
    <div>
      <SiteHeader />
      <main className={cn("mx-auto mt-4 w-[min(1200px,calc(100%-16px))] md:mt-8 md:w-[min(1200px,calc(100%-24px))]", mainClassName)}>
        <section className="grid gap-6 rounded-[28px] border border-white/70 bg-white/62 px-4 py-6 shadow-[0_32px_100px_rgba(71,28,19,0.08)] backdrop-blur-xl sm:px-6 sm:py-8 md:gap-8 md:rounded-[36px] md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="section-eyebrow">{eyebrow}</p>
              <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl md:text-5xl">{title}</h1>
              {description ? <p className="max-w-2xl text-base leading-8 text-ink-soft md:text-lg">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>

          {children}
        </section>
      </main>
    </div>
  );
}
