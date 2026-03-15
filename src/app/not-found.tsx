import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto mt-12 w-[min(800px,calc(100%-24px))] rounded-[36px] border border-white/70 bg-white/72 px-8 py-14 text-center shadow-[0_32px_100px_rgba(71,28,19,0.08)]">
      <p className="section-eyebrow mx-auto w-fit">Not Found</p>
      <h1 className="mt-6 font-serif text-5xl text-ink">页面不存在</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-ink-soft">
        当前演示前端只实现了文档定义的核心页面。请回到仓库工作台，从已存在的仓库或任务入口进入。
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link href="/dashboard">回到仪表盘</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">回到首页</Link>
        </Button>
      </div>
    </main>
  );
}
