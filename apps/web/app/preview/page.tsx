"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "@/components/ui/icons";
import { generateBrief, parseText, saveCards } from "@/lib/api";
import type { Brief, ParsedCard } from "@flashcard/shared";

interface BriefData {
  conclusion: string;
  domain: string;
  terms: { term: string; definition: string }[];
  claim_groups: { claim: string; reasoning: string; support: string }[];
  principles: { condition: string; action: string; boundary: string }[];
  tensions: { description: string; affects: string }[];
  evidence_map: { claim_index: number; evidence: string; confidence: string; source: string }[];
}

const CATEGORIES = ["AI与技术", "认知与行为", "产品与商业", "编程与工具", "通用"];
const CONFIDENCE_LEVELS = ["A", "B", "C"];

export default function PreviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // 表单数据
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("AI与技术");
  const [source, setSource] = useState("");
  const [terms, setTerms] = useState<{ term: string; definition: string }[]>([]);
  const [claims, setClaims] = useState<{ claim: string; reasoning: string; support: string }[]>([]);
  const [principles, setPrinciples] = useState<{ condition: string; action: string; boundary: string }[]>([]);
  const [tensions, setTensions] = useState<{ description: string; affects: string }[]>([]);
  const [evidence, setEvidence] = useState<{ claim_index: number; evidence: string; confidence: string; source: string }[]>([]);
  const [briefMd, setBriefMd] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [fallbackCards, setFallbackCards] = useState<ParsedCard[] | null>(null);
  const [savingCards, setSavingCards] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 优先检查编辑模式
      const editRaw = sessionStorage.getItem("editBrief");
      if (editRaw) {
        sessionStorage.removeItem("editBrief");
        try {
          const brief: Brief = JSON.parse(editRaw);
          setEditId(brief.id);
          setSource(brief.source || "");
          setBriefMd(brief.briefMd || "");
          const data: BriefData = JSON.parse(brief.dataJson || "{}");
          setTitle(data.conclusion || brief.title || "");
          setDomain(data.domain || brief.domain || "AI与技术");
          setTerms(data.terms || []);
          setClaims(data.claim_groups || []);
          setPrinciples(data.principles || []);
          setTensions(data.tensions || []);
          setEvidence(data.evidence_map || []);
          setLoading(false);
          return;
        } catch {
          // 解析失败，走新生成流程
        }
      }

      // 新生成模式
      const text = sessionStorage.getItem("parseText");
      if (!text) {
        setError("没有待解析的文本");
        setLoading(false);
        return;
      }
      // 先不删除，降级时还要用。保存成功后再删

      try {
        const result = await generateBrief(text);
        const data = result.data;
        setTitle(data.conclusion || "");
        setDomain(data.domain || "AI与技术");
        setTerms(data.terms || []);
        setClaims(data.claim_groups || []);
        setPrinciples(data.principles || []);
        setTensions(data.tensions || []);
        setEvidence(data.evidence_map || []);
        setBriefMd(result.brief);
      } catch (e) {
        setError(e instanceof Error ? e.message : "生成简报失败");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const buildDataJson = (): string => {
    return JSON.stringify({
      conclusion: title,
      domain,
      terms,
      claim_groups: claims,
      principles,
      tensions,
      evidence_map: evidence,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        title,
        domain,
        source,
        dataJson: buildDataJson(),
        briefMd,
      };

      let result: Brief;
      if (editId) {
        result = await import("@/lib/api").then((api) =>
          api.updateBrief(editId, payload),
        );
      } else {
        result = await import("@/lib/api").then((api) =>
          api.saveBrief(payload),
        );
      }
      sessionStorage.removeItem("parseText");
      router.push(`/brief/${result.id}`);
    } catch {
      setError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 降级：改用规则引擎解析 Q&A 卡片
  const handleRetryParse = async () => {
    const text = sessionStorage.getItem("parseText");
    if (!text) {
      setError("没有待解析的文本");
      return;
    }
    setRetrying(true);
    setError("");
    try {
      const result = await parseText(text);
      if (!result.cards?.length) {
        throw new Error("未能解析出卡片");
      }
      setFallbackCards(result.cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : "规则解析失败");
    } finally {
      setRetrying(false);
    }
  };

  // 保存降级解析的卡片
  const handleSaveCards = async () => {
    if (!fallbackCards) return;
    setSavingCards(true);
    try {
      await saveCards({ cards: fallbackCards });
      sessionStorage.removeItem("parseText");
      router.push("/");
    } catch {
      setError("保存卡片失败");
    } finally {
      setSavingCards(false);
    }
  };

  // 数组操作辅助
  function addItem<T>(list: T[], setter: (v: T[]) => void, template: T) {
    setter([...list, template]);
  }
  function updateItem<T>(list: T[], setter: (v: T[]) => void, index: number, field: keyof T, value: string) {
    const next = [...list];
    next[index] = { ...next[index], [field]: value } as T;
    setter(next);
  }
  function removeItem<T>(list: T[], setter: (v: T[]) => void, index: number) {
    setter(list.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center py-20 text-slate-400">正在生成简报...</div>
      </main>
    );
  }

  // 生成完成后检查数据是否为空
  const isEmpty =
    !loading &&
    claims.length === 0 &&
    terms.length === 0 &&
    principles.length === 0;

  if ((error && !title) || isEmpty) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
        )}
        {isEmpty && !error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-amber-800">简报内容为空</h3>
            <p className="text-sm text-amber-700">
              模型返回的数据不完整，没有提取到术语、主张或原则。可能原因：
            </p>
            <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
              <li>API Key 无效或已过期</li>
              <li>模型返回格式不符合预期</li>
              <li>输入文本太短或不够清晰</li>
            </ul>
            <div className="flex gap-3 pt-1">
              <a href="/settings" className="inline-flex items-center justify-center rounded-md bg-white border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 transition-colors">
                检查 API 配置
              </a>
              <button
                onClick={handleRetryParse}
                disabled={retrying}
                className="inline-flex items-center justify-center rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 transition-colors disabled:opacity-50"
              >
                {retrying ? "解析中..." : "改用规则引擎提取"}
              </button>
            </div>
          </div>
        )}
        <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← 返回首页
        </button>
      </main>
    );
  }

  // 降级卡片列表
  if (fallbackCards) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← 返回首页
          </button>
          <h2 className="text-lg font-bold text-slate-900">规则解析结果</h2>
        </div>

        <p className="text-sm text-slate-500">
          使用规则引擎提取到 {fallbackCards.length} 张知识卡片
        </p>

        <div className="grid gap-4">
          {fallbackCards.map((card, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{i + 1}</span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{card.domain}</span>
                <span className="text-xs text-slate-400">{card.topic}</span>
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{card.question}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{card.answer}</p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveCards}
          disabled={savingCards}
          className="w-full py-2.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
        >
          {savingCards ? "保存中..." : `保存 ${fallbackCards.length} 张卡片`}
        </button>
      </main>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto px-6 pt-8 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 左侧：编辑区 */}
      <div className="flex-1 space-y-8">
        {/* 标题栏 */}
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← 返回
          </button>
          <h2 className="text-lg font-bold text-slate-900">{editId ? "编辑简报" : "编辑简报"}</h2>
        </div>

        {/* 核心结论 */}
        <SectionCard title="核心结论 (Core Conclusion)">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="一句话概括最核心主张..."
            className="w-full text-xl font-bold bg-slate-50 border border-slate-200 rounded-md px-4 py-3 outline-none focus:border-slate-400 focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-400"
          />
        </SectionCard>

        {/* 术语速查 */}
        <SectionCard title="术语速查 (Terminology)">
          <div className="space-y-3">
            {terms.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start group">
                <input
                  type="text" value={item.term} onChange={(e) => updateItem(terms, setTerms, idx, "term", e.target.value)}
                  placeholder="术语名称" className="w-1/3 h-9 text-sm border border-slate-200 rounded-md px-3 outline-none focus:border-slate-400"
                />
                <input
                  type="text" value={item.definition} onChange={(e) => updateItem(terms, setTerms, idx, "definition", e.target.value)}
                  placeholder="定义描述" className="flex-1 h-9 text-sm border border-slate-200 rounded-md px-3 outline-none focus:border-slate-400"
                />
                <button onClick={() => removeItem(terms, setTerms, idx)} className="mt-1.5 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><XIcon /></button>
              </div>
            ))}
            <AddBtn onClick={() => addItem(terms, setTerms, { term: "", definition: "" })}>添加术语</AddBtn>
          </div>
        </SectionCard>

        {/* 论证骨架 */}
        <SectionCard title="论证骨架 (Argument Skeleton)" bgClass="bg-emerald-50/30">
          <div className="space-y-4">
            {claims.map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 p-3 bg-slate-50/80 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                  <input
                    type="text" value={item.claim} onChange={(e) => updateItem(claims, setClaims, idx, "claim", e.target.value)}
                    placeholder="主张标题..." className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:font-normal"
                  />
                  <button onClick={() => removeItem(claims, setClaims, idx)} className="p-1 text-slate-400 hover:text-red-500"><XIcon /></button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">推理 (Reasoning)</label>
                    <textarea
                      value={item.reasoning} onChange={(e) => updateItem(claims, setClaims, idx, "reasoning", e.target.value)}
                      placeholder="推理过程..." className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-slate-400 min-h-[60px] resize-y"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">支撑 (Support)</label>
                    <textarea
                      value={item.support} onChange={(e) => updateItem(claims, setClaims, idx, "support", e.target.value)}
                      placeholder="事实、数据或案例支撑..." className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-slate-400 min-h-[60px] resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
            <AddBtn onClick={() => addItem(claims, setClaims, { claim: "", reasoning: "", support: "" })}>添加主张模块</AddBtn>
          </div>
        </SectionCard>

        {/* 可复用原则 */}
        <SectionCard title="可复用原则 (Reusable Principles)" bgClass="bg-blue-50/30">
          <div className="space-y-4">
            {principles.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-white border border-blue-100 rounded-lg p-4 shadow-sm relative group">
                <button onClick={() => removeItem(principles, setPrinciples, idx)} className="absolute right-2 top-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><XIcon /></button>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 w-12 shrink-0">IF</span>
                    <input type="text" value={item.condition} onChange={(e) => updateItem(principles, setPrinciples, idx, "condition", e.target.value)}
                      placeholder="遇到什么情况..." className="flex-1 h-8 text-sm border-b border-slate-200 bg-transparent px-1 outline-none focus:border-blue-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 w-14 shrink-0">THEN</span>
                    <input type="text" value={item.action} onChange={(e) => updateItem(principles, setPrinciples, idx, "action", e.target.value)}
                      placeholder="应该采取什么策略..." className="flex-1 h-8 text-sm border-b border-slate-200 bg-transparent px-1 outline-none focus:border-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 mb-1 block">失效边界</span>
                    <textarea value={item.boundary} onChange={(e) => updateItem(principles, setPrinciples, idx, "boundary", e.target.value)}
                      placeholder="在何种情况下此原则不适用..." className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-slate-400 min-h-[50px] resize-y" />
                  </div>
                </div>
              </div>
            ))}
            <AddBtn onClick={() => addItem(principles, setPrinciples, { condition: "", action: "", boundary: "" })}>添加原则</AddBtn>
          </div>
        </SectionCard>

        {/* 待裁决与边界 */}
        <SectionCard title="待裁决与边界 (Unresolved & Conflicts)" bgClass="bg-red-50/30">
          <div className="space-y-3">
            {tensions.map((item, idx) => (
              <div key={idx} className="flex gap-3 items-start group bg-white border border-red-100 rounded-md p-3">
                <div className="flex-1 space-y-2">
                  <textarea value={item.description} onChange={(e) => updateItem(tensions, setTensions, idx, "description", e.target.value)}
                    placeholder="矛盾或缺失描述..." className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-red-300 min-h-[50px] resize-y" />
                  <input type="text" value={item.affects} onChange={(e) => updateItem(tensions, setTensions, idx, "affects", e.target.value)}
                    placeholder="影响的主张/原则 (选填)" className="w-full h-7 text-xs border-b border-slate-200 bg-transparent outline-none focus:border-slate-400" />
                </div>
                <button onClick={() => removeItem(tensions, setTensions, idx)} className="mt-1 p-1 text-slate-300 hover:text-red-500"><XIcon /></button>
              </div>
            ))}
            <AddBtn onClick={() => addItem(tensions, setTensions, { description: "", affects: "" })}>添加待裁决项</AddBtn>
          </div>
        </SectionCard>
      </div>

      {/* 右侧：操作 + 元数据 */}
      <div className="w-full lg:w-80 xl:w-96 space-y-6 shrink-0 lg:sticky lg:top-24 self-start">
        {/* 操作按钮 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50">
            {saving ? "保存中..." : editId ? "更新简报" : "保存简报"}
          </button>
          <button onClick={() => router.push("/")}
            className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">
            取消
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">{error}</div>
        )}

        {/* 元数据 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">元数据 (Metadata)</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">领域分类</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)}
              className="w-full h-9 text-sm border border-slate-200 rounded-md px-3 bg-white outline-none focus:border-slate-400">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">原始资料来源</label>
            <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
              placeholder="URL 或备注" className="w-full h-9 text-sm border border-slate-200 rounded-md px-3 bg-white outline-none focus:border-slate-400" />
          </div>
        </div>

        {/* 证据附录 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">证据附录表</h3>
          <div className="space-y-3">
            {evidence.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs space-y-2 relative group">
                <button onClick={() => removeItem(evidence, setEvidence, idx)} className="absolute right-1 top-1 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><XIcon /></button>
                <textarea value={item.evidence} onChange={(e) => updateItem(evidence, setEvidence, idx, "evidence", e.target.value)}
                  placeholder="证据内容简述..." className="w-full bg-transparent border-none outline-none resize-y min-h-[40px]" />
                <div className="flex gap-2 pt-2 border-t border-slate-200/50">
                  <select value={item.confidence} onChange={(e) => updateItem(evidence, setEvidence, idx, "confidence", e.target.value)}
                    className="bg-white border border-slate-200 rounded px-1 py-0.5 outline-none text-xs">
                    {CONFIDENCE_LEVELS.map((l) => <option key={l} value={l}>置信度 {l}</option>)}
                  </select>
                  <input type="text" value={item.source} onChange={(e) => updateItem(evidence, setEvidence, idx, "source", e.target.value)}
                    placeholder="出处" className="flex-1 bg-white border border-slate-200 rounded px-2 py-0.5 outline-none text-xs" />
                </div>
              </div>
            ))}
            <button onClick={() => addItem(evidence, setEvidence, { claim_index: 0, evidence: "", confidence: "B", source: "" })}
              className="w-full py-1.5 border border-dashed border-slate-300 rounded text-xs text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors">
              + 添加证据
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 小组件
function SectionCard({ title, children, bgClass = "bg-white" }: { title: string; children: React.ReactNode; bgClass?: string }) {
  return (
    <div className={`border border-slate-200 rounded-xl p-6 shadow-sm ${bgClass}`}>
      <h3 className="text-lg font-bold mb-4 text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors">
      <PlusIcon /> {children}
    </button>
  );
}
