import json
import sqlite3
from typing import Optional

from config import DB_PATH
from models.card import Card
from models.brief import Brief
from models.knowledge_card import KnowledgeCard


class CardRepository:
    """卡片数据库操作层（类似 Prisma Service 模式）"""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    # ── private ──

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT DEFAULT '',
                topic TEXT DEFAULT '',
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                source TEXT DEFAULT '',
                date_created TEXT NOT NULL,
                tag TEXT DEFAULT '',
                next_review TEXT NOT NULL,
                level INTEGER DEFAULT 0
            )
        """)
        conn.commit()
        conn.close()

    @staticmethod
    def _row_to_card(row: sqlite3.Row) -> Card:
        return Card(**dict(row))

    # ── public API ──

    def find_all(self) -> list[Card]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM cards ORDER BY date_created DESC, id DESC"
        ).fetchall()
        conn.close()
        return [self._row_to_card(r) for r in rows]

    def find_due_reviews(self, today: str) -> list[Card]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM cards WHERE next_review <= ? ORDER BY level ASC",
            (today,),
        ).fetchall()
        conn.close()
        return [self._row_to_card(r) for r in rows]

    def create_many(self, cards: list[Card]) -> int:
        conn = self._get_conn()
        for card in cards:
            conn.execute(
                """INSERT INTO cards (domain, topic, question, answer, source, date_created, next_review, level)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    card.domain,
                    card.topic,
                    card.question,
                    card.answer,
                    card.source,
                    card.date_created,
                    card.next_review,
                    card.level,
                ),
            )
        conn.commit()
        conn.close()
        return len(cards)

    def update_review(self, card_id: int, next_review: str) -> None:
        conn = self._get_conn()
        conn.execute(
            "UPDATE cards SET next_review = ?, level = level + 1 WHERE id = ?",
            (next_review, card_id),
        )
        conn.commit()
        conn.close()


class BriefRepository:
    """简报数据库操作"""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS briefs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT DEFAULT '',
                domain TEXT DEFAULT '',
                source TEXT DEFAULT '',
                data_json TEXT NOT NULL,
                brief_md TEXT DEFAULT '',
                date_created TEXT NOT NULL,
                date_updated TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    @staticmethod
    def _row_to_brief(row: sqlite3.Row) -> Brief:
        return Brief(**dict(row))

    def find_all(self) -> list[Brief]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM briefs ORDER BY date_created DESC, id DESC"
        ).fetchall()
        conn.close()
        return [self._row_to_brief(r) for r in rows]

    def find_by_id(self, brief_id: int) -> Optional[Brief]:
        conn = self._get_conn()
        row = conn.execute(
            "SELECT * FROM briefs WHERE id = ?", (brief_id,)
        ).fetchone()
        conn.close()
        return self._row_to_brief(row) if row else None

    def create(self, brief: Brief) -> Brief:
        conn = self._get_conn()
        cur = conn.execute(
            """INSERT INTO briefs (title, domain, source, data_json, brief_md, date_created, date_updated)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                brief.title,
                brief.domain,
                brief.source,
                brief.data_json,
                brief.brief_md,
                brief.date_created,
                brief.date_updated,
            ),
        )
        conn.commit()
        brief.id = cur.lastrowid
        conn.close()
        return brief

    def update(self, brief_id: int, brief: Brief) -> Optional[Brief]:
        conn = self._get_conn()
        conn.execute(
            """UPDATE briefs SET title=?, domain=?, source=?, data_json=?, brief_md=?, date_updated=?
               WHERE id=?""",
            (
                brief.title,
                brief.domain,
                brief.source,
                brief.data_json,
                brief.brief_md,
                brief.date_updated,
                brief_id,
            ),
        )
        conn.commit()
        conn.close()
        return self.find_by_id(brief_id)

    def delete(self, brief_id: int) -> bool:
        conn = self._get_conn()
        cur = conn.execute("DELETE FROM briefs WHERE id = ?", (brief_id,))
        conn.commit()
        conn.close()
        return cur.rowcount > 0


class KnowledgeCardRepository:
    """知识卡片数据库操作"""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_cards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT DEFAULT '',
                tags TEXT DEFAULT '[]',
                source TEXT DEFAULT '',
                data_json TEXT NOT NULL,
                summary_md TEXT DEFAULT '',
                date_created TEXT NOT NULL,
                date_updated TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()

    @staticmethod
    def _row_to_card(row: sqlite3.Row) -> KnowledgeCard:
        return KnowledgeCard(**dict(row))

    def find_all(self) -> list[KnowledgeCard]:
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM knowledge_cards ORDER BY date_created DESC, id DESC"
        ).fetchall()
        conn.close()
        return [self._row_to_card(r) for r in rows]

    def find_by_id(self, card_id: int) -> Optional[KnowledgeCard]:
        conn = self._get_conn()
        row = conn.execute(
            "SELECT * FROM knowledge_cards WHERE id = ?", (card_id,)
        ).fetchone()
        conn.close()
        return self._row_to_card(row) if row else None

    def create(self, card: KnowledgeCard) -> KnowledgeCard:
        conn = self._get_conn()
        cur = conn.execute(
            """INSERT INTO knowledge_cards (title, tags, source, data_json, summary_md, date_created, date_updated)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                card.title,
                card.tags,
                card.source,
                card.data_json,
                card.summary_md,
                card.date_created,
                card.date_updated,
            ),
        )
        conn.commit()
        card.id = cur.lastrowid
        conn.close()
        return card

    def update(self, card_id: int, card: KnowledgeCard) -> Optional[KnowledgeCard]:
        conn = self._get_conn()
        conn.execute(
            """UPDATE knowledge_cards SET title=?, tags=?, source=?, data_json=?, summary_md=?, date_updated=?
               WHERE id=?""",
            (
                card.title,
                card.tags,
                card.source,
                card.data_json,
                card.summary_md,
                card.date_updated,
                card_id,
            ),
        )
        conn.commit()
        conn.close()
        return self.find_by_id(card_id)

    def delete(self, card_id: int) -> bool:
        conn = self._get_conn()
        cur = conn.execute("DELETE FROM knowledge_cards WHERE id = ?", (card_id,))
        conn.commit()
        conn.close()
        return cur.rowcount > 0


# ── 设置存储（键值对）──

def init_settings_table(db_path: str = DB_PATH) -> None:
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def _get_settings_conn(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def get_setting(key: str, default: str = "", db_path: str = DB_PATH) -> str:
    conn = _get_settings_conn(db_path)
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else default


def set_setting(key: str, value: str, db_path: str = DB_PATH) -> None:
    conn = sqlite3.connect(db_path)
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        (key, value),
    )
    conn.commit()
    conn.close()


def delete_setting(key: str, db_path: str = DB_PATH) -> bool:
    conn = sqlite3.connect(db_path)
    cur = conn.execute("DELETE FROM settings WHERE key = ?", (key,))
    conn.commit()
    conn.close()
    return cur.rowcount > 0


def get_all_settings(db_path: str = DB_PATH) -> dict[str, str]:
    conn = _get_settings_conn(db_path)
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    return {row["key"]: row["value"] for row in rows}
