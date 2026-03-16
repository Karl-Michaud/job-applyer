import re
from concurrent.futures import ThreadPoolExecutor, as_completed

import httpx
from bs4 import BeautifulSoup

from models.job import ScrapedJob

BASE_URL = "https://api.ashbyhq.com/posting-api/job-board/{slug}"

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


def _infer_job_type(title: str, employment_type: str) -> str:
    e = (employment_type or "").lower()
    if "intern" in e:
        return "internship"
    if "part" in e:
        return "part_time"
    if "contract" in e:
        return "contract"

    t = title.lower()
    if any(w in t for w in ["intern", "internship", "co-op", "coop", "co op"]):
        return "internship"
    if "part-time" in t or "part time" in t:
        return "part_time"
    if "contract" in t:
        return "contract"
    return "full_time"


def _map_location_type(workplace_type: str, is_remote: bool) -> str | None:
    if is_remote:
        return "remote"
    wt = (workplace_type or "").lower()
    if wt == "remote":
        return "remote"
    if wt == "hybrid":
        return "hybrid"
    if wt in ("onsite", "on-site", "on_site"):
        return "onsite"
    return None


def _html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    return soup.get_text(separator="\n", strip=True)


def _parse_job(raw: dict, company_name: str) -> ScrapedJob:
    title = (raw.get("title") or "").strip()
    location = (raw.get("location") or "").strip()
    employment_type = raw.get("employmentType") or ""
    workplace_type = raw.get("workplaceType") or ""
    is_remote = bool(raw.get("isRemote"))

    description_html = raw.get("descriptionHtml") or ""
    # Ashby provides descriptionPlain directly — prefer it over parsing HTML
    description_text = raw.get("descriptionPlain") or (
        _html_to_text(description_html) if description_html else None
    )

    term = _extract_term(title) or (
        _extract_term(description_text) if description_text else None
    )

    return ScrapedJob(
        source_url=raw["jobUrl"],
        title=title,
        company_name=company_name,
        external_id=raw["id"],
        location=location or None,
        location_type=_map_location_type(workplace_type, is_remote),
        job_type=_infer_job_type(title, employment_type),
        term=term,
        description=description_html or None,
        description_text=description_text,
        posted_at=raw.get("publishedAt"),
    )


def _fetch_target(slug: str, display_name: str) -> tuple[str, list[ScrapedJob]]:
    url = BASE_URL.format(slug=slug)
    try:
        resp = httpx.get(url, timeout=15)
        resp.raise_for_status()
        jobs = [_parse_job(j, display_name) for j in resp.json().get("jobs", [])]
        return slug, jobs
    except Exception as e:
        print(f"  [ashby] ERROR fetching {slug}: {e}")
        return slug, []


def scrape(targets: list[dict]) -> list[ScrapedJob]:
    """
    targets: list of {"slug": str, "display_name": str, "enabled": bool}
    Returns flat list of all scraped jobs.
    """
    all_jobs: list[ScrapedJob] = []
    enabled = [t for t in targets if t.get("enabled", True)]

    print(f"[ashby] Fetching {len(enabled)} targets in parallel...")

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {
            pool.submit(_fetch_target, t["slug"], t["display_name"]): t["slug"]
            for t in enabled
        }
        for future in as_completed(futures):
            slug, jobs = future.result()
            print(f"  [ashby] {slug}: {len(jobs)} jobs")
            all_jobs.extend(jobs)

    print(f"[ashby] Total scraped: {len(all_jobs)} jobs")
    return all_jobs
