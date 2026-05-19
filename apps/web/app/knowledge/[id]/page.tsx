"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { EditIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { fetchKnowledgeCard } from "@/lib/api";
import type { KnowledgeCardData, KnowledgeCardItem } from "@flashcard/shared";

const tagColors = [
  { bg: "bg-emerald-100", text: "text-emerald-800" },
  { bg: "bg-sky-100", text: "text-sky-800" },
  { bg: "bg-violet-100", text: "text-violet-800" },
  { bg: "bg-rose-100", text: "text-rose-800" },
  { bg: "bg-amber-100", text: "text-amber-800" },
  { bg: "bg-cyan-100", text: "text-cyan-800" },
];

export default function KnowledgeCardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [card, setCard] = useState<KnowledgeCardItem | null>(null);
  const [data, setData] = useState<KnowledgeCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const item = await fetchKnowledgeCard(Number(params.id));
        setCard(item);
        setData(JSON.parse(item.dataJson || "{}"));
      } catch {
        setError("知识卡片不存在");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const handleEdit = () => {
    if (card) {
      sessionStorage.setItem("editKnowledgeCard", JSON.stringify(card));
      router.push("/knowledge/preview");
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center py-20 text-slate-400">加载中...</div>
      </main>
    );
  }

  if (error || !card || !data) {
    return (
      <main className="max-w-4xl mx-auto px-6 pt-8 pb-16 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error || "知识卡片不存在"}</div>
        <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">← 返回首页</button>
      </main>
    );
  }

  let tags: string[] = [];
  try { tags = JSON.parse(card.tags || "[]"); } catch {}

  return (
    <main className="max-w-4xl mx-auto px-6 pt-8 pb-16">
      {/* 导航 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">← 返回</button>
        <button onClick={handleEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-500 transition-colors shadow-sm">
          <EditIcon /> 编辑
        </button>
      </div>

      {/* 卡片主体 — 白色卡片容器 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* 顶部渐变色区 */}
        <div className="h-3 bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400" />

        {/* 标题区 */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          {/* 标签 */}
          <div className="flex gap-2 flex-wrap mb-4">
            {tags.map((tag, i) => {
              const c = tagColors[i % tagColors.length] ?? { bg: "bg-slate-100", text: "text-slate-800" };
              return (
                <span key={i} className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
                  {tag}
                </span>
              );
            })}
          </div>

          <h1 className="text-3xl font-bold text-slate-900 leading-tight">{card.title}</h1>

          <div className="flex items-center gap-4 text-sm text-slate-400 mt-4">
            <span>创建于 {card.dateCreated}</span>
            {card.source && <span>来源: {card.source}</span>}
          </div>
        </div>

        {/* 内容区 */}
        <div className="px-8 py-6 space-y-10">
          {/* 术语表 */}
          {data.terms && data.terms.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-sky-400 rounded-full inline-block" />
                术语表
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.terms.map((t, i) => (
                  <div key={i} className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <span className="font-bold text-sky-900">{t.term}</span>
                    <p className="text-sm text-sky-700 mt-0.5">{t.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 知识点 */}
          {data.knowledge_points && data.knowledge_points.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-emerald-400 rounded-full inline-block" />
                知识点
              </h2>
              <div className="grid gap-4">
                {data.knowledge_points.map((kp, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 flex-1">{kp.title}</h3>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded",
                        kp.type === "核心概念" && "bg-blue-100 text-blue-700",
                        kp.type === "方法" && "bg-amber-100 text-amber-700",
                        kp.type === "原则" && "bg-violet-100 text-violet-700",
                        kp.type === "事实" && "bg-emerald-100 text-emerald-700",
                      )}>
                        {kp.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{kp.content}</p>
                    {(kp.related_pre || kp.related_extend) && (
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                        {kp.related_pre && kp.related_pre !== "无" && (
                          <span>📎 前置知识: {kp.related_pre}</span>
                        )}
                        {kp.related_extend && kp.related_extend !== "无" && (
                          <span>→ 延伸阅读: {kp.related_extend}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 表格 */}
          {data.tables && data.tables.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-400 rounded-full inline-block" />
                表格
              </h2>
              <div className="space-y-6">
                {data.tables.map((t, ti) => (
                  <div key={ti} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <span className="font-bold text-slate-900">{t.table_title || `表格 ${ti + 1}`}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{t.table_type}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/50">
                            {t.headers.map((h, hi) => (
                              <th key={hi} className="px-5 py-3 text-left font-semibold text-slate-700">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                              {row.map((cell, ci) => (
                                <td key={ci} className="px-5 py-3 text-slate-600">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 资源 */}
          {data.resources && data.resources.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-400 rounded-full inline-block" />
                资源
              </h2>
              <div className="grid gap-3">
                {data.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-4 bg-amber-50/50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all group">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                      {r.type === "链接" ? "链" : r.type === "工具" ? "具" : r.type === "论文" ? "论" : r.type === "视频" ? "视" : r.type === "博客" ? "博" : r.type === "书籍" ? "书" : "源"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{r.name}</span>
                        <span className="text-xs font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{r.type}</span>
                      </div>
                      {r.description && <p className="text-sm text-slate-600 mt-0.5">{r.description}</p>}
                      {r.url && <p className="text-xs text-slate-400 mt-1 truncate">{r.url}</p>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 知识扩展 */}
          {data.knowledge_extend && data.knowledge_extend.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-violet-400 rounded-full inline-block" />
                知识扩展
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.knowledge_extend.map((ke, i) => (
                  <div key={i} className="bg-violet-50 border border-violet-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-violet-900">{ke.concept}</span>
                      <span className={cn(
                        "text-xs font-semibold px-1.5 py-0.5 rounded",
                        ke.relationship === "前置" && "bg-blue-100 text-blue-700",
                        ke.relationship === "延伸" && "bg-emerald-100 text-emerald-700",
                        ke.relationship === "相似" && "bg-amber-100 text-amber-700",
                        ke.relationship === "对比" && "bg-rose-100 text-rose-700",
                      )}>
                        {ke.relationship}
                      </span>
                    </div>
                    <p className="text-sm text-violet-700">{ke.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
