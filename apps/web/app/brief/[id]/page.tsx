"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditIcon, CopyIcon } from "@/components/ui/icons";
import { fetchBrief, deleteBrief } from "@/lib/api";
import type { Brief } from "@flashcard/shared";

interface BriefData {
  conclusion: string;
  domain: string;
  terms: { term: string; definition: string }[];
  claim_groups: { claim: string; reasoning: string; support: string }[];
  principles: { condition: string; action: string; boundary: string }[];
  tensions: { description: string; affects: string }[];
  evidence_map: { claim_index: number; evidence: string; confidence: string; source: string }[];
}

export default function BriefViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [brief, setBrief] = useState<Brief | null>(null);
  const [data, setData] = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchBrief(id)
      .then((b) => {
        setBrief(b);
        try {
          setData(JSON.parse(b.dataJson || "{}"));
        } catch {
          setData(null);
        }
      })
      .catch(() => setError("加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyMarkdown = () => {
    const md =
      brief?.briefMd ||
      dataToMarkdown(data);
    navigator.clipboard.writeText(md);
  };

  const handleEdit = () => {
    if (brief) {
      sessionStorage.setItem("editBrief", JSON.stringify(brief));
      router.push("/preview");
    }
  };

  const handleDelete = async () => {
    if (!brief) return;
    await deleteBrief(brief.id);
    router.push("/");
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center py-20 text-slate-400">加载中...</div>
      </main>
    );
  }

  if (error || !brief) {
    return (
      <main className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">{error || "简报不存在"}</div>
        <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900">← 返回首页</button>
      </main>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto px-6 pt-8 pb-16">
      {/* 左侧：内容 */}
      <div className="flex-1 space-y-10">
        <div>
          <button onClick={() => router.push("/")} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-6 transition-colors">
            ← 返回列表
          </button>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
              {brief.domain || "通用"}
            </span>
            <span className="text-sm text-slate-500">{brief.dateCreated}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
            {brief.title || "未命名简报"}
          </h1>
        </div>

        {data?.terms && data.terms.length > 0 && (
          <ViewerSection title="术语速查">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.terms.map((t, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="font-bold text-slate-900 text-sm mb-1">{t.term}</div>
                  <div className="text-sm text-slate-600">{t.definition}</div>
                </div>
              ))}
            </div>
          </ViewerSection>
        )}

        {data?.claim_groups && data.claim_groups.length > 0 && (
          <ViewerSection title="论证骨架">
            <div className="space-y-6">
              {data.claim_groups.map((c, i) => (
                <div key={i} className="pl-4 border-l-2 border-emerald-200">
                  <h4 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
                    <span className="text-emerald-500 text-sm">{i + 1}.</span> {c.claim}
                  </h4>
                  <div className="space-y-3 mt-3 text-sm">
                    <div>
                      <span className="font-semibold text-slate-700 mr-2 bg-slate-100 px-1.5 py-0.5 rounded text-xs">推理</span>
                      <span className="text-slate-600">{c.reasoning}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 mr-2 bg-slate-100 px-1.5 py-0.5 rounded text-xs">支撑</span>
                      <span className="text-slate-600">{c.support}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ViewerSection>
        )}

        {data?.principles && data.principles.length > 0 && (
          <ViewerSection title="可复用原则">
            <div className="space-y-4">
              {data.principles.map((p, i) => (
                <div key={i} className="bg-blue-50/50 rounded-xl p-5 border border-blue-100/50">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-3">
                    <span className="font-bold text-blue-700 text-sm shrink-0">IF (条件)</span>
                    <span className="text-slate-800 font-medium">{p.condition}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-4">
                    <span className="font-bold text-emerald-600 text-sm shrink-0">THEN (行动)</span>
                    <span className="text-slate-800 font-medium">{p.action}</span>
                  </div>
                  {p.boundary && (
                    <div className="text-sm text-slate-500 pt-3 border-t border-blue-100">
                      <span className="font-semibold mr-1">边界限制:</span> {p.boundary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ViewerSection>
        )}

        {data?.tensions && data.tensions.length > 0 && (
          <ViewerSection title="待裁决与矛盾">
            <ul className="space-y-3">
              {data.tensions.map((u, i) => (
                <li key={i} className="flex gap-3 text-sm bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                  <span className="text-red-500 shrink-0 mt-0.5">!</span>
                  <div>
                    <div className="text-slate-800 font-medium mb-1">{u.description}</div>
                    {u.affects && <div className="text-xs text-red-600/80">威胁关联: {u.affects}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </ViewerSection>
        )}

        {/* 无内容提示 */}
        {!data?.terms?.length && !data?.claim_groups?.length && !data?.principles?.length && !data?.tensions?.length && (
          <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
            简报内容为空
          </div>
        )}
      </div>

      {/* 右侧：操作栏 */}
      <div className="w-full lg:w-72 shrink-0 space-y-6 lg:sticky lg:top-24 self-start">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <button onClick={handleEdit}
            className="w-full py-2.5 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2">
            <EditIcon /> 编辑简报
          </button>
          <button onClick={handleCopyMarkdown}
            className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <CopyIcon /> 复制 Markdown
          </button>
          <button onClick={handleDelete}
            className="w-full py-2.5 bg-transparent text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors mt-2">
            删除
          </button>
        </div>

        {brief.source && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm">
            <h4 className="font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">资料来源</h4>
            <p className="text-slate-600 break-words">{brief.source}</p>
          </div>
        )}

        {data?.evidence_map && data.evidence_map.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm">
            <h4 className="font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">证据附录</h4>
            <div className="space-y-4">
              {data.evidence_map.map((e, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="text-slate-700">{e.evidence}</div>
                  <div className="flex justify-between text-slate-400">
                    <span>置信度: {e.confidence}</span>
                    <span className="truncate ml-2">{e.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-6 border-t border-slate-100">
      <h3 className="text-xl font-bold mb-5 text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function dataToMarkdown(data: BriefData | null): string {
  if (!data) return "";
  let md = `# ${data.conclusion || "简报"}\n\n`;
  if (data.terms?.length) {
    md += "## 术语速查\n";
    data.terms.forEach((t) => (md += `- **${t.term}**: ${t.definition}\n`));
    md += "\n";
  }
  if (data.claim_groups?.length) {
    md += "## 论证骨架\n";
    data.claim_groups.forEach((c, i) => {
      md += `### ${i + 1}. ${c.claim}\n`;
      md += `- **推理**: ${c.reasoning}\n`;
      md += `- **支撑**: ${c.support}\n\n`;
    });
  }
  if (data.principles?.length) {
    md += "## 可复用原则\n";
    data.principles.forEach((p) => {
      md += `- **IF** ${p.condition} **THEN** ${p.action}\n`;
      if (p.boundary) md += `  - *边界*: ${p.boundary}\n`;
    });
    md += "\n";
  }
  if (data.tensions?.length) {
    md += "## 待裁决与边界\n";
    data.tensions.forEach((u) => {
      md += `- ! ${u.description}${u.affects ? ` (威胁目标: ${u.affects})` : ""}\n`;
    });
    md += "\n";
  }
  return md;
}
