# Flashcard 项目重构方案

## 概述

将 flashcard 应用从「平面结构 + Flask + Vite/JS」重构为 **Turborepo Monorepo + Python 后端模块化 + Next.js/TypeScript 前端**。

参考项目：`F:\vs code\pythen\1\turborepo-shadcn-nextjs-nestjs-prisma-starter-kit-main`
当前项目：`F:\vs code\pythen\flashcard`

---

## 一、文件变更清单

### 🗑️ 删除（不需要的文件）

| 文件 | 原因 |
|------|------|
| `frontend/src/App.css` | 全部重写为 Tailwind + CSS 变量 |
| `frontend/src/App.jsx` | 拆分为 Next.js 多页面 + 组件 |
| `frontend/src/main.jsx` | Vite 入口，Next.js 不需要 |
| `frontend/src/index.css` | 由 `globals.css` 替代 |
| `frontend/src/assets/hero.png` | Vite 模板遗留，未使用 |
| `frontend/src/assets/react.svg` | Vite 模板遗留 |
| `frontend/src/assets/vite.svg` | Vite 模板遗留 |
| `frontend/public/favicon.svg` | 替换为 flashcard 图标 |
| `frontend/public/icons.svg` | Vite 模板遗留 |
| `frontend/vite.config.js` | 不再使用 Vite |
| `frontend/eslint.config.js` | 使用共享 eslint-config |
| `frontend/.gitignore` | 由根目录 .gitignore 替代 |
| `frontend/README.md` | Vite 模板遗留 |
| `frontend/index.html` | Next.js 不需要 |
| `templates/`（目录） | 原 Flask Jinja2 模板，未使用 |
| `static/`（目录） | 原 Flask 静态文件，未使用 |
| `test_cot.py` | 逻辑已合并到 app.py 中，后续重写为 pytest |
| `test_parse.py` | 同上 |
| `test_debug.py` | 调试脚本，不再需要 |
| `cards.db` | 自动生成，不提交 |

### 📝 保留（不改内容，只移动位置）

| 文件 | 说明 |
|------|------|
| `app.py` | 保留完整内容，后续拆分为模块。**暂时放在 `apps/api/legacy_app.py`** |
| `prd.md` | 产品文档，移动到根目录 |
| `test_payload.json` | 测试数据，移动到 `apps/api/tests/` |

### 🆕 新建文件清单（按创建顺序）

```
# 第一阶段：Monorepo 骨架
flashcard/
├── package.json                 # Turborepo 根配置
├── turbo.json                   # 构建任务编排
├── .gitignore                   # 根 .gitignore
├── .prettierrc                  # Prettier 配置
├── packages/
│   ├── typescript-config/
│   │   ├── package.json
│   │   ├── base.json            # 基础 tsconfig
│   │   └── nextjs.json          # Next.js tsconfig（extends base）
│   ├── eslint-config/
│   │   ├── package.json
│   │   └── base.js              # 共享 ESLint flat config
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts         # 共享类型（Card, ParseResult, ReviewRating）

# 第二阶段：Next.js 前端
flashcard/
├── apps/web/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── components.json          # shadcn/ui 配置
│   ├── app/
│   │   ├── globals.css          # Tailwind v4 + CSS 变量（保留玻璃态设计）
│   │   ├── layout.tsx           # 根布局（字体、ClientProvider）
│   │   ├── page.tsx             # 首页（粘贴 + 卡片列表）
│   │   ├── preview/
│   │   │   └── page.tsx         # 预览/编辑页
│   │   └── review/
│   │       └── page.tsx         # 复习页
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 风格原子组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx        # domain/topic 标签
│   │   │   └── textarea.tsx
│   │   ├── parse-input.tsx      # 粘贴输入区组件
│   │   ├── card-item.tsx        # 单张卡片展示
│   │   ├── card-edit.tsx        # 可编辑卡片
│   │   ├── reasoning-panel.tsx  # CoT 推理链展示
│   │   ├── review-card.tsx      # 复习卡片
│   │   ├── date-group.tsx       # 日期分组
│   │   └── error-banner.tsx     # 错误提示
│   ├── hooks/
│   │   ├── use-cards.ts         # 卡片 CRUD
│   │   ├── use-parse.ts         # 文本解析
│   │   └── use-review.ts        # 复习逻辑
│   ├── lib/
│   │   ├── utils.ts             # cn() 工具函数
│   │   └── api.ts               # API 客户端封装
│   └── types/
│       └── index.ts             # 前端专属类型（如视图状态）

# 第三阶段：Python 后端模块化
flashcard/
├── apps/api/
│   ├── requirements.txt
│   ├── main.py                  # 入口（app.run）
│   ├── config.py                # 配置
│   ├── database.py              # 数据库操作（Repository 模式）
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── cards.py             # /api/cards
│   │   ├── parse.py             # /api/parse
│   │   └── review.py            # /api/review
│   ├── services/
│   │   ├── __init__.py
│   │   ├── parser.py            # 文本解析引擎
│   │   └── spaced_repetition.py # SM-0 算法
│   ├── models/
│   │   ├── __init__.py
│   │   └── card.py              # Card dataclass
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py          # pytest fixtures
│       ├── test_parser.py       # 解析引擎单元测试
│       └── test_api.py          # API 集成测试
```

