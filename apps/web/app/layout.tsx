import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "学习卡片",
  description: "粘贴 AI 回答，自动提取知识卡片",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-200">
        {/* Sticky header — 参考 cankao.html 设计 */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">卡</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight">学习卡片</h1>
              </Link>
            </div>
            <Link
              href="/settings"
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              API 配置
            </Link>
          </div>
        </header>
        <Suspense fallback={<div className="text-center py-20 text-slate-400">加载中...</div>}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Suspense>
      </body>
    </html>
  );
}
