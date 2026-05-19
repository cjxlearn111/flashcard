from datetime import date

from flask import Blueprint, request, jsonify

from database import CardRepository
from models.card import Card

router = Blueprint("cards", __name__)
repo = CardRepository()


@router.route("/api/cards", methods=["GET"])
def get_cards():
    """获取所有卡片"""
    cards = repo.find_all()
    return jsonify({"cards": [c.to_dict() for c in cards]})


@router.route("/api/cards", methods=["POST"])
def save_cards():
    """批量保存卡片"""
    data = request.get_json() or {}
    today = date.today().isoformat()
    card_models = [
        Card(
            domain=c.get("domain", ""),
            topic=c.get("topic", ""),
            question=c["question"],
            answer=c["answer"],
            source="AI粘贴",
            date_created=today,
            next_review=today,
            level=0,
        )
        for c in data.get("cards", [])
    ]
    count = repo.create_many(card_models)
    return jsonify({"status": "ok", "count": count})
