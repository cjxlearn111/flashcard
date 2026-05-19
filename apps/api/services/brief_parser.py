"""思维链编排器 — 读 YAML prompt → 调 LLM → 组装简报"""

import json
import os
import re
from typing import Any

from services.llm_client import LLMClient

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")
DEFAULT_YAML = os.path.join(PROMPTS_DIR, "default_cot.yaml")


class BriefParser:
    def __init__(self, llm: LLMClient):
        self.llm = llm

    def parse(self, text: str, custom_prompt: str = "") -> dict[str, Any]:
        # 读取 prompt
        yaml_content = custom_prompt or self._read_default_prompt()

        # 构建 system prompt
        system_prompt = (
            "你是一个知识提取引擎。严格按以下规范分析用户输入的文本。\n"
            "只返回 JSON，不要额外解释。\n\n"
            f"{yaml_content}\n\n"
            "请严格按照 output_schema 中的 JSON 格式返回结果。"
        )

        # 调用 LLM
        raw = self.llm.chat(system_prompt, text)

        # 解析响应
        layers = self._parse_response(raw)

        # 组装 Markdown 简报
        brief = self._assemble_brief(layers)

        # 质量校验
        reasoning = self._validate(brief, layers)

        return {
            "brief": brief,
            "data": layers,
            "reasoning": reasoning,
        }

    # ── 读取默认 YAML ──

    def _read_default_prompt(self) -> str:
        try:
            with open(DEFAULT_YAML, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return ""

    # ── 解析 LLM 返回的 JSON ──

    def _parse_response(self, raw: str) -> dict[str, Any]:
        """从 LLM 响应中提取 JSON，处理可能的包围内容"""
        # 尝试解析纯 JSON
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # 尝试从 ```json ... ``` 中提取
        m = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", raw)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                pass

        # 尝试从 { 开始 } 结束提取
        m = re.search(r"(\{[\s\S]*\})", raw)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                pass

        # 回退
        return {
            "conclusion": "解析失败",
            "domain": "通用",
            "terms": [],
            "claim_groups": [],
            "principles": [],
            "tensions": [],
            "evidence_map": [],
            "_error": raw[:200],
        }

    # ── 组装 Markdown 简报（阶段 4）──

    def _assemble_brief(self, layers: dict[str, Any]) -> str:
        conclusion = layers.get("conclusion", "") or ""
        domain = layers.get("domain", "通用")
        terms = layers.get("terms", []) or []
        claims = layers.get("claim_groups", []) or []
        principles = layers.get("principles", []) or []
        tensions = layers.get("tensions", []) or []
        evidence = layers.get("evidence_map", []) or []

        parts: list[str] = []

        # 核心结论
        parts.append("## 核心结论\n")
        if conclusion:
            parts.append(f"**{conclusion}**\n")
        else:
            parts.append("（未能提取核心结论）\n")

        # 术语速查
        parts.append("\n## 术语速查\n")
        if terms:
            parts.append("| 术语 | 定义 |\n|------|------|\n")
            for t in terms:
                term = t.get("term", "")
                definition = t.get("definition", "")
                parts.append(f"| **{term}** | {definition} |\n")
        else:
            parts.append("（未提取到关键术语）\n")

        # 论证骨架
        parts.append("\n## 论证骨架\n")
        if claims:
            for i, c in enumerate(claims):
                claim = c.get("claim", "")
                reasoning = c.get("reasoning", "")
                support = c.get("support", "")
                if claim:
                    parts.append(f"**{claim}**\n")
                if reasoning:
                    parts.append(f"{reasoning}\n")
                if support:
                    parts.append(f"{support}\n")
                parts.append("\n")
        else:
            parts.append("（未提取到论证结构）\n")

        # 可复用原则
        parts.append("## 可复用原则\n")
        if principles:
            for p in principles:
                condition = p.get("condition", "")
                action = p.get("action", "")
                boundary = p.get("boundary", "")
                parts.append(f"- **IF** {condition} **THEN** {action}\n")
                parts.append(f"  失效边界：{boundary or '未定义'}\n")
        else:
            parts.append("（未提取到可复用原则）\n")

        # 待裁决与边界
        parts.append("\n## 待裁决与边界\n")
        if tensions:
            for t in tensions:
                desc = t.get("description", "")
                affects = t.get("affects", "")
                parts.append(f"- [!] {desc}。")
                if affects:
                    parts.append(f"若成立，将动摇 {affects}。")
                parts.append("\n")
        else:
            parts.append("（未检测到逻辑矛盾）\n")

        # 附录
        parts.append("\n## 附录：证据来源与置信度\n")
        if evidence:
            # 按置信度排序
            confidence_order = {"A": 0, "B": 1, "C": 2}
            sorted_evidence = sorted(
                evidence,
                key=lambda e: confidence_order.get(e.get("confidence", "C"), 9),
            )
            parts.append("| 编号 | 证据内容 | 置信度 | 来源 |\n")
            parts.append("|------|----------|--------|------|\n")
            for i, e in enumerate(sorted_evidence, 1):
                content = e.get("evidence", "")
                conf = e.get("confidence", "C")
                source = e.get("source", "")
                parts.append(f"| E{i} | {content} | {conf} | {source} |\n")
        else:
            parts.append("（未提取到引用证据）\n")

        return "".join(parts)

    # ── 质量校验（阶段 5）──

    def _validate(
        self, brief: str, layers: dict[str, Any]
    ) -> list[dict[str, str]]:
        checks: list[str] = []
        all_pass = True

        # 1) 一句话结论
        conclusion = layers.get("conclusion", "")
        if not conclusion:
            checks.append("✗ 核心结论为空")
            all_pass = False
        elif len(conclusion.split("。")) > 2:
            checks.append("⚠ 核心结论超过一句话")
        else:
            checks.append("✓ 核心结论为单句")

        # 2) 术语表行数
        terms = layers.get("terms", [])
        checks.append(
            f"✓ 术语表 {len(terms)} 行"
            if len(terms) <= 10
            else f"⚠ 术语表 {len(terms)} 行（建议不超过 10）"
        )

        # 3) 破折号
        dash_count = brief.count("——")
        if dash_count > 0:
            checks.append(f"✗ 发现 {dash_count} 处破折号")
            all_pass = False
        else:
            checks.append("✓ 无破折号")

        # 4) 置信度标注
        if re.search(r"置信度[：:]\s*[ABC]", brief):
            checks.append("✗ 论证段落中含置信度标注")
            all_pass = False
        else:
            checks.append("✓ 论证段落无置信度标注")

        # 5) 原则失效边界
        principles = layers.get("principles", [])
        missing_boundary = sum(
            1 for p in principles if not p.get("boundary")
        )
        if missing_boundary:
            checks.append(f"⚠ {missing_boundary} 条原则缺少失效边界")
        else:
            checks.append(
                f"✓ {len(principles)} 条原则均含失效边界"
            )

        # 6) 证据覆盖
        evidence = layers.get("evidence_map", [])
        claims = layers.get("claim_groups", [])
        claims_with_evidence = len(
            set(e.get("claim_index") for e in evidence)
        )
        if claims and claims_with_evidence < len(claims):
            checks.append(
                f"⚠ 证据仅覆盖 {claims_with_evidence}/{len(claims)} 组主张"
            )
        else:
            checks.append(
                f"✓ 证据覆盖 {len(evidence)} 条"
            )

        # 7) 粗体系
        bold_count = len(re.findall(r"\*\*[^*]+\*\*", brief))
        if bold_count < 1:
            checks.append("✗ 无粗体内容")
            all_pass = False
        else:
            checks.append(f"✓ 含 {bold_count} 处粗体")

        total = len(checks)
        summary = (
            f"{total} 项检查，全部通过 ✓"
            if all_pass
            else f"{total} 项检查，{sum(1 for c in checks if c.startswith('✗'))} 项未通过"
        )
        return [{"step": "5. 质量校验", "detail": summary}] + [
            {"step": f"  5.{i+1}", "detail": c}
            for i, c in enumerate(checks)
        ]
