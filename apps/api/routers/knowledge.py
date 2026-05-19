"""POST /api/knowledge-card — 知识卡片生成
   GET /api/knowledge-cards — 知识卡片列表
   GET/PUT/DELETE /api/knowledge-cards/<id> — 单张知识卡片 CRUD"""

import json
import os
from typing import Any, Optional

from flask import Blueprint, request, jsonify

from database import KnowledgeCardRepository, get_setting
from models.knowledge_card import KnowledgeCard
from services.llm_client import LLMClient

router = Blueprint("knowledge", __name__)

# 全局实例，LLM 由 main.py 注入
llm: LLMClient = LLMClient()
repo = KnowledgeCardRepository()

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "services", "prompts")
KNOWLEDGE_CARD_YAML = os.path.join(PROMPTS_DIR, "knowledge_card.yaml")


def _read_knowledge_prompt() -> str:
    try:
        with open(KNOWLEDGE_CARD_YAML, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def _parse_llm_response(raw: str) -> dict[str, Any]:
    """从 LLM 响应中提取 JSON"""
    import re

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    m = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", raw)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    m = re.search(r"(\{[\s\S]*\})", raw)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    return {"_error": raw[:200]}


@router.route("/api/knowledge-card", methods=["POST"])
def generate_knowledge_card():
    """按知识卡片思维链将文本提炼为结构化知识卡片"""
    data = request.get_json() or {}
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"error": "text 不能为空"}), 400

    # 优先用请求中传的 prompt，否则用数据库保存的知识卡片 prompt，
    # 再 fallback 到问题分析 prompt，最后用 knowledge_card.yaml
    custom_prompt = data.get("prompt", "")
    if not custom_prompt:
        custom_prompt = get_setting("knowledge_prompt_yaml")
    if not custom_prompt:
        custom_prompt = get_setting("prompt_yaml")
    if not custom_prompt:
        custom_prompt = _read_knowledge_prompt()

    system_prompt = (
        "你是一个知识提取引擎。严格按以下规范分析用户输入的文本。\n"
        "只返回 JSON，不要额外解释。\n\n"
        f"{custom_prompt}\n\n"
        "请严格按照 output_schema 中的 JSON 格式返回结果。"
    )

    raw = llm.chat(system_prompt, text)
    parsed = _parse_llm_response(raw)

    # 无 API Key 时 mock 返回旧格式数据，检测并替换为知识卡片格式
    if "claim_groups" in parsed:
        parsed = _knowledge_mock(text)

    return jsonify({"data": parsed})


def _knowledge_mock(text: str) -> dict[str, Any]:
    """无 API Key 时返回模拟知识卡片数据"""
    return {
        "domain": "编程与工具",
        "terms": [
            {"term": "示例术语", "definition": "术语的简短定义"},
        ],
        "knowledge_points": [
            {
                "title": text[:30] + ("..." if len(text) > 30 else ""),
                "type": "核心概念",
                "content": text[:150] + ("..." if len(text) > 150 else ""),
                "related_pre": "无",
                "related_extend": "可进一步查阅相关文档",
            },
        ],
        "tables": [],
        "resources": [],
        "knowledge_extend": [],
    }


# ── CRUD ──


@router.route("/api/knowledge-cards", methods=["GET"])
def list_knowledge_cards():
    cards = repo.find_all()
    return jsonify({"cards": [c.to_dict() for c in cards]})


@router.route("/api/knowledge-cards/<int:card_id>", methods=["GET"])
def get_knowledge_card(card_id: int):
    card = repo.find_by_id(card_id)
    if not card:
        return jsonify({"error": "知识卡片不存在"}), 404
    return jsonify(card.to_dict())


@router.route("/api/knowledge-cards", methods=["POST"])
def save_knowledge_card():
    data = request.get_json() or {}
    try:
        card = KnowledgeCard(
            title=data.get("title", ""),
            tags=json.dumps(data.get("tags", []), ensure_ascii=False),
            source=data.get("source", ""),
            data_json=json.dumps(
                data.get("dataJson", {}), ensure_ascii=False
            ),
            summary_md=data.get("summaryMd", ""),
        )
        saved = repo.create(card)
        return jsonify(saved.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@router.route("/api/knowledge-cards/<int:card_id>", methods=["PUT"])
def update_knowledge_card(card_id: int):
    data = request.get_json() or {}
    existing = repo.find_by_id(card_id)
    if not existing:
        return jsonify({"error": "知识卡片不存在"}), 404

    from datetime import date

    existing.title = data.get("title", existing.title)
    existing.tags = json.dumps(data.get("tags", json.loads(existing.tags)), ensure_ascii=False)
    existing.source = data.get("source", existing.source)
    existing.data_json = json.dumps(
        data.get("dataJson", json.loads(existing.data_json)), ensure_ascii=False
    )
    existing.summary_md = data.get("summaryMd", existing.summary_md)
    existing.date_updated = date.today().isoformat()

    updated = repo.update(card_id, existing)
    return jsonify(updated.to_dict() if updated else {})


@router.route("/api/knowledge-cards/<int:card_id>", methods=["DELETE"])
def delete_knowledge_card(card_id: int):
    ok = repo.delete(card_id)
    return jsonify({"status": "ok" if ok else "not_found"})
