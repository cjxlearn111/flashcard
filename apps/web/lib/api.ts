// Polyfill for Node.js 25: globalThis.localStorage exists as {} with no methods
if (typeof globalThis !== "undefined" && typeof globalThis.localStorage === "object" && globalThis.localStorage && !("getItem" in globalThis.localStorage)) {
  const storage: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v; },
    removeItem: (k: string) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    length: 0,
    key: () => null,
  };
}

import type {
  ParseResult,
  Card,
  ReviewRating,
  BriefResult,
  Brief,
  KnowledgeCardResult,
  KnowledgeCardItem,
} from "@flashcard/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
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

export async function saveCards(
  body: { cards: { question: string; answer: string; domain: string; topic: string }[] },
): Promise<{ status: string; count: number }> {
  return apiFetch("/cards", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchReview(): Promise<{ cards: Card[] }> {
  return apiFetch("/review");
}

export async function submitReview(
  body: { id: number; rating: ReviewRating },
): Promise<{ status: string }> {
  return apiFetch("/review", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── 简报生成 ──

export async function generateBrief(text: string): Promise<BriefResult> {
  return apiFetch("/brief", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// ── 简报 CRUD ──

export async function fetchBriefs(): Promise<{ briefs: Brief[] }> {
  return apiFetch("/briefs");
}

export async function fetchBrief(id: number): Promise<Brief> {
  return apiFetch(`/briefs/${id}`);
}

export async function saveBrief(
  body: Partial<Brief> & { dataJson?: string; briefMd?: string },
): Promise<Brief> {
  return apiFetch("/briefs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateBrief(
  id: number,
  body: Partial<Brief> & { dataJson?: string; briefMd?: string },
): Promise<Brief> {
  return apiFetch(`/briefs/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteBrief(id: number): Promise<{ status: string }> {
  return apiFetch(`/briefs/${id}`, {
    method: "DELETE",
  });
}

// ── LLM 设置 ──

export interface LLSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export async function fetchSettings(): Promise<LLSettings> {
  return apiFetch("/settings");
}

export async function updateSettings(
  body: Partial<LLSettings>,
): Promise<{ status: string }> {
  return apiFetch("/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ── 思维链 Prompt ──

export async function fetchPrompt(): Promise<{ prompt: string }> {
  return apiFetch("/settings/prompt");
}

export async function updatePrompt(
  prompt: string,
): Promise<{ status: string }> {
  return apiFetch("/settings/prompt", {
    method: "PUT",
    body: JSON.stringify({ prompt }),
  });
}

export async function resetPrompt(): Promise<{ status: string; prompt: string }> {
  return apiFetch("/settings/prompt", {
    method: "DELETE",
  });
}

// ── 知识卡片思维链 Prompt ──

export async function fetchKnowledgePrompt(): Promise<{ prompt: string }> {
  return apiFetch("/settings/knowledge-prompt");
}

export async function updateKnowledgePrompt(
  prompt: string,
): Promise<{ status: string }> {
  return apiFetch("/settings/knowledge-prompt", {
    method: "PUT",
    body: JSON.stringify({ prompt }),
  });
}

export async function resetKnowledgePrompt(): Promise<{
  status: string;
  prompt: string;
}> {
  return apiFetch("/settings/knowledge-prompt", {
    method: "DELETE",
  });
}

// ── 知识卡片 ──

export async function generateKnowledgeCard(
  text: string,
): Promise<KnowledgeCardResult> {
  return apiFetch("/knowledge-card", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function fetchKnowledgeCards(): Promise<{
  cards: KnowledgeCardItem[];
}> {
  return apiFetch("/knowledge-cards");
}

export async function fetchKnowledgeCard(
  id: number,
): Promise<KnowledgeCardItem> {
  return apiFetch(`/knowledge-cards/${id}`);
}

export async function saveKnowledgeCard(body: {
  title: string;
  tags: string[];
  source: string;
  dataJson: object;
  summaryMd: string;
}): Promise<KnowledgeCardItem> {
  return apiFetch("/knowledge-cards", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateKnowledgeCard(
  id: number,
  body: {
    title: string;
    tags: string[];
    source: string;
    dataJson: object;
    summaryMd: string;
  },
): Promise<KnowledgeCardItem> {
  return apiFetch(`/knowledge-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteKnowledgeCard(
  id: number,
): Promise<{ status: string }> {
  return apiFetch(`/knowledge-cards/${id}`, {
    method: "DELETE",
  });
}
