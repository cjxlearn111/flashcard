from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class Card:
    id: Optional[int] = None
    domain: str = ""
    topic: str = ""
    question: str = ""
    answer: str = ""
    source: str = "AI粘贴"
    date_created: str = field(default_factory=lambda: date.today().isoformat())
    tag: str = ""
    next_review: str = field(default_factory=lambda: date.today().isoformat())
    level: int = 0

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "domain": self.domain,
            "topic": self.topic,
            "question": self.question,
            "answer": self.answer,
            "source": self.source,
            "dateCreated": self.date_created,
            "tag": self.tag,
            "nextReview": self.next_review,
            "level": self.level,
        }