---

## 二、各文件详细规范

### 2.1 根 package.json

```json
{
  "name": "flashcard",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=@flashcard/web",
    "dev:api": "cd apps/api && python main.py",
    "build": "turbo build",
    "lint": "turbo lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "check-types": "turbo check-types"
  },
  "devDependencies": {
    "prettier": "^3.5.3",
    "turbo": "^2.4.4",
    "typescript": "^5.8.3"
  },
  "packageManager": "bun@1.2.4",
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

### 2.2 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "check-types": {
      "dependsOn": ["^check-types"],
      "outputs": []
    },
    "format": {
      "cache": false,
      "outputs": []
    }
  }
}
```

### 2.3 packages/shared/src/index.ts — 共享类型

```typescript
/** 数据库卡片模型（匹配 cards 表结构） */
export interface Card {
  id: number;
  domain: string;
  topic: string;
  question: string;
  answer: string;
  source: string;
  dateCreated: string;
  tag: string;
  nextReview: string;
  level: number;
}

/** 解析结果中的单张卡片 */
export interface ParsedCard {
  question: string;
  answer: string;
  domain: string;
  topic: string;
}

/** CoT 推理步骤 */
export interface ReasoningStep {
  step: string;
  detail: string;
}

/** 解析 API 响应 */
export interface ParseResult {
  cards: ParsedCard[];
  reasoning: ReasoningStep[];
}

/** 复习评分 */
export type ReviewRating = 'remember' | 'blurry' | 'forgot';

/** 保存卡片请求 */
export interface SaveCardsRequest {
  cards: ParsedCard[];
}

/** 提交复习请求 */
export interface SubmitReviewRequest {
  id: number;
  rating: ReviewRating;
}

/** API 统一响应格式 */
export interface ApiResponse<T> {
  status: 'ok' | 'error';
  data?: T;
  error?: string;
}
```

### 2.4 apps/web/package.json（关键依赖）

```json
{
  "name": "@flashcard/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "next lint",
    "check-types": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "dependencies": {
    "@flashcard/shared": "workspace:*",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.525.0",
    "next": "15.3.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.3.4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### 2.5 apps/web/app/globals.css — 风格参考 `cankao.html`

采用 **Slate 色调极简风格**（参考 `cankao.html`）：白底卡片、细边框、柔和阴影。

```css
@import "tailwindcss";

@theme inline {
  --color-background: #f8fafc;
  --color-foreground: #0f172a;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
  --color-primary: #0f172a;
  --color-primary-foreground: #ffffff;
  --color-muted: #94a3b8;
  --color-muted-foreground: #64748b;
  --color-border: #e2e8f0;
  --color-accent: #f1f5f9;
  --color-danger: #ef4444;
  --color-success: #22c55e;
  --color-ring: #0f172a / 0.2;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius-card: 12px;
  --radius-btn: 8px;
}

body {
  @apply bg-background text-foreground antialiased;
  font-family: var(--font-sans);
}

