import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from models.job import ScrapedJob

BASE_URL = "https://api.lever.co/v0/postings/{slug}?mode=json"

TERM_PATTERNS = [
    (re.compile(r"\bsummer\s+(20\d{2})\b", re.IGNORECASE), "summer"),
    (re.compile(r"\b(?:fall|autumn)\s+(20\d{2})\b", re.IGNORECASE), "fall"),
    (re.compile(r"\bwinter\s+(20\d{2})\b", re.IGNORECASE), "winter"),
    (re.compile(r"\bspring\s+(20\d{2})\b", re.IGNORECASE), "spring"),
]


def _extract_term(text: str) -> str | None:
    for pattern, season in TERM_PATTERNS:
        m = pattern.search(text)
        if m:
            return f"{season}-{m.group(1)}"
    return None


def _infer_job_type(title: str, commitment: str) -> str:
    c = commitment.lower() if commitment else ""
    if "intern" in c:
        return "internship"
    if "part" in c:
        return "part_time"
    if "contract" in c:
        return "contract"

    t = title.lower()
    if any(w in t for w in ["intern", "internship", "co-op", "coop", "co op"]):
        return "internship"
    if "part-time" in t or "part time" in t:
        return "part_time"
    if "contract" in t:
        return "contract"
    return "full_time"


def _infer_location_type(location: str) -> str | None:
    if not location:
        return None
    loc = location.lower()
    if "remote" in loc:
        return "remote"
    if "hybrid" in loc:
        return "hybrid"
    return "onsite"


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n", strip=True)


def _build_description_html(raw: dict) -> str:
    parts = []
    if raw.get("description"):
        parts.append(raw["description"])
    if raw.get("additional"):
        parts.append(raw["additional"])
    for list_item in raw.get("lists", []):
        label = list_item.get("text", "")
        content = list_item.get("content", "")
        if label:
            parts.append(f"<h3>{label}</h3>{content}")
        elif content:
            parts.append(content)
    return "\n".join(parts)


def _parse_job(raw: dict, company_name: str) -> ScrapedJob:
    title = (raw.get("text") or "").strip()
    categories = raw.get("categories") or {}
    location = (categories.get("location") or "").strip()
    commitment = categories.get("commitment") or ""

    description_html = _build_description_html(raw)
    description_text = _html_to_text(description_html) if description_html else None

    term = _extract_term(title) or (
        _extract_term(description_text) if description_text else None
    )

    # Lever timestamps are in milliseconds
    created_ms = raw.get("createdAt")
    posted_at = (
        datetime.fromtimestamp(created_ms / 1000, tz=timezone.utc).isoformat()
        if created_ms
        else None
    )

    return ScrapedJob(
        source_url=raw["hostedUrl"],
        title=title,
        company_name=company_name,
        external_id=raw["id"],
        location=location or None,
        location_type=_infer_location_type(location),
        job_type=_infer_job_type(title, commitment),
        term=term,
        description=description_html or None,
        description_text=description_text,
        posted_at=posted_at,
    )


def _fetch_target(slug: str, display_name: str) -> tuple[str, list[ScrapedJob]]:
    url = BASE_URL.format(slug=slug)
    try:
        resp = httpx.get(url, timeout=15)
        resp.raise_for_status()
        jobs = [_parse_job(j, display_name) for j in resp.json()]
        return slug, jobs
    except Exception as e:
        print(f"  [lever] ERROR fetching {slug}: {e}")
        return slug, []


def scrape(targets: list[dict]) -> list[ScrapedJob]:
    """
    targets: list of {"slug": str, "display_name": str, "enabled": bool}
    Returns flat list of all scraped jobs.
    """
    all_jobs: list[ScrapedJob] = []
    enabled = [t for t in targets if t.get("enabled", True)]

    print(f"[lever] Fetching {len(enabled)} targets in parallel...")

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {
            pool.submit(_fetch_target, t["slug"], t["display_name"]): t["slug"]
            for t in enabled
        }
        for future in as_completed(futures):
            slug, jobs = future.result()
            print(f"  [lever] {slug}: {len(jobs)} jobs")
            all_jobs.extend(jobs)

    print(f"[lever] Total scraped: {len(all_jobs)} jobs")
    return all_jobs
