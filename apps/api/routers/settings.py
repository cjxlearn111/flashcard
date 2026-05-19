"""GET/PUT /api/settings — LLM 配置管理"""
"""GET/PUT/DELETE /api/settings/prompt — 思维链 prompt 管理"""

import os
from typing import Callable, Optional
from flask import Blueprint, request, jsonify

from database import get_all_settings, get_setting, set_setting, delete_setting, init_settings_table

router = Blueprint("settings", __name__)

# 保证 settings 表存在
init_settings_table()

# 运行时配置缓存（前端设置后立即生效，无需重启）
_active_config: dict[str, str] = {}

# 暴露引用供 main.py 注入回调
_on_update: Optional[Callable[[dict[str, str]], None]] = None


def set_on_update(callback: Optional[Callable[[dict[str, str]], None]]) -> None:
    global _on_update
    _on_update = callback


def load_active_config() -> dict[str, str]:
    """从数据库加载配置并更新缓存"""
    global _active_config
    _active_config = get_all_settings()
    return _active_config


def get_active_config() -> dict[str, str]:
    if not _active_config:
        load_active_config()
    return _active_config


@router.route("/api/settings", methods=["GET"])
def get_settings():
    """获取 LLM 配置"""
    settings = load_active_config()
    return jsonify({
        "apiUrl": settings.get("llm_api_url", ""),
        "apiKey": settings.get("llm_api_key", ""),
        "model": settings.get("llm_model", ""),
    })


@router.route("/api/settings", methods=["PUT"])
def update_settings():
    """更新 LLM 配置"""
    data = request.get_json() or {}

    api_url = data.get("apiUrl", "")
    api_key = data.get("apiKey", "")
    model = data.get("model", "")

    if api_url:
        set_setting("llm_api_url", api_url)
    if api_key:
        set_setting("llm_api_key", api_key)
    if model:
        set_setting("llm_model", model)

    # 刷新缓存
    load_active_config()

    # 通知回调（main.py 中更新 LLMClient）
    if _on_update:
        _on_update(get_active_config())

    return jsonify({"status": "ok"})


# ── 默认 YAML prompt 路径 ──

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "services", "prompts")
DEFAULT_PROMPT_PATH = os.path.join(PROMPTS_DIR, "default_cot.yaml")
KNOWLEDGE_PROMPT_PATH = os.path.join(PROMPTS_DIR, "knowledge_card.yaml")


def _read_file(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def _read_default_prompt() -> str:
    return _read_file(DEFAULT_PROMPT_PATH)


def _read_default_knowledge_prompt() -> str:
    return _read_file(KNOWLEDGE_PROMPT_PATH)


def _get_current_prompt() -> str:
    """优先返回用户保存的 prompt，fallback 到默认 YAML"""
    saved = get_setting("prompt_yaml")
    return saved if saved else _read_default_prompt()


def _get_current_knowledge_prompt() -> str:
    """优先返回用户保存的知识卡片 prompt，fallback 到默认 YAML"""
    saved = get_setting("knowledge_prompt_yaml")
    return saved if saved else _read_default_knowledge_prompt()


@router.route("/api/settings/prompt", methods=["GET"])
def get_prompt():
    """获取当前思维链 prompt"""
    return jsonify({"prompt": _get_current_prompt()})


@router.route("/api/settings/prompt", methods=["PUT"])
def update_prompt():
    """保存思维链 prompt"""
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    if not prompt.strip():
        return jsonify({"error": "prompt 不能为空"}), 400
    set_setting("prompt_yaml", prompt)
    return jsonify({"status": "ok"})


@router.route("/api/settings/prompt", methods=["DELETE"])
def reset_prompt():
    """删除用户保存的 prompt，恢复默认"""
    delete_setting("prompt_yaml")
    return jsonify({"status": "ok", "prompt": _read_default_prompt()})


# ── 知识卡片思维链 prompt ──


@router.route("/api/settings/knowledge-prompt", methods=["GET"])
def get_knowledge_prompt():
    """获取当前知识卡片思维链 prompt"""
    return jsonify({"prompt": _get_current_knowledge_prompt()})


@router.route("/api/settings/knowledge-prompt", methods=["PUT"])
def update_knowledge_prompt():
    """保存知识卡片思维链 prompt"""
    data = request.get_json() or {}
    prompt = data.get("prompt", "")
    if not prompt.strip():
        return jsonify({"error": "prompt 不能为空"}), 400
    set_setting("knowledge_prompt_yaml", prompt)
    return jsonify({"status": "ok"})


@router.route("/api/settings/knowledge-prompt", methods=["DELETE"])
def reset_knowledge_prompt():
    """删除用户保存的知识卡片 prompt，恢复默认"""
    delete_setting("knowledge_prompt_yaml")
    return jsonify({"status": "ok", "prompt": _read_default_knowledge_prompt()})
