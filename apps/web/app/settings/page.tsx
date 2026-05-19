"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  fetchSettings,
  updateSettings,
  fetchPrompt,
  updatePrompt,
  resetPrompt,
  fetchKnowledgePrompt,
  updateKnowledgePrompt,
  resetKnowledgePrompt,
} from "@/lib/api";
import type { LLSettings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // API 配置
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // 思维链 prompt
  const [prompt, setPrompt] = useState("");
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptMsg, setPromptMsg] = useState("");
  const [promptMsgType, setPromptMsgType] = useState<"success" | "error">("success");

  // 知识卡片思维链 prompt
  const [knowledgePrompt, setKnowledgePrompt] = useState("");
  const [knowledgePromptSaving, setKnowledgePromptSaving] = useState(false);
  const [knowledgePromptMsg, setKnowledgePromptMsg] = useState("");
  const [knowledgePromptMsgType, setKnowledgePromptMsgType] = useState<"success" | "error">("success");

  useEffect(() => {
    Promise.all([
      fetchSettings().then((s: LLSettings) => {
        setApiUrl(s.apiUrl || "");
        setApiKey(s.apiKey || "");
        setModel(s.model || "");
      }),
      fetchPrompt().then((p) => setPrompt(p.prompt)),
      fetchKnowledgePrompt().then((p) => setKnowledgePrompt(p.prompt)),
    ])
      .catch(() => setMessageType("error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateSettings({ apiUrl, apiKey, model });
      setMessageType("success");
      setMessage("配置已保存");
    } catch {
      setMessageType("error");
      setMessage("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handlePromptSave = async () => {
    setPromptSaving(true);
    setPromptMsg("");
    try {
      await updatePrompt(prompt);
      setPromptMsgType("success");
      setPromptMsg("思维链已保存，下次生成简报时生效");
    } catch {
      setPromptMsgType("error");
      setPromptMsg("保存失败，请重试");
    } finally {
      setPromptSaving(false);
    }
  };

  const handleKnowledgePromptSave = async () => {
    setKnowledgePromptSaving(true);
    setKnowledgePromptMsg("");
    try {
      await updateKnowledgePrompt(knowledgePrompt);
      setKnowledgePromptMsgType("success");
      setKnowledgePromptMsg("知识卡片思维链已保存");
    } catch {
      setKnowledgePromptMsgType("error");
      setKnowledgePromptMsg("保存失败，请重试");
    } finally {
      setKnowledgePromptSaving(false);
    }
  };

  const handleKnowledgePromptReset = async () => {
    setKnowledgePromptSaving(true);
    setKnowledgePromptMsg("");
    try {
      const result = await resetKnowledgePrompt();
      setKnowledgePrompt(result.prompt);
      setKnowledgePromptMsgType("success");
      setKnowledgePromptMsg("已恢复默认知识卡片思维链");
    } catch {
      setKnowledgePromptMsgType("error");
      setKnowledgePromptMsg("恢复失败");
    } finally {
      setKnowledgePromptSaving(false);
    }
  };

  const handlePromptReset = async () => {
    setPromptSaving(true);
    setPromptMsg("");
    try {
      const result = await resetPrompt();
      setPrompt(result.prompt);
      setPromptMsgType("success");
      setPromptMsg("已恢复默认思维链");
    } catch {
      setPromptMsgType("error");
      setPromptMsg("恢复失败");
    } finally {
      setPromptSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 pt-8 pb-16">
        <div className="text-center py-20 text-slate-400">加载中...</div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 pt-8 pb-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/")}
        className="mb-6"
      >
        ← 返回首页
      </Button>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">API 配置</h2>
      <p className="text-sm text-slate-500 mb-8">
        配置大模型 API 后，提取卡片时会调用你的模型生成简报。不配置则使用模拟数据。
      </p>

      <Card>
        <CardHeader>
          <CardTitle>接口设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API 地址</Label>
            <Input
              id="apiUrl"
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="例如：https://api.deepseek.com"
            />
            <p className="text-xs text-slate-400">支持 OpenAI 兼容格式的 API</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">模型名称</Label>
            <Input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="例如：deepseek-v4-flash"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "保存中..." : "保存配置"}
          </Button>

          {message && (
            <div
              className={cn(
                "text-sm p-3 rounded-md border",
                messageType === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200",
              )}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 思维链配置 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>思维链配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            修改知识提炼思维链的 YAML 配置。保存后下次生成简报时生效。
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={cn(
              "w-full h-[400px] font-mono text-xs leading-relaxed",
              "border border-slate-200 rounded-md p-4 resize-y",
              "bg-slate-50 text-slate-800",
              "outline-none focus:border-slate-400 focus:bg-white",
              "placeholder:text-slate-400",
            )}
            placeholder="加载中..."
          />
          <div className="flex gap-3">
            <Button onClick={handlePromptSave} disabled={promptSaving}>
              {promptSaving ? "保存中..." : "保存"}
            </Button>
            <Button variant="secondary" onClick={handlePromptReset} disabled={promptSaving}>
              恢复默认
            </Button>
          </div>
          {promptMsg && (
            <div
              className={cn(
                "text-sm p-3 rounded-md border",
                promptMsgType === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200",
              )}
            >
              {promptMsg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 知识卡片思维链配置 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>知识卡片思维链配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            知识卡片的思维链 YAML 配置，用于控制「知识卡片」模式的知识提取逻辑。
          </p>
          <textarea
            value={knowledgePrompt}
            onChange={(e) => setKnowledgePrompt(e.target.value)}
            className={cn(
              "w-full h-[400px] font-mono text-xs leading-relaxed",
              "border border-slate-200 rounded-md p-4 resize-y",
              "bg-slate-50 text-slate-800",
              "outline-none focus:border-emerald-400 focus:bg-white",
              "placeholder:text-slate-400",
            )}
            placeholder="加载中..."
          />
          <div className="flex gap-3">
            <Button
              onClick={handleKnowledgePromptSave}
              disabled={knowledgePromptSaving}
            >
              {knowledgePromptSaving ? "保存中..." : "保存"}
            </Button>
            <Button
              variant="secondary"
              onClick={handleKnowledgePromptReset}
              disabled={knowledgePromptSaving}
            >
              恢复默认
            </Button>
          </div>
          {knowledgePromptMsg && (
            <div
              className={cn(
                "text-sm p-3 rounded-md border",
                knowledgePromptMsgType === "success"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-600 border-red-200",
              )}
            >
              {knowledgePromptMsg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card className="mt-8 bg-slate-50">
        <CardContent className="p-5 text-sm space-y-2">
          <h3 className="font-semibold text-slate-900">使用说明</h3>
          <ul className="text-slate-600 space-y-1.5 list-disc list-inside">
            <li>配置后点击保存即可生效，无需重启服务</li>
            <li>不配置 API Key 时使用模拟数据，方便调试界面</li>
            <li>API 地址需要是完整的 URL，例如 https://api.deepseek.com</li>
            <li>模型名称填写你使用的模型 ID</li>
            <li>思维链 YAML 保存后，下次点击"提取卡片"时生效</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
