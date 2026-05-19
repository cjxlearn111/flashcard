"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SparklesIcon, EditIcon, TrashIcon, BookIcon, FileTextIcon } from "@/components/ui/icons";
import type { Brief, KnowledgeCardItem } from "@flashcard/shared";
import { fetchBriefs, deleteBrief, fetchKnowledgeCards, deleteKnowledgeCard } from "@/lib/api";

const CATEGORIES = ["全部", "AI与技术", "认知与行为", "产品与商业", "编程与工具", "通用"];

type TabType = "brief" | "knowledge";

export default function HomePage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("全部");
  const [knowledgeTab, setKnowledgeTab] = useState("全部");
  const [listTab, setListTab] = useState<TabType>("brief");

  // 加载简报列表
  const loadBriefs = async () => {
    try {
      const data = await fetchBriefs();
      setBriefs(data.briefs);
    } catch {
      // 静默失败
    }
  };

  // 加载知识卡片列表
  const loadKnowledgeCards = async () => {
    try {
      const data = await fetchKnowledgeCards();
      setKnowledgeCards(data.cards);
    } catch {
      // 静默失败
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadBriefs(), loadKnowledgeCards()]);
      setLoading(false);
    };
    load();
  }, []);

  // 分类过滤（问题分析）
  const filteredBriefs = useMemo(() => {
    if (activeTab === "全部") return briefs;
    return briefs.filter((b) => b.domain === activeTab);
  }, [briefs, activeTab]);

  // 分类过滤（知识卡片）
  const filteredKnowledgeCards = useMemo(() => {
    if (knowledgeTab === "全部") return knowledgeCards;
    return knowledgeCards.filter((c) => c.source === knowledgeTab);
  }, [knowledgeCards, knowledgeTab]);

  // 提取卡片（问题分析模式）
  const handleBriefExtract = () => {
    if (!inputText.trim()) {
      setError("请先粘贴 AI 回答");
      return;
    }
    sessionStorage.setItem("parseText", inputText);
    router.push("/preview");
  };

  // 提取卡片（知识卡片模式）
  const handleKnowledgeExtract = () => {
    if (!inputText.trim()) {
      setError("请先粘贴知识点文本");
      return;
    }
    sessionStorage.setItem("knowledgeText", inputText);
    router.push("/knowledge/preview");
  };

  // 删除简报
  const handleDeleteBrief = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteBrief(id);
    setBriefs((prev) => prev.filter((b) => b.id !== id));
  };

  // 删除知识卡片
  const handleDeleteKnowledge = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteKnowledgeCard(id);
    setKnowledgeCards((prev) => prev.filter((k) => k.id !== id));
  };

  // 编辑简报
  const handleEditBrief = (brief: Brief, e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem("editBrief", JSON.stringify(brief));
    router.push("/preview");
  };

  const briefTags = ["全部", "全部简报"] as const;

  return (
    <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
      {/* Hero / Input Section */}
      <div className="flex flex-col items-center text-center space-y-6 pt-10 mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          开启深层思维提炼
        </h2>
        <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-sm rounded-xl p-2 focus-within:ring-2 focus-within:ring-slate-900/20 focus-within:border-slate-300 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setError("");
            }}
            placeholder="在此粘贴 AI 回答或学习笔记..."
            className="w-full min-h-[120px] p-4 text-base bg-transparent border-none outline-none resize-y placeholder:text-slate-400"
          />
          <div className="flex justify-between items-center p-2 border-t border-slate-100 mt-2">
            <span className="text-xs text-slate-400 font-medium px-4">
              {error || "支持 Markdown 格式"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBriefExtract}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors"
              >
                <FileTextIcon />
                问题分析
              </button>
              <button
                onClick={handleKnowledgeExtract}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-emerald-600 transition-colors"
              >
                <BookIcon />
                知识卡片
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 列表切换标签 */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-4 mb-6">
        <button
          onClick={() => setListTab("brief")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            listTab === "brief"
              ? "bg-slate-100 text-slate-900"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          问题分析
        </button>
        <button
          onClick={() => setListTab("knowledge")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            listTab === "knowledge"
              ? "bg-slate-100 text-slate-900"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          知识卡片
        </button>
      </div>

      {/* 加载态 */}
      {loading && (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      )}

      {/* ── 问题分析列表 ── */}
      {!loading && listTab === "brief" && (
        <div className="space-y-6">
          {/* 分类标签 */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {CATEGORIES.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 空态 */}
          {filteredBriefs.length === 0 && (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-200 rounded-xl">
              暂无简报，开始创建你的第一个知识简报吧。
            </div>
          )}

          {/* 简报网格 */}
          {filteredBriefs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBriefs.map((brief) => {
                let briefData;
                try {
                  briefData = JSON.parse(brief.dataJson);
                } catch {
                  briefData = null;
                }
                const principleCount = briefData?.principles?.length ?? 0;
                const tensionCount = briefData?.tensions?.length ?? 0;

                return (
                  <div
                    key={brief.id}
                    className="group relative bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                    onClick={() => router.push(`/brief/${brief.id}`)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-slate-400 transition-colors" />

                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                        {brief.domain || "通用"}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {brief.dateCreated}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-6 line-clamp-2 leading-snug flex-grow">
                      {brief.title || "无标题简报"}
                    </h3>

                    <div className="flex justify-between items-center text-sm text-slate-500 mt-auto pt-4 border-t border-slate-50">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5" title="可复用原则数">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {principleCount} 条原则
                        </span>
                        <span className="flex items-center gap-1.5" title="待裁决数">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {tensionCount} 个待裁决
                        </span>
                      </div>

                      <div
                        className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleEditBrief(brief, e)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={(e) => handleDeleteBrief(brief.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 知识卡片列表 ── */}
      {!loading && listTab === "knowledge" && (
        <div className="space-y-6">
          {/* 分类标签 */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {CATEGORIES.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setKnowledgeTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    knowledgeTab === tab
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 空态 */}
          {filteredKnowledgeCards.length === 0 && (
            <div className="text-center py-20 text-slate-500 border border-dashed border-slate-200 rounded-xl">
              暂无知识卡片，开始记录你的第一个知识点吧。
            </div>
          )}

          {/* 卡片网格 */}
          {filteredKnowledgeCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredKnowledgeCards.map((card) => {
                let tags: string[] = [];
                let pointCount = 0;
                let tableCount = 0;
                let resourceCount = 0;
                try {
                  tags = JSON.parse(card.tags);
                  const data = JSON.parse(card.dataJson);
                  pointCount = data.knowledge_points?.length || 0;
                  tableCount = data.tables?.length || 0;
                  resourceCount = data.resources?.length || 0;
                } catch {
                  tags = [];
                }

                const tagColors = [
                  "bg-emerald-100 text-emerald-800",
                  "bg-sky-100 text-sky-800",
                  "bg-violet-100 text-violet-800",
                  "bg-rose-100 text-rose-800",
                  "bg-amber-100 text-amber-800",
                ];

                return (
                  <div
                    key={card.id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden flex flex-col h-full border border-slate-200 hover:border-emerald-300"
                    onClick={() => router.push(`/knowledge/${card.id}`)}
                  >
                    {/* 顶部色条 */}
                    <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-500" />

                    {/* 标签栏 */}
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                              tagColors[i % tagColors.length]
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 4 && (
                          <span className="text-xs text-slate-400">+{tags.length - 4}</span>
                        )}
                      </div>
                    </div>

                    {/* 标题 + 摘要 */}
                    <div className="px-5 py-2 flex-1">
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {card.title || "无标题"}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2">{card.source}</p>
                    </div>

                    {/* 统计 + 操作 */}
                    <div className="px-5 py-3 flex items-center justify-between border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {pointCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {pointCount} 知识点
                          </span>
                        )}
                        {tableCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {tableCount} 表格
                          </span>
                        )}
                        {resourceCount > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            {resourceCount} 资源
                          </span>
                        )}
                        {pointCount === 0 && tableCount === 0 && resourceCount === 0 && (
                          <span>{card.dateCreated}</span>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sessionStorage.setItem("editKnowledgeCard", JSON.stringify(card));
                            router.push("/knowledge/preview");
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="编辑"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={(e) => handleDeleteKnowledge(card.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="删除"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
