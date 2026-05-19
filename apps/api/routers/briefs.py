"""CRUD /api/briefs — 简报持久化"""

from datetime import date

from flask import Blueprint, request, jsonify

from database import BriefRepository
from models.brief import Brief

router = Blueprint("briefs", __name__)
repo = BriefRepository()


@router.route("/api/briefs", methods=["GET"])
def list_briefs():
    """获取所有简报"""
    briefs = repo.find_all()
    return jsonify({"briefs": [b.to_dict() for b in briefs]})


@router.route("/api/briefs/<int:brief_id>", methods=["GET"])
def get_brief(brief_id: int):
    """获取单条简报"""
    brief = repo.find_by_id(brief_id)
    if not brief:
        return jsonify({"error": "简报不存在"}), 404
    return jsonify(brief.to_dict())


@router.route("/api/briefs", methods=["POST"])
def save_brief():
    """保存简报"""
    data = request.get_json() or {}
    today = date.today().isoformat()

    # 从请求体构建字段
    title = data.get("title", "")
    domain = data.get("domain", "")
    source = data.get("source", "")
    data_json = data.get("dataJson", "{}")
    brief_md = data.get("briefMd", "")

    brief = Brief(
        title=title,
        domain=domain,
        source=source,
        data_json=data_json,
        brief_md=brief_md,
        date_created=today,
        date_updated=today,
    )
    saved = repo.create(brief)
    return jsonify(saved.to_dict()), 201


@router.route("/api/briefs/<int:brief_id>", methods=["PUT"])
def update_brief(brief_id: int):
    """更新简报"""
    existing = repo.find_by_id(brief_id)
    if not existing:
        return jsonify({"error": "简报不存在"}), 404

    data = request.get_json() or {}
    today = date.today().isoformat()

    updated = Brief(
        title=data.get("title", existing.title),
        domain=data.get("domain", existing.domain),
        source=data.get("source", existing.source),
        data_json=data.get("dataJson", existing.data_json),
        brief_md=data.get("briefMd", existing.brief_md),
        date_created=existing.date_created,
        date_updated=today,
    )
    result = repo.update(brief_id, updated)
    return jsonify(result.to_dict() if result else {"error": "更新失败"}), 200


@router.route("/api/briefs/<int:brief_id>", methods=["DELETE"])
def delete_brief(brief_id: int):
    """删除简报"""
    ok = repo.delete(brief_id)
    return jsonify({"status": "ok" if ok else "not_found"}), 200 if ok else 404