/* 卡片 hover 效果 */
.card-hover {
  @apply transition-all;
}
.card-hover:hover {
  @apply shadow-md;
}
```

### 2.6 apps/web/components/ui/icons.tsx（参考 cankao.html 的零依赖内联 SVG）

采用 `cankao.html` 的零依赖内联 SVG 方案，包含 flashcard 所需的所有图标：

```typescript
// components/ui/icons.tsx
// 零依赖内联 SVG — 参考 cankao.html 的图标方案
import * as React from "react";
import { cn } from "@/lib/utils";

type IconProps = React.ComponentProps<"svg"> & { className?: string };

export function SearchIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function PlusIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TrashIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function EditIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function CopyIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function SparklesIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

export function ChevronDownIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronRightIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function XIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-4 h-4", className)} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
```

> **注意**：如果选择安装 `lucide-react`，上述图标可直接替换为 `import { Search, Plus, Trash2, ... } from "lucide-react"`。此方案保持零依赖。

### 2.7 apps/web/lib/utils.ts（完全照抄参考项目）

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2.7 apps/web/lib/api.ts（API 客户端）

```typescript
import type { ParseResult, SaveCardsRequest, SubmitReviewRequest, Card, ParsedCard } from "@flashcard/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `服务器错误 (${res.status})`);
  }
  return res.json();
}

export async function fetchCards(): Promise<{ cards: Card[] }> {
  return apiFetch("/cards");
}

