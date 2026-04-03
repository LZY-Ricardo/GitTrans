"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requestApi } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { DemoSession } from "@/modules/mvp/contracts";

type AccountMenuProps = {
  session: DemoSession;
};

export function AccountMenu({ session }: AccountMenuProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setLogoutError(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setLogoutError(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await requestApi<{ loggedOut: boolean }>("/api/auth/logout", {
        method: "POST",
      });

      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "退出登录失败，请稍后重试");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-white/80 bg-white/88 px-2 py-1 shadow-[0_8px_24px_rgba(34,24,21,0.12)] transition-colors hover:border-brand-200 hover:bg-white"
        onClick={() => {
          setOpen((current) => !current);
          setLogoutError(null);
        }}
        type="button"
      >
        {session.user.avatarUrl ? (
          <img
            alt={session.user.name}
            className="h-10 w-10 rounded-full object-cover"
            src={session.user.avatarUrl}
          />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {session.user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <ChevronDown
          className={cn("h-4 w-4 text-ink-soft transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+12px)] z-50 w-72 rounded-[28px] border border-white/80 bg-paper/96 p-4 shadow-[0_24px_80px_rgba(34,24,21,0.18)] backdrop-blur-xl"
          role="menu"
        >
          <div className="space-y-1 border-b border-ink/8 pb-4">
            <p className="text-sm font-semibold text-ink">{session.user.name}</p>
            <p className="text-sm text-ink-soft">@{session.user.githubLogin}</p>
          </div>

          <div className="pt-4">
            {logoutError ? (
              <div className="mb-3 rounded-[20px] border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {logoutError}
              </div>
            ) : null}
            <Button
              className="w-full justify-between"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
              variant="ghost"
            >
              {isLoggingOut ? "退出中..." : "退出登录"}
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
