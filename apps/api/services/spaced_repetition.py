from datetime import datetime, timedelta

# SM-0 简化算法：根据评分返回下次复习日期
GAP_MAP: dict[str, int] = {
    "remember": 3,
    "blurry": 1,
    "forgot": 0,
}


def calculate_next_review(rating: str) -> str:
    """根据评分计算下次复习日期 (YYYY-MM-DD)"""
    days = GAP_MAP.get(rating, 1)
    if days > 0:
        return (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
    return datetime.now().strftime("%Y-%m-%d")
