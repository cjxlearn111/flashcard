"""POST /api/brief — 技术简报生成接口"""

from flask import Blueprint, request, jsonify

from database import get_setting
from services.llm_client import LLMClient
from services.brief_parser import BriefParser

router = Blueprint("brief", __name__)

# 全局实例，配置由 main.py 注入
llm = LLMClient()
parser = BriefParser(llm)


@router.route("/api/brief", methods=["POST"])
def generate_brief():
    """按思维链 v3.3 将文本提炼为结构化技术简报"""
    data = request.get_json() or {}
    text = data.get("text", "")
    if not text.strip():
        return jsonify({"error": "text 不能为空"}), 400

    # 优先用请求中传的 prompt，否则用数据库保存的，最后 fallback 到默认 YAML
    custom_prompt = data.get("prompt", "")
    if not custom_prompt:
        custom_prompt = get_setting("prompt_yaml")

    result = parser.parse(text, custom_prompt)
    return jsonify(result)
