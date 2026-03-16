import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

import httpx
from bs4 import BeautifulSoup

from models.job import ScrapedJob

RAW_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"

# Emoji flags that appear in role titles — strip before storing
_ROLE_EMOJI = re.compile(r"[🛂🇺🇸🔒🔥🎓✅]")
_CLOSED = "🔒"

# Params added by Simplify — strip so URLs are canonical
_UTM_STRIP = {"utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"}


def _strip_utm(url: str) -> str:
    parsed = urlparse(url)
    qs = {k: v for k, v in parse_qs(parsed.query, keep_blank_values=True).items() if k not in _UTM_STRIP}
    clean = parsed._replace(query=urlencode({k: v[0] for k, v in qs.items()}))
    return urlunparse(clean)


def _infer_location_type(location: str) -> str | None:
    loc = location.lower()
    if "remote" in loc:
        return "remote"
    if "hybrid" in loc:
        return "hybrid"
    return "onsite"


def _parse_company(cell: str) -> str:
    """Extract plain company name from markdown/HTML cell."""
    # Strip bold markers
    cell = cell.replace("**", "")
    # Extract inner text from any <a> tags
    soup = BeautifulSoup(cell, "html.parser")
    return soup.get_text(strip=True)


def _parse_role(cell: str) -> str | None:
    """Return cleaned role title, or None if the position is closed."""
    if _CLOSED in cell:
        return None
    title = _ROLE_EMOJI.sub("", cell).strip()
    # Clean up extra whitespace left by emoji removal
    return re.sub(r"\s{2,}", " ", title).strip()


def _parse_location(cell: str) -> str:
    """Extract location string, joining multiple locations with ' / '."""
    soup = BeautifulSoup(cell, "html.parser")

    # <details><summary>N locations</summary>loc1<br>loc2</details>
    details = soup.find("details")
    if details:
        # Remove the <summary> tag and collect remaining text
        summary = details.find("summary")
        if summary:
            summary.decompose()
        locs = [t.strip() for t in details.get_text(separator="\n").splitlines() if t.strip()]
        return " / ".join(locs) if locs else ""

    # Plain text, possibly with <br> separators
    text = soup.get_text(separator="\n")
    locs = [t.strip() for t in text.splitlines() if t.strip()]
    return " / ".join(locs) if locs else ""


def _parse_apply_url(cell: str) -> str | None:
    """Extract the first apply href from the Application column."""
    soup = BeautifulSoup(cell, "html.parser")
    a = soup.find("a", href=True)
    if not a:
        return None
    href = a["href"]
    # Skip Simplify profile links — they're not direct apply URLs
    if "simplify.jobs" in href:
        # Try the next <a>
        for tag in soup.find_all("a", href=True):
            if "simplify.jobs" not in tag["href"]:
                href = tag["href"]
                break
        else:
            return href  # fall back to simplify URL if nothing else
    return _strip_utm(href)


def _parse_age(cell: str) -> datetime | None:
    """Convert relative age like '2d' to an absolute UTC datetime."""
    m = re.match(r"(\d+)d", cell.strip())
    if not m:
        return None
    days = int(m.group(1))
    return datetime.now(tz=timezone.utc) - timedelta(days=days)


def _parse_table(md: str) -> list[ScrapedJob]:
    jobs: list[ScrapedJob] = []
    current_company = ""

    in_table = False
    for line in md.splitlines():
        stripped = line.strip()

        # Detect table start
        if stripped.startswith("| Company") and "Role" in stripped:
            in_table = True
            continue
        if in_table and stripped.startswith("|---"):
            continue
        # Blank line or non-table line ends the table
        if in_table and not stripped.startswith("|"):
            in_table = False
            continue
        if not in_table:
            continue

        # Split columns (strip leading/trailing pipes)
        cols = [c.strip() for c in stripped.strip("|").split("|")]
        if len(cols) < 4:
            continue

        company_cell, role_cell, location_cell, app_cell = cols[0], cols[1], cols[2], cols[3]
        age_cell = cols[4] if len(cols) > 4 else ""

        # Resolve company name
        if company_cell.strip() in ("↳", ""):
            company_name = current_company
        else:
            company_name = _parse_company(company_cell)
            current_company = company_name

        if not company_name:
            continue

        role = _parse_role(role_cell)
        if role is None:  # closed
            continue

        apply_url = _parse_apply_url(app_cell)
        if not apply_url:
            continue

        location = _parse_location(location_cell)
        location_type = _infer_location_type(location) if location else None
        posted_at_dt = _parse_age(age_cell)
        posted_at = posted_at_dt.isoformat() if posted_at_dt else None

        jobs.append(ScrapedJob(
            source_url=apply_url,
            title=role,
            company_name=company_name,
            external_id=apply_url,  # URL is unique enough
            location=location or None,
            location_type=location_type,
            job_type="internship",
            term=None,  # repo is already Summer 2026 specific
            description=None,
            description_text=None,
            posted_at=posted_at,
        ))

    return jobs


def scrape() -> list[ScrapedJob]:
    """Fetch and parse the Simplify Summer 2026 internships README."""
    print("[simplify] Fetching README...")
    try:
        resp = httpx.get(RAW_URL, timeout=15, follow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"[simplify] ERROR fetching README: {e}")
        return []

    jobs = _parse_table(resp.text)
    print(f"[simplify] Total scraped: {len(jobs)} jobs")
    return jobs
