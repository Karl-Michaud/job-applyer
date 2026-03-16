from dataclasses import dataclass, field


@dataclass
class ScrapedJob:
    source_url: str
    title: str
    company_name: str
    external_id: str | None = None
    location: str | None = None
    location_type: str | None = None   # remote | hybrid | onsite
    job_type: str | None = None        # internship | full_time | part_time | contract
    term: str | None = None            # summer-2026 | fall-2026 | winter-2026 | spring-2026
    description: str | None = None     # raw HTML
    description_text: str | None = None  # plain text
    tags: list[str] = field(default_factory=list)
    posted_at: str | None = None       # ISO string
