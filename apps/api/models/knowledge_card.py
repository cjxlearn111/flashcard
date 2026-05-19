from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class KnowledgeCard:
    id: Optional[int] = None
    title: str = ""
    tags: str = "[]"
    source: str = ""
    data_json: str = "{}"
    summary_md: str = ""
    date_created: str = field(default_factory=lambda: date.today().isoformat())
    date_updated: str = field(default_factory=lambda: date.today().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "tags": self.tags,
            "source": self.source,
            "dataJson": self.data_json,
            "summaryMd": self.summary_md,
            "dateCreated": self.date_created,
            "dateUpdated": self.date_updated,
        }
