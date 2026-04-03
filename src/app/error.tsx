"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-[min(720px,calc(100%-24px))] items-center py-10">
      <section className="grid w-full gap-6 rounded-[32px] border border-rose-100 bg-white/80 p-6 shadow-[0_24px_80px_rgba(71,28,19,0.08)] backdrop-blur-xl md:p-8">
        <div className="space-y-3">
          <p className="section-eyebrow">系统异常</p>
          <h1 className="font-serif text-3xl text-ink md:text-4xl">当前页面暂时无法完成加载</h1>
          <p className="text-sm leading-7 text-ink-soft">
            {error.message || "服务内部错误，请稍后重试。"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => reset()}>重试</Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">回到控制台</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
