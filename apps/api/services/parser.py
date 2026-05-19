import re
from typing import Any


class CoTParser:
    """CoT 5 步文本解析引擎"""

    def parse(self, text: str) -> dict[str, Any]:
        # Step 1: 宏观结构分析
        sections = self._detect_sections(text)

        all_cards: list[dict[str, Any]] = []
        units_by_section: list[list[dict[str, Any]]] = []
        cards_by_section: list[list[dict[str, Any]]] = []

        # Step 2-4: 逐章节处理
        for section in sections:
            title = section["title"]
            content = section["content"]
            domain = self._guess_domain(title, content)

            # Step 2: 语义单元分割
            units = self._segment_units(content)
            units_by_section.append(units)

            # Step 3-4: 知识点提取 + QA 对构造
            section_cards = []
            for unit in units:
                q, a, method = self._split_qa(unit["text"])
                a = self._clean_answer(a)
                card: dict[str, Any] = {
                    "question": q,
                    "answer": a,
                    "domain": domain,
                    "topic": title,
                    "_rule": method,
                }
                if unit["title"] and len(unit["title"]) < 50:
                    card["question"] = unit["title"]
                    card["_rule"] = f"卡片标题 → {unit['title']}"
                section_cards.append(card)

            cards_by_section.append(section_cards)
            all_cards.extend(section_cards)

        # 兜底
        if not all_cards:
            q, a, method = self._split_qa(text.strip())
            all_cards.append({
                "domain": self._guess_domain("", text),
                "topic": "通用",
                "question": q,
                "answer": a,
                "_rule": method,
            })
            if not sections:
                sections = [{"title": "通用", "content": text}]
                units_by_section = [[{"text": text, "title": "", "source": "整体段落"}]]
                cards_by_section = [[all_cards[0]]]

        # 构建 CoT 推理链
        reasoning = self._build_reasoning_5step(
            sections, units_by_section, cards_by_section, all_cards
        )

        # 去掉内部 _rule 字段
        result_cards = []
        for card in all_cards:
            c = {k: v for k, v in card.items() if not k.startswith("_")}
            result_cards.append(c)

        return {"cards": result_cards, "reasoning": reasoning}

    # ── Step 1: 宏观结构分析 ──

    def _detect_sections(self, text: str) -> list[dict[str, str]]:
        lines = text.split("\n")
        sections: list[dict[str, str]] = []
        current_title = "通用"
        current_content: list[str] = []

        for line in lines:
            stripped = line.strip()
            if stripped and (stripped.startswith("##") or stripped.startswith("#")):
                if current_content:
                    sections.append({
                        "title": current_title,
                        "content": "\n".join(current_content).strip(),
                    })
                    current_content = []
                current_title = stripped.lstrip("#").strip()
            elif stripped and re.match(r"^[一二三四五六七八九十]+[、.．]\s*\S", stripped):
                if current_content:
                    sections.append({
                        "title": current_title,
                        "content": "\n".join(current_content).strip(),
                    })
                    current_content = []
                current_title = stripped
            elif re.match(r"^[-]{3,}$", stripped) or re.match(r"^[*]{3,}$", stripped):
                if current_content:
                    sections.append({
                        "title": current_title,
                        "content": "\n".join(current_content).strip(),
                    })
                    current_content = []
                current_title = "通用"
            else:
                current_content.append(line)

        if current_content:
            sections.append({
                "title": current_title,
                "content": "\n".join(current_content).strip(),
            })
        return sections

    def _guess_domain(self, title: str, content: str) -> str:
        domain_map = {
            "AI工具": [
                "cursor", "trae", "copilot", "vibe coding", "ide",
                "codebuddy", "replit", "codeium", "qoder", "通义灵码",
            ],
            "训练方法": [
                "预训练", "后训练", "sft", "rlhf", "rlvr", "微调",
                "fine-tuning", "强化学习", "对齐",
            ],
            "模型架构": [
                "transformer", "注意力", "参数", "moe", "mla",
                "embedding", "黑盒",
            ],
            "概念解释": ["什么是", "定义", "本质", "核心", "类比", "tacit"],
            "行业动态": ["2025", "开源", "发布", "范式", "标准"],
        }
        combined = (title + " " + content).lower()
        for domain, keywords in domain_map.items():
            for kw in keywords:
                if kw.lower() in combined:
                    return domain
        return "通用"

    # ── Step 2: 语义单元分割 ──

    def _segment_units(self, content: str) -> list[dict[str, Any]]:
        units: list[dict[str, Any]] = []

        # 1) 卡片标记分割
        card_blocks = re.split(r"(?:卡片|Card)\s*\d+[：:]\s*", content)
        if len(card_blocks) > 1:
            for block in card_blocks[1:]:
                block = block.strip()
                if block:
                    first_line = block.split("\n")[0].strip()
                    units.append({
                        "text": block,
                        "title": first_line,
                        "source": "卡片标记",
                    })
            return units

        # 2) 空行分割（段落 > 20 字）
        paragraphs = [
            p.strip() for p in content.split("\n\n")
            if p.strip() and len(p.strip()) > 20
        ]
        if len(paragraphs) >= 2:
            for p in paragraphs:
                units.append({"text": p, "title": "", "source": "段落分割"})
            return units

        # 3) 列表项分割
        lines = content.split("\n")
        list_items = []
        for line in lines:
            line = line.strip()
            if re.match(r"^\d+[.、．]\s+", line) or re.match(r"^[-•·]\s+", line):
                item = re.sub(r"^[\d\-.•·]+[\s.、．]*", "", line).strip()
                if item:
                    list_items.append(item)
        if len(list_items) >= 2:
            for item in list_items:
                units.append({"text": item, "title": "", "source": "列表项"})
            return units

        # 4) 句号分割
        sentences = [
            s.strip() for s in re.split(r"[。！？]", content)
            if s.strip() and len(s.strip()) > 15
        ]
        if len(sentences) >= 2:
            for s in sentences:
                units.append({"text": s, "title": "", "source": "句号分割"})
            return units

        # 5) 回退
        return [{"text": content.strip(), "title": "", "source": "整体段落"}]

    # ── Step 3: Q&A 分离 ──

    def _split_qa(self, text: str) -> tuple[str, str, str]:
        text = text.strip()
        if not text:
            return ("", "", "")

        # 规则1: 加粗术语
        m = re.search(r"\*\*(.+?)\*\*", text)
        if m:
            q = m.group(1).strip()
            before = text[: m.start()].strip()
            after = text[m.end() :].strip()
            a = (before + " " + after).strip()
            if a:
                return (q, a, "加粗术语提取")
            return (q, text, "加粗术语提取(解释为空，回退全文)")

        # 规则2: 定义句式
        for pattern, name in [
            (r"^(.+?)(?:是指|指的是|就是|意思是)(.+)", "定义句式「是指/指的是/就是」"),
            (r"^(.+?)是(.+)", "定义句式「是」"),
            (r"^(.+?)即(.+)", "定义句式「即」"),
            (r"^所谓(.+?)[，,]\s*(.+)", "定义句式「所谓」"),
        ]:
            m = re.match(pattern, text)
            if m and m.group(2).strip():
                q = m.group(1).strip()
                a = m.group(2).strip()
                if len(q) < 30:
                    return (q, a, name)

        # 规则3: 冒号分隔
        m = re.match(r"^(.+?)[：:]\s*(.+)", text)
        if m and m.group(2).strip():
            return (m.group(1).strip(), m.group(2).strip(), "冒号分隔")

        # 规则4: 首句分隔
        sentences = re.split(r"[。！？\n]", text)
        sentences = [s.strip() for s in sentences if s.strip()]
        if len(sentences) >= 2:
            return (sentences[0], " ".join(sentences[1:]), "首句分隔")

        # 规则5: 回退
        if len(text) > 40:
            return (text[:40] + "...", text, "截断回退")
        return (text, text, "全文兜底")

    def _clean_answer(self, answer: str) -> str:
        if not answer:
            return answer
        lines = answer.split("\n")
        cleaned = []
        for line in lines:
            stripped = line.strip()
            if re.match(r"^(?:核心术语|关联概念|理解性注释|标签)[：:]\s*", stripped):
                continue
            m = re.match(r"^定义与上下文[：:]\s*(.*)", stripped)
            if m:
                cleaned.append(m.group(1).strip())
                continue
            cleaned.append(stripped)
        result = " ".join(c for c in cleaned if c).strip()
        return result if result else answer

    # ── Step 5: 质量验证 ──

    def _build_reasoning_5step(
        self,
        sections: list[dict[str, str]],
        units_by_section: list[list[dict[str, Any]]],
        cards_by_section: list[list[dict[str, Any]]],
        all_cards: list[dict[str, Any]],
    ) -> list[dict[str, str]]:
        reasoning: list[dict[str, str]] = []

        # Step 1
        titles = [s["title"] for s in sections]
        detail = f"检测到 {len(sections)} 个章节"
        if titles:
            detail += f": {' → '.join(titles)}"
        reasoning.append({"step": "1. 宏观结构分析", "detail": detail})

        # Step 2
        for i, s in enumerate(sections):
            units = units_by_section[i]
            unit_desc = "；".join(
                [
                    f"单元 {j+1}: 「{u['text'][:30]}…」({u['source']})"
                    if len(u["text"]) > 30
                    else f"单元 {j+1}: 「{u['text']}」({u['source']})"
                    for j, u in enumerate(units[:5])
                ]
            )
            if len(units) > 5:
                unit_desc += f"…等共 {len(units)} 个单元"
            reasoning.append({
                "step": f"2.{i+1} 语义单元分割「{s['title']}」",
                "detail": f"拆分为 {len(units)} 个原子知识单元: {unit_desc}",
            })

        # Step 3
        for i, s in enumerate(sections):
            cards = cards_by_section[i]
            for j, card in enumerate(cards):
                rule = card.get("_rule", "规则匹配")
                reasoning.append({
                    "step": f"3.{i+1}.{j+1} 知识点提取「{card['question'][:25]}」",
                    "detail": f"匹配规则: {rule} → 知识点取自{rule.split('→')[0].strip() if '→' in rule else rule}",
                })

        # Step 4
        qa_details = []
        for card in all_cards:
            q = card["question"]
            a = card["answer"]
            checks = []
            if q and a:
                checks.append("✓ Q≠A" if q != a else "⚠ Q=A")
                checks.append("✓ 非空" if q and a else "⚠ 为空")
            qa_details.append(f"「{q[:20]}」: {' | '.join(checks)}")
        reasoning.append({
            "step": "4. QA 对构造",
            "detail": f"共 {len(all_cards)} 张卡片: {'; '.join(qa_details[:5])}"
            + ("…" if len(qa_details) > 5 else ""),
        })

        # Step 5
        issues = []
        for i, card in enumerate(all_cards):
            q, a = card.get("question", ""), card.get("answer", "")
            if not q or not a:
                issues.append(f"卡片 {i+1}「{q[:15] or '空'}」内容不完整")
            elif q == a:
                issues.append(f"卡片 {i+1}「{q[:15]}」知识点等同解释")
            elif len(a) < 10:
                issues.append(f"卡片 {i+1}「{q[:15]}」解释过短({len(a)}字)")

        total = len(all_cards)
        if issues:
            detail = f"共 {total} 张卡片，{len(issues)} 个问题: {'; '.join(issues)}"
        else:
            detail = f"共 {total} 张卡片，全部合格 ✓"
        reasoning.append({"step": "5. 质量验证", "detail": detail})

        return reasoning
