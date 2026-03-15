import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const bodyFont = Noto_Sans_SC({
  variable: "--font-body",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Noto_Serif_SC({
  variable: "--font-display",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GitTrans",
    template: "%s | GitTrans",
  },
  description: "GitTrans SaaS MVP 前端，聚焦 GitHub 文档仓库的多语言翻译接入与任务追踪。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${bodyFont.variable} ${displayFont.variable}`} lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