export async function parseText(text: string): Promise<ParseResult> {
  return apiFetch("/parse", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function saveCards(body: SaveCardsRequest): Promise<{ status: string; count: number }> {
  return apiFetch("/cards", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchReview(): Promise<{ cards: Card[] }> {
  return apiFetch("/review");
}

export async function submitReview(body: SubmitReviewRequest): Promise<{ status: string }> {
  return apiFetch("/review", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
```

### 2.8 apps/web/hooks/use-cards.ts

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Card } from "@flashcard/shared";
import { fetchCards } from "@/lib/api";

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCards();
      setCards(data.cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载卡片失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { cards, loading, error, reload: load };
}
```

### 2.9 apps/web/hooks/use-parse.ts

```typescript
"use client";

import { useState } from "react";
import type { ParsedCard, ReasoningStep } from "@flashcard/shared";
import { parseText } from "@/lib/api";

export function useParse() {
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [reasoning, setReasoning] = useState<ReasoningStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (text: string) => {
    if (!text.trim()) {
      setError("请先粘贴 AI 回答");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const data = await parseText(text);
      if (!data.cards?.length) throw new Error("未能解析出卡片，请检查输入内容");
      setParsedCards(data.cards);
      setReasoning(data.reasoning || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setLoading(false);
    }
  };

  const editCard = (index: number, field: keyof ParsedCard, value: string) => {
    setParsedCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const deleteCard = (index: number) => {
    setParsedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setParsedCards([]);
    setReasoning([]);
    setError(null);
  };

  return {
    parsedCards,
    reasoning,
    loading,
    error,
    handleParse,
    editCard,
    deleteCard,
    reset,
  };
}
```

### 2.10 apps/web/hooks/use-review.ts

```typescript
"use client";

import { useState, useCallback } from "react";
import type { Card, ReviewRating } from "@flashcard/shared";
import { fetchReview, submitReview } from "@/lib/api";

export function useReview() {
  const [reviewCards, setReviewCards] = useState<Card[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const startReview = useCallback(async () => {
    const data = await fetchReview();
    setReviewCards(data.cards);
    setReviewIndex(0);
    setShowAnswer(false);
  }, []);

  const handleRating = useCallback(async (rating: ReviewRating) => {
    await submitReview({ id: reviewCards[reviewIndex].id, rating });
    if (reviewIndex < reviewCards.length - 1) {
      setReviewIndex((i) => i + 1);
      setShowAnswer(false);
    } else {
      return true; // 复习完成
    }
    return false;
  }, [reviewCards, reviewIndex]);

  return {
    currentCard: reviewCards[reviewIndex],
    reviewCards,
    reviewIndex,
    showAnswer,
    setShowAnswer,
    startReview,
    handleRating,
  };
}
```

### 2.11 apps/web/app/layout.tsx（参考 cankao.html 的 sticky header）

```typescript
import type { Metadata } from "next";
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
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
        {/* Sticky Header — 参考 cankao.html 设计 */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">F</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight">学习卡片</h1>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
```

### 2.12 apps/web/app/page.tsx（首页 — 参考 cankao.html 的 Hero + Card Grid）

```typescript
"use client";

import { useState, useMemo } from "react";
import { useCards } from "@/hooks/use-cards";
import { useReview } from "@/hooks/use-review";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, ChevronRightIcon } from "@/components/ui/icons";

export default function HomePage() {
  const router = useRouter();
  const { cards, reload: reloadCards } = useCards();
  const { startReview } = useReview();
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dueCount = cards.filter((c) => c.nextReview <= today).length;

  // 日期分组（参考 cankao.html 的 useMemo 模式）
  const grouped = useMemo(() => {
    const groups: Record<string, typeof cards> = {};
    cards.forEach((c) => {
      const label = c.dateCreated === today ? "今天"
        : c.dateCreated === yesterday ? "昨天"
        : c.dateCreated;
      if (!groups[label]) groups[label] = [];
      groups[label].push(c);
    });
    return groups;
  }, [cards, today, yesterday]);

  const handleParse = async () => {
    if (!inputText.trim()) { setError("请先粘贴 AI 回答"); return; }
    // 跳转到预览页，通过 URL 参数传递文本
    router.push(`/preview?text=${encodeURIComponent(inputText)}`);
  };

  return (
    <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
      {/* Hero / Input Section — 参考 cankao.html */}
      <div className="flex flex-col items-center text-center space-y-6 pt-10 mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          开启知识卡片提炼
        </h2>
        <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-sm rounded-xl p-2 focus-within:ring-2 focus-within:ring-slate-900/20 focus-within:border-slate-300 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); setError(""); }}
            placeholder="粘贴 AI 回答或学习笔记..."
            className="w-full min-h-[120px] p-4 text-base bg-transparent border-none outline-none resize-y placeholder:text-slate-400"
          />
          <div className="flex justify-between items-center p-2 border-t border-slate-100 mt-2">
            <span className="text-xs text-slate-400 font-medium px-2">
              {error || "支持多段落文本"}
            </span>
            <button
              onClick={handleParse}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors"
            >
              <SparklesIcon />
              提取卡片
            </button>
          </div>
        </div>
      </div>

      {/* 复习提醒 — 参考 cankao.html 的 card 样式 */}
      {dueCount > 0 && (
        <div
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer mb-8 flex items-center justify-between"
          onClick={() => { startReview(); router.push("/review"); }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-slate-700">
              今日待复习: {dueCount} 张
            </span>
          </div>
          <ChevronRightIcon />
        </div>
      )}

      {/* 日期分组卡片网格 — 参考 cankao.html 的 grid */}
      {Object.entries(grouped).map(([dateLabel, dateCards]) => (
        <div key={dateLabel} className="mb-8">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 tracking-wide uppercase">
            {dateLabel}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dateCards.map((card) => (
              <div
                key={card.id}
                className="group relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  {card.domain && (
                    <Badge variant="domain">{card.domain}</Badge>
                  )}
                  {card.topic && card.topic !== "通用" && (
                    <Badge variant="topic">{card.topic}</Badge>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">
                  {card.question}
                </div>
                <div className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {card.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {cards.length === 0 && (
        <div className="text-center py-20 text-slate-500 border border-dashed border-slate-200 rounded-xl">
          暂无卡片，开始创建你的第一张知识卡片吧。
        </div>
      )}
    </main>
  );
}
```

### 2.13 apps/web/app/preview/page.tsx（预览/编辑页 — 参考 cankao.html 编辑器布局）

```typescript
"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useParse } from "@/hooks/use-parse";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon, ChevronRightIcon, XIcon, SparklesIcon,
} from "@/components/ui/icons";
import type { ParsedCard } from "@flashcard/shared";

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const text = searchParams.get("text") || "";
  const {
    parsedCards, reasoning, loading, error,
    handleParse, editCard, deleteCard, reset,
  } = useParse();
  const [showReasoning, setShowReasoning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 进入页面时自动触发解析
  useEffect(() => {
    if (text) handleParse(text);
  }, [text]);

  const handleSave = async () => {
    setIsSaving(true);
    await apiFetch("/cards", {
      method: "POST",
      body: JSON.stringify({ cards: parsedCards }),
    });
    setIsSaving(false);
    reset();
    router.push("/");
  };

  // 重新解析单张卡片
  const handleReparse = async (index: number) => {
    const card = parsedCards[index];
    await handleParse(`${card.question}\n${card.answer}`);
  };

  return (
    <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
      {/* 顶部标题栏 — 参考 cankao.html 的导航方式 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            ← 返回
          </button>
          <h2 className="text-xl font-bold text-slate-900">预览 & 编辑</h2>
          <Badge>{parsedCards.length} 张卡片</Badge>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-20 text-slate-500">
          正在解析中...
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && parsedCards.length > 0 && (
        <>
          {/* CoT 推理链折叠面板 — 参考 cankao.html 的折叠交互 */}
          {reasoning.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
              <button
                className="flex items-center justify-between w-full text-sm"
                onClick={() => setShowReasoning(!showReasoning)}
              >
                <span className="font-medium text-slate-700">思考过程</span>
                <span className="text-slate-400">
                  {showReasoning ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
              </button>
              {showReasoning && (
                <div className="mt-4 space-y-2 text-xs text-slate-500">
                  {reasoning.map((r, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="font-semibold text-slate-700 shrink-0">
                        {r.step}
                      </span>
                      <span>{r.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 卡片编辑网格 — 参考 cankao.html 的编辑区卡片风格 */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {parsedCards.map((card, i) => (
              <div
                key={i}
                className="group relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                {/* 领域和主题标签 */}
                <div className="flex items-center gap-2 mb-4">
                  {card.domain && <Badge variant="domain">{card.domain}</Badge>}
                  {card.topic && card.topic !== "通用" && (
                    <Badge variant="topic">{card.topic}</Badge>
                  )}
                </div>

                {/* 可编辑字段 — 参考 cankao.html 的 input 风格 */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      知识点
                    </label>
                    <input
                      type="text"
                      value={card.question}
                      onChange={(e) => editCard(i, "question", e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-slate-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      详细解释
                    </label>
                    <textarea
                      value={card.answer}
                      onChange={(e) => editCard(i, "answer", e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-slate-400 focus:bg-white transition-all resize-y"
                    />
                  </div>
                </div>

                {/* 操作按钮 — 参考 cankao.html 的 hover 显示模式 */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleReparse(i)}
                    className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                  >
                    再解析
                  </button>
                  <button
                    onClick={() => deleteCard(i)}
                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作按钮 — 参考 cankao.html 的 sticky action card */}
          <div className="flex items-center gap-3 justify-center">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "保存中..." : "确认保存"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { reset(); router.push("/"); }}
            >
              取消
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
```

### 2.14 apps/web/app/review/page.tsx（复习页）

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Card, ReviewRating } from "@flashcard/shared";

export default function ReviewPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    apiFetch<{ cards: Card[] }>("/review").then((data) => {
      setCards(data.cards);
    });
  }, []);

  const handleRating = async (rating: ReviewRating) => {
    await apiFetch("/review", {
      method: "POST",
      body: JSON.stringify({ id: cards[index].id, rating }),
    });
    if (index < cards.length - 1) {
      setIndex((i) => i + 1);
      setShowAnswer(false);
    } else {
      router.push("/");
    }
  };

  const current = cards[index];
  if (!current) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 text-center py-20 text-slate-500">
        <p>没有待复习的卡片</p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          返回首页
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-12 pb-16">
      {/* 进度指示 */}
      <div className="text-center mb-8">
        <Badge>
          {index + 1} / {cards.length}
        </Badge>
      </div>

      {/* 复习卡片 — 点击翻转 */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm cursor-pointer hover:shadow-md transition-all"
        onClick={() => setShowAnswer(true)}
      >
        <div className="text-center mb-6">
          {current.domain && (
            <Badge variant="domain">{current.domain}</Badge>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">
          问题
        </div>
        <div className="text-lg font-semibold text-slate-900 text-center leading-relaxed mb-6">
          {current.question}
        </div>

        {showAnswer && (
          <>
            <div className="border-t border-slate-100 my-6" />
            <div className="text-xs font-semibold text-slate-400 mb-2 text-center uppercase tracking-wide">
              答案
            </div>
            <div className="text-base text-slate-700 text-center leading-relaxed">
              {current.answer}
            </div>
          </>
        )}

        {!showAnswer && (
          <div className="text-center text-sm text-slate-400 mt-4">
            点击翻转
          </div>
        )}
      </div>

      {/* 评分按钮 — 翻转后显示 */}
      {showAnswer && (
        <div className="flex gap-3 justify-center mt-8">
          <Button
            variant="success"
            onClick={() => handleRating("remember")}
          >
            记住了
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleRating("blurry")}
          >
            模糊
          </Button>
          <Button
            variant="danger"
            onClick={() => handleRating("forgot")}
          >
            忘了
          </Button>
        </div>
      )}
    </main>
  );
}
```

### 2.15 UI 组件风格（参考项目 + cankao.html 混合风格）

所有 UI 组件遵循以下风格：

- 使用 `cn()` 工具合并 className
- 采用参考项目的 `cva()` 变体模式
- 配色和间距参考 `cankao.html` 的 Slate 色调（slate-50/100/200/500/900）

```typescript
// components/ui/button.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
        secondary: "bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50",
        ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        success: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

```typescript
// components/ui/card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-between p-6 pb-0", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-lg font-bold text-slate-900", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("p-6", className)} {...props} />
  );
}

export { Card, CardHeader, CardTitle, CardContent };
```

```typescript
// components/ui/badge.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-800",
        domain: "bg-slate-100 text-slate-800",
        topic: "bg-slate-50 text-slate-600 border border-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
```

---

## 三、Python 后端模块化规范

### 3.1 models/card.py — 数据模型

```python
from dataclasses import dataclass, field
from datetime import datetime, date
from typing import Optional


@dataclass
class Card:
    id: Optional[int] = None
    domain: str = ""
    topic: str = ""
    question: str = ""
    answer: str = ""
    source: str = "AI粘贴"
    date_created: str = field(default_factory=lambda: date.today().isoformat())
    tag: str = ""
    next_review: str = field(default_factory=lambda: date.today().isoformat())
    level: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "domain": self.domain,
            "topic": self.topic,
            "question": self.question,
            "answer": self.answer,
            "source": self.source,
            "dateCreated": self.date_created,
            "tag": self.tag,
            "nextReview": self.next_review,
            "level": self.level,
        }
```

### 3.2 database.py — Repository 模式

```python
import sqlite3
import os
from typing import Optional
from models.card import Card

DB_PATH = os.path.join(os.path.dirname(__file__), "cards.db")


class CardRepository:
    """卡片数据库操作层（类似 Prisma Service 模式）"""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT DEFAULT '',
                topic TEXT DEFAULT '',
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                source TEXT DEFAULT '',
                date_created TEXT NOT NULL,
                tag TEXT DEFAULT '',
                next_review TEXT NOT NULL,
                level INTEGER DEFAULT 0
            )
        """)
        conn.commit()
        conn.close()

    def find_all(self) -> list[Card]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM cards ORDER BY date_created DESC, id DESC"
        ).fetchall()
        conn.close()
        return [Card(**dict(row)) for row in rows]

    def find_due_reviews(self, today: str) -> list[Card]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM cards WHERE next_review <= ? ORDER BY level ASC",
            (today,),
        ).fetchall()
        conn.close()
        return [Card(**dict(row)) for row in rows]

    def create_many(self, cards: list[Card]) -> int:
        conn = self._get_conn()
        for card in cards:
            conn.execute(
                """INSERT INTO cards (domain, topic, question, answer, source, date_created, next_review, level)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (card.domain, card.topic, card.question, card.answer,
                 card.source, card.date_created, card.next_review, card.level),
            )
        conn.commit()
        conn.close()
        return len(cards)

    def update_review(self, card_id: int, next_review: str) -> None:
        conn = self._get_conn()
        conn.execute(
            "UPDATE cards SET next_review = ?, level = level + 1 WHERE id = ?",
            (next_review, card_id),
        )
        conn.commit()
        conn.close()
```

### 3.3 routers/ — Blueprint 模式（类似 NestJS Controller）

```python
# routers/parse.py
from flask import Blueprint, request, jsonify
from services.parser import CoTParser

router = Blueprint("parse", __name__)
parser = CoTParser()


@router.route("/api/parse", methods=["POST"])
def parse_text():
    """解析文本：CoT 5 步法 → 提取卡片"""
    data = request.get_json() or {}
    text = data.get("text", "")

    result = parser.parse(text)
    return jsonify(result)
```

### 3.4 services/parser.py — 保留原有逻辑，封装为类

```python
import re
from typing import Any


class CoTParser:
    """CoT 5 步文本解析引擎"""

    def parse(self, text: str) -> dict[str, Any]:
        sections = self._detect_sections(text)
        # ... 保留完整原有逻辑
```

---

## 四、代码规范（强制 AI 执行）

### 4.1 前端代码规范

| 规则 | 强制标准 | 示例 |
|------|---------|------|
| 组件导出 | `export default function ComponentName()` | ✅ 命名函数，非匿名 |
| Props 类型 | 必须定义 interface | ✅ `interface Props { card: Card }` |
| 组件粒度 | 每个文件 ≤ 150 行 | 超长必须拆分 |
| 样式方案 | Tailwind CSS + `cn()` | 🚫 禁止全局 CSS 类名（保留 .glass-card 等核心少数） |
| 类型导入 | `import type { Card }` | 使用 `import type` 语法 |
| 字符串引用 | 双引号 | ✅ `"text"` 非 `'text'` |
| 分号 | 始终加分号 | ✅ `const x = 1;` |
| Hook 命名 | `use` 前缀 + 功能 | `useCards`, `useParse`, `useReview` |
| 文件命名 | kebab-case | `card-item.tsx`, `date-group.tsx` |
| 客户端组件 | 顶部 `"use client";` | 只有需要交互时才加 |
| 空值处理 | `??` 优先于 `||` | ✅ `topic ?? "通用"` |
| 早期返回 | 优先 | ✅ `if (!text) return null;` |
| 解构赋值 | 多属性时使用 | ✅ `const { question, answer } = card;` |
| 错误边界 | try/catch 覆盖异步操作 | 所有 fetch 必须 try/catch |

### 4.2 后端代码规范

| 规则 | 强制标准 |
|------|---------|
| 导入顺序 | 标准库 → Flask → 本地模块 |
| 类型提示 | 所有函数使用类型注解 |
| 路由组织 | Blueprint 分离，一个文件一个路由组 |
| 数据库操作 | 统一通过 Repository 类，禁止分散写 SQL |
| 异常处理 | Flask abort() + 统一 error handler |
| 日志 | 使用 logging 模块，禁止 print |
| 配置 | 集中到 config.py，禁止硬编码 |

### 4.3 前端设计规范（参考 cankao.html）

| 规则 | 强制标准 |
|------|---------|
| **配色** | Slate 色调（slate-50/100/200/500/900）为主，禁止使用彩色主题 |
| **字体** | system-ui 无衬线，无需额外字体加载 |
| **卡片** | 白底 + 细边框(`border-slate-200`) + `rounded-xl` + `shadow-sm` |
| **hover** | `hover:shadow-md` + `transition-all` 提升交互感 |
| **按钮** | 主要按钮 `bg-slate-900`，次要 `bg-white border-slate-200` |
| **徽章** | `rounded-full bg-slate-100 text-slate-800` 圆角满 |
| **图标** | 使用 `components/ui/icons.tsx` 内联 SVG，零依赖 |
| **输入框** | `border-slate-200 rounded-md`，focus: `border-slate-400 ring-slate-900/20` |
| **间距** | 卡片内 padding `p-5/p-6`，卡片间 gap `gap-4/gap-6` |
| **布局** | 最大宽度 `max-w-5xl`，居中对齐 |
| **空状态** | 虚线边框 `border-dashed border-slate-200 rounded-xl` + 居中文字 |
| **分隔线** | `border-t border-slate-100` 细分隔，`border-slate-200` 粗分隔 |

### 4.4 禁止模式

```typescript
// ❌ 禁止 any
const data: any = await res.json();

// ❌ 禁止非类型化 props
function CardItem(props) { ... }

// ❌ 禁止 console.log（前端）
console.log("debug");

// ❌ 禁止长组件（>200 行）

// ❌ 禁止全局 CSS 覆盖 Tailwind 类

// ❌ 禁止在 useEffect 外直接 fetch

// ❌ 禁止彩色主题（保持 Slate 色调）
// ❌ 禁止自定义字体（保持 system-ui）
// ❌ 禁止外部图标库（使用内联 SVG 或 lucide-react）
// ❌ 禁止 glassmorphism（白底卡片替代玻璃效果）
```

### 4.5 参考项目代码风格摘要（AI 必须模仿）

```
参考项目代码特征：
1. import { cn } from "@/lib/utils" 用于 className 合并
2. data-slot="xxx" 属性标记组件根元素
3. cva() 定义 variant/size 变体（Button、Badge）
4. VariantProps<typeof xxxVariants> 类型推导
5. React.ComponentProps<"div"> 扩展原生属性
6. 组件是命名函数，导出多个子组件（Card, CardHeader, CardTitle...）
7. Tailwind CSS v4 @theme inline 自定义主题
8. 所有页面在 app/ 目录下用 page.tsx

cankao.html 设计特征（必须同时遵守）：
1. Slate 色调（slate-50/100/200/500/900）
2. 白底卡片 + 细边框 + shadow-sm
3. sticky header 用 bg-white/80 backdrop-blur-md
4. 内联 SVG 图标，零依赖
5. hover 交互用 transition-colors/transition-all
6. 按钮圆角 rounded-md，卡片圆角 rounded-xl
7. 输入框 focus:ring-2 focus:ring-slate-900/20
8. 标签用 rounded-full bg-slate-100
```

---

## 五、实施顺序

```
Phase 1: 根 Monorepo 配置
  mkdir -p packages/{typescript-config,eslint-config,shared}
  → 创建 package.json, turbo.json, .gitignore, .prettierrc

Phase 2: 共享包
  → packages/typescript-config/ (base.json, nextjs.json)
  → packages/eslint-config/ (base.js)
  → packages/shared/src/index.ts

Phase 3: Next.js 前端
  mkdir -p apps/web
  → 创建 package.json, tsconfig.json, next.config.ts, postcss.config.mjs
  → app/ 目录: layout.tsx, globals.css, page.tsx
  → app/preview/page.tsx, app/review/page.tsx
  → components/ui/ (button.tsx, card.tsx, badge.tsx, textarea.tsx)
  → components/ (业务组件)
  → hooks/ (use-cards.ts, use-parse.ts, use-review.ts)
  → lib/ (utils.ts, api.ts)
  → types/

Phase 4: Python 后端模块化
  mkdir -p apps/api/{routers,services,models,tests}
  → 从 app.py 拆出:
    - services/parser.py (CoT 解析引擎)
    - services/spaced_repetition.py (SM-0 算法)
    - models/card.py (Card dataclass)
    - database.py (CardRepository)
    - routers/parse.py, routers/cards.py, routers/review.py
    - main.py (入口)
    - config.py
    - requirements.txt

Phase 5: 清理
  → 删除 frontend/ 目录中不再需要的文件
  → 删除 test_*.py, *_payload.json（移到 apps/api/tests/）
  → 验证: cd apps/web && bun dev 正常启动
```

---

## 六、验证检查清单

完成后检查以下内容：

- [ ] `bun install` 无错误
- [ ] `turbo check-types` 无类型错误
- [ ] `turbo lint` 无 lint 错误
- [ ] `cd apps/web && bun dev` 前端启动
- [ ] `cd apps/api && python main.py` 后端启动
- [ ] 首页显示输入框 + 卡片列表
- [ ] 粘贴文本后跳转预览页
- [ ] 编辑卡片功能正常
- [ ] 保存卡片后返回首页
- [ ] 复习页显示卡片 + 评分按钮
- [ ] 玻璃态设计完整
