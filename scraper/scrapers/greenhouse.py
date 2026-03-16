import re
import html as html_lib
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx
from bs4 import BeautifulSoup

from models.job import ScrapedJob

BASE_URL = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"

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


def _infer_job_type(title: str) -> str:
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


def _parse_job(raw: dict, company_name: str) -> ScrapedJob:
    title = raw.get("title", "").strip()
    location = raw.get("location", {}).get("name", "") or ""
    description_html = raw.get("content") or ""
    description_text = _html_to_text(description_html) if description_html else None

    # Term: check title first, fall back to description text
    term = _extract_term(title) or (
        _extract_term(description_text) if description_text else None
    )

    return ScrapedJob(
        source_url=raw["absolute_url"],
        title=title,
        company_name=company_name,
        external_id=str(raw["id"]),
        location=location or None,
        location_type=_infer_location_type(location),
        job_type=_infer_job_type(title),
        term=term,
        description=description_html or None,
        description_text=description_text,
        posted_at=raw.get("updated_at"),
    )


def _fetch_target(slug: str, display_name: str) -> tuple[str, list[ScrapedJob]]:
    url = BASE_URL.format(slug=slug)
    try:
        resp = httpx.get(url, timeout=15)
        resp.raise_for_status()
        jobs = [_parse_job(j, display_name) for j in resp.json().get("jobs", [])]
        return slug, jobs
    except Exception as e:
        print(f"  [greenhouse] ERROR fetching {slug}: {e}")
        return slug, []


def scrape(targets: list[dict]) -> list[ScrapedJob]:
    """
    targets: list of {"slug": str, "display_name": str}
    Returns flat list of all scraped jobs.
    """
    all_jobs: list[ScrapedJob] = []
    enabled = [t for t in targets if t.get("enabled", True)]

    print(f"[greenhouse] Fetching {len(enabled)} targets in parallel...")

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {
            pool.submit(_fetch_target, t["slug"], t["display_name"]): t["slug"]
            for t in enabled
        }
        for future in as_completed(futures):
            slug, jobs = future.result()
            print(f"  [greenhouse] {slug}: {len(jobs)} jobs")
            all_jobs.extend(jobs)

    print(f"[greenhouse] Total scraped: {len(all_jobs)} jobs")
    return all_jobs
