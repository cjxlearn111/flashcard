from flask import Blueprint, request, jsonify

from services.parser import CoTParser

router = Blueprint("parse", __name__)
parser = CoTParser()


@router.route("/api/parse", methods=["POST"])
def parse_text():
    """CoT 5 步解析 → 提取知识卡片"""
    data = request.get_json() or {}
    text = data.get("text", "")
    result = parser.parse(text)
    return jsonify(result)
