"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { generateKnowledgeCard, saveKnowledgeCard, updateKnowledgeCard } from "@/lib/api";
import type { KnowledgeCardData, KnowledgeCardItem } from "@flashcard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const DOMAINS = ["AI与技术", "认知与行为", "产品与商业", "编程与工具", "通用"];
const KP_TYPES = ["核心概念", "方法", "原则", "事实"] as const;
const TABLE_TYPES = ["对比表", "汇总表", "清单表"] as const;
const RESOURCE_TYPES = ["链接", "工具", "论文", "视频", "博客", "书籍"] as const;
const RELATIONSHIP_TYPES = ["前置", "延伸", "相似", "对比"] as const;

export default function KnowledgePreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [domain, setDomain] = useState("编程与工具");
  const [terms, setTerms] = useState<{ term: string; definition: string }[]>([]);
  const [knowledgePoints, setKnowledgePoints] = useState<{
    title: string; type: "核心概念" | "方法" | "原则" | "事实";
    content: string; related_pre: string; related_extend: string;
  }[]>([]);
  const [tables, setTables] = useState<{
    table_title: string; table_type: "对比表" | "汇总表" | "清单表";
    headers: string[]; rows: string[][];
  }[]>([]);
  const [resources, setResources] = useState<{
    name: string; type: string; url: string; description: string;
  }[]>([]);
  const [knowledgeExtend, setKnowledgeExtend] = useState<{
    concept: string; relationship: "前置" | "延伸" | "相似" | "对比"; detail: string;
  }[]>([]);

  useEffect(() => {
    const init = async () => {
      // 编辑已保存的卡片
      const editRaw = sessionStorage.getItem("editKnowledgeCard");
      if (editRaw) {
        sessionStorage.removeItem("editKnowledgeCard");
        try {
          const item: KnowledgeCardItem = JSON.parse(editRaw);
          setEditId(item.id);
          const data: KnowledgeCardData = JSON.parse(item.dataJson || "{}");
          setDomain(data.domain || "编程与工具");
          setTerms(data.terms || []);
          setKnowledgePoints(data.knowledge_points || []);
          setTables(data.tables || []);
          setResources(data.resources || []);
          setKnowledgeExtend(data.knowledge_extend || []);
          setLoading(false);
          return;
        } catch { /* fall through to generate */ }
      }

      // 新生成
      const text = sessionStorage.getItem("knowledgeText");
      if (!text) {
        setError("没有待解析的文本");
        setLoading(false);
        return;
      }

      try {
        const result = await generateKnowledgeCard(text);
        const data = result.data;
        setDomain(data.domain || "编程与工具");
        setTerms(data.terms || []);
        setKnowledgePoints(data.knowledge_points || []);
        setTables(data.tables || []);
        setResources(data.resources || []);
        setKnowledgeExtend(data.knowledge_extend || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "生成知识卡片失败");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const dataJson: KnowledgeCardData = {
        domain, terms, knowledge_points: knowledgePoints,
        tables, resources, knowledge_extend: knowledgeExtend,
      };
      const payload = {
        title: knowledgePoints[0]?.title || domain,
        tags: [],
        source: domain,
        dataJson: dataJson as object,
        summaryMd: knowledgePoints.map(kp => kp.title).join("；"),
      };
      if (editId) {
        await updateKnowledgeCard(editId, payload);
      } else {
        await saveKnowledgeCard(payload);
      }
      sessionStorage.removeItem("knowledgeText");
      router.push("/");
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center py-20 text-slate-400">正在生成知识卡片...</div>
      </main>
    );
  }

  if (error && knowledgePoints.length === 0) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>← 返回首页</Button>
      </main>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto px-6 pt-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 左侧编辑区 */}
      <div className="flex-1 space-y-8">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>← 返回</Button>
          <h2 className="text-lg font-bold text-slate-900">{editId ? "编辑知识卡片" : "编辑知识卡片"}</h2>
        </div>

        {/* 领域分类 */}
        <Card>
          <CardContent className="p-6">
            <Label htmlFor="domain">领域分类</Label>
            <select
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-2 w-full h-9 text-sm border border-slate-200 rounded-md px-3 bg-white outline-none focus:border-slate-400"
            >
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </CardContent>
        </Card>

        {/* 术语表 */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">术语表</h3>
            {terms.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start group">
                <Input
                  value={item.term}
                  onChange={(e) => { const n = [...terms]; n[idx] = {...n[idx]!!, term: e.target.value}; setTerms(n); }}
                  placeholder="术语名称" className="w-1/3"
                />
                <Input
                  value={item.definition}
                  onChange={(e) => { const n = [...terms]; n[idx] = {...n[idx]!!, definition: e.target.value}; setTerms(n); }}
                  placeholder="20字内定义" className="flex-1"
                />
                <button onClick={() => setTerms(terms.filter((_, i) => i !== idx))} className="mt-1.5 p-1 text-slate-400 hover:text-red-500 shrink-0"><XIcon /></button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setTerms([...terms, { term: "", definition: "" }])}>
              <PlusIcon /> 添加术语
            </Button>
          </CardContent>
        </Card>

        {/* 知识点 */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900">知识点</h3>
            {knowledgePoints.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                  <Input
                    value={item.title}
                    onChange={(e) => { const n = [...knowledgePoints]; n[idx] = {...n[idx]!, title: e.target.value}; setKnowledgePoints(n); }}
                    placeholder="知识点标题" className="flex-1"
                  />
                  <select
                    value={item.type}
                    onChange={(e) => { const n = [...knowledgePoints]; n[idx] = {...n[idx]!, type: e.target.value as any}; setKnowledgePoints(n); }}
                    className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none bg-white"
                  >
                    {KP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => setKnowledgePoints(knowledgePoints.filter((_, i) => i !== idx))} className="p-1 text-slate-400 hover:text-red-500"><XIcon /></button>
                </div>
                <textarea
                  value={item.content}
                  onChange={(e) => { const n = [...knowledgePoints]; n[idx] = {...n[idx]!, content: e.target.value}; setKnowledgePoints(n); }}
                  placeholder="知识点解析（3-5句）"
                  className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-slate-400 min-h-[80px] resize-y"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">前置知识</Label>
                    <Input
                      value={item.related_pre}
                      onChange={(e) => { const n = [...knowledgePoints]; n[idx] = {...n[idx]!, related_pre: e.target.value}; setKnowledgePoints(n); }}
                      placeholder="前置知识或填无" size={1}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">延伸阅读</Label>
                    <Input
                      value={item.related_extend}
                      onChange={(e) => { const n = [...knowledgePoints]; n[idx] = {...n[idx]!, related_extend: e.target.value}; setKnowledgePoints(n); }}
                      placeholder="延伸方向或填无"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setKnowledgePoints([...knowledgePoints, {
              title: "", type: "核心概念", content: "", related_pre: "", related_extend: "",
            }])}>
              <PlusIcon /> 添加知识点
            </Button>
          </CardContent>
        </Card>

        {/* 表格 */}
        <Card>
          <CardContent className="p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900">表格</h3>
            {tables.map((t, ti) => (
              <div key={ti} className="border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">T{ti + 1}</span>
                  <Input value={t.table_title} onChange={(e) => { const n = [...tables]; n[ti] = {...n[ti]!, table_title: e.target.value}; setTables(n); }}
                    placeholder="表格标题" className="flex-1" />
                  <select value={t.table_type} onChange={(e) => { const n = [...tables]; n[ti] = {...n[ti]!, table_type: e.target.value as any}; setTables(n); }}
                    className="text-xs border border-slate-200 rounded px-2 py-1.5 outline-none bg-white">
                    {TABLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => setTables(tables.filter((_, i) => i !== ti))} className="p-1 text-slate-400 hover:text-red-500"><XIcon /></button>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">列标题（逗号分隔）</Label>
                  <Input value={t.headers.join("，")} onChange={(e) => { const n = [...tables]; n[ti] = {...n[ti]!, headers: e.target.value.split(/[，,]/).map(s => s.trim()).filter(Boolean)}; setTables(n); }}
                    placeholder="列1，列2，列3" className="mt-1" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">数据行</Label>
                  {t.rows.map((row, ri) => (
                    <div key={ri} className="flex gap-2">
                      <Input value={row.join(" | ")} onChange={(e) => { const n = [...tables]; const nr = e.target.value.split("|").map(s => s.trim()); n[ti].rows[ri] = nr; setTables(n); }}
                        placeholder="值1 | 值2 | 值3" className="flex-1 font-mono text-xs" />
                      <button onClick={() => { const n = [...tables]; n[ti] = {...n[ti]!, rows: n[ti].rows.filter((_, i2) => i2 !== ri)}; setTables(n); }}
                        className="p-1 text-slate-400 hover:text-red-500 shrink-0"><XIcon /></button>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => { const n = [...tables]; n[ti] = {...n[ti]!, rows: [...n[ti]!.rows, new Array(n[ti].headers.length || 1).fill("")]}; setTables(n); }}>
                    + 添加行
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setTables([...tables, { table_title: "", table_type: "对比表", headers: ["", ""], rows: [["", ""]] }])}>
              <PlusIcon /> 添加表格
            </Button>
          </CardContent>
        </Card>

        {/* 资源 */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">资源</h3>
            {resources.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start group">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input value={item.name} onChange={(e) => { const n = [...resources]; n[idx] = {...n[idx]!, name: e.target.value}; setResources(n); }}
                      placeholder="资源名称" className="flex-1" />
                    <select value={item.type} onChange={(e) => { const n = [...resources]; n[idx] = {...n[idx]!, type: e.target.value}; setResources(n); }}
                      className="text-xs border border-slate-200 rounded px-2 outline-none bg-white">
                      {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input value={item.url} onChange={(e) => { const n = [...resources]; n[idx] = {...n[idx]!, url: e.target.value}; setResources(n); }}
                    placeholder="URL" className="w-full text-xs" />
                  <Input value={item.description} onChange={(e) => { const n = [...resources]; n[idx] = {...n[idx]!, description: e.target.value}; setResources(n); }}
                    placeholder="一句话说明价值" className="w-full text-xs" />
                </div>
                <button onClick={() => setResources(resources.filter((_, i) => i !== idx))} className="mt-1 p-1 text-slate-400 hover:text-red-500 shrink-0"><XIcon /></button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setResources([...resources, { name: "", type: "链接", url: "", description: "" }])}>
              <PlusIcon /> 添加资源
            </Button>
          </CardContent>
        </Card>

        {/* 知识扩展 */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">知识扩展</h3>
            {knowledgeExtend.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start group">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input value={item.concept} onChange={(e) => { const n = [...knowledgeExtend]; n[idx] = {...n[idx]!, concept: e.target.value}; setKnowledgeExtend(n); }}
                      placeholder="关联概念名" className="flex-1" />
                    <select value={item.relationship} onChange={(e) => { const n = [...knowledgeExtend]; n[idx] = {...n[idx]!, relationship: e.target.value as any}; setKnowledgeExtend(n); }}
                      className="text-xs border border-slate-200 rounded px-2 outline-none bg-white">
                      {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input value={item.detail} onChange={(e) => { const n = [...knowledgeExtend]; n[idx] = {...n[idx]!, detail: e.target.value}; setKnowledgeExtend(n); }}
                    placeholder="关系说明（1-2句）" className="w-full text-xs" />
                </div>
                <button onClick={() => setKnowledgeExtend(knowledgeExtend.filter((_, i) => i !== idx))} className="mt-1 p-1 text-slate-400 hover:text-red-500 shrink-0"><XIcon /></button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setKnowledgeExtend([...knowledgeExtend, { concept: "", relationship: "延伸", detail: "" }])}>
              <PlusIcon /> 添加知识扩展
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 右侧操作栏 */}
      <div className="w-full lg:w-80 xl:w-96 space-y-6 shrink-0 lg:sticky lg:top-24 self-start">
        <Card>
          <CardContent className="p-4 flex flex-col gap-3">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "保存中..." : editId ? "更新知识卡片" : "保存知识卡片"}
            </Button>
            <Button variant="secondary" onClick={() => router.push("/")} className="w-full">
              取消
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
}
