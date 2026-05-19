from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class Brief:
    id: Optional[int] = None
    title: str = ""
    domain: str = ""
    source: str = ""
    data_json: str = "{}"
    brief_md: str = ""
    date_created: str = field(default_factory=lambda: date.today().isoformat())
    date_updated: str = field(default_factory=lambda: date.today().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "domain": self.domain,
            "source": self.source,
            "dataJson": self.data_json,
            "briefMd": self.brief_md,
            "dateCreated": self.date_created,
            "dateUpdated": self.date_updated,
        }
