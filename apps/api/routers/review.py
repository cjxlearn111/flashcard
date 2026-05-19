from datetime import date

from flask import Blueprint, request, jsonify

from database import CardRepository
from services.spaced_repetition import calculate_next_review

router = Blueprint("review", __name__)
repo = CardRepository()


@router.route("/api/review", methods=["GET"])
def get_review():
    """获取待复习卡片"""
    today = date.today().isoformat()
    cards = repo.find_due_reviews(today)
    return jsonify({"cards": [c.to_dict() for c in cards]})


@router.route("/api/review", methods=["POST"])
def submit_review():
    """提交复习评分"""
    data = request.get_json() or {}
    card_id = data.get("id")
    rating = data.get("rating")
    next_review = calculate_next_review(rating)
    repo.update_review(card_id, next_review)
    return jsonify({"status": "ok"})
