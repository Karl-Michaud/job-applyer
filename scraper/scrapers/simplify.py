import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

import httpx
from bs4 import BeautifulSoup

from models.job import ScrapedJob

RAW_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"

_ROLE_EMOJI = re.compile(r"[🛂🇺🇸🔒🔥🎓✅]")
_CLOSED = "🔒"

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


def _cell_text(td) -> str:
    return td.get_text(separator="\n", strip=True)


def _parse_company(td) -> str:
    return _cell_text(td)


def _parse_role(td) -> str | None:
    raw = td.decode_contents()
    if _CLOSED in raw:
        return None
    title = _ROLE_EMOJI.sub("", _cell_text(td)).strip()
    return re.sub(r"\s{2,}", " ", title).strip() or None


def _parse_location(td) -> str:
    # <details><summary>N locations</summary>loc1<br/>loc2</details>
    details = td.find("details")
    if details:
        summary = details.find("summary")
        if summary:
            summary.decompose()
        locs = [t.strip() for t in details.get_text(separator="\n").splitlines() if t.strip()]
        return " / ".join(locs)
    locs = [t.strip() for t in _cell_text(td).splitlines() if t.strip()]
    return " / ".join(locs)


def _parse_apply_url(td) -> str | None:
    for a in td.find_all("a", href=True):
        href = a["href"]
        if "simplify.jobs" not in href:
            return _strip_utm(href)
    # Fall back to simplify link if nothing else
    a = td.find("a", href=True)
    return _strip_utm(a["href"]) if a else None


def _parse_age(td) -> datetime | None:
    text = _cell_text(td).strip()

    # "7d" — relative days
    m = re.match(r"^(\d+)d$", text)
    if m:
        return datetime.now(tz=timezone.utc) - timedelta(days=int(m.group(1)))

    # "Oct 31", "Nov 1" — month-day without year; assume current or previous year
    m = re.match(r"^([A-Za-z]{3})\s+(\d{1,2})$", text)
    if m:
        current_year = datetime.now(tz=timezone.utc).year
        try:
            dt = datetime.strptime(f"{m.group(1)} {m.group(2)} {current_year}", "%b %d %Y")
            dt = dt.replace(tzinfo=timezone.utc)
            if dt > datetime.now(tz=timezone.utc):
                dt = dt.replace(year=current_year - 1)
            return dt
        except ValueError:
            pass

    # "2025-10-31" — ISO date
    m = re.match(r"^(\d{4}-\d{2}-\d{2})$", text)
    if m:
        try:
            return datetime.fromisoformat(m.group(1)).replace(tzinfo=timezone.utc)
        except ValueError:
            pass

    return None


def _parse_table(html: str) -> list[ScrapedJob]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        print("[simplify] ERROR: No <table> found in README")
        return []

    jobs: list[ScrapedJob] = []
    current_company = ""

    for tr in table.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) < 4:
            continue  # header row or malformed

        company_td, role_td, location_td, app_td = tds[0], tds[1], tds[2], tds[3]
        age_td = tds[4] if len(tds) > 4 else None

        company_text = _parse_company(company_td)
        if company_text == "↳" or company_text == "":
            company_name = current_company
        else:
            company_name = company_text
            current_company = company_name

        if not company_name:
            continue

        role = _parse_role(role_td)
        if role is None:
            continue

        apply_url = _parse_apply_url(app_td)
        if not apply_url:
            continue

        location = _parse_location(location_td)
        location_type = _infer_location_type(location) if location else None
        posted_at_dt = _parse_age(age_td) if age_td else None
        posted_at = posted_at_dt.isoformat() if posted_at_dt else None

        jobs.append(ScrapedJob(
            source_url=apply_url,
            title=role,
            company_name=company_name,
            external_id=apply_url,
            location=location or None,
            location_type=location_type,
            job_type="internship",
            term=None,
            description=None,
            description_text=None,
            posted_at=posted_at,
        ))

    return jobs


def scrape() -> list[ScrapedJob]:
    print("[simplify] Fetching README...")
    try:
        resp = httpx.get(RAW_URL, timeout=15, follow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"[simplify] ERROR fetching README: {e}")
        return []

    print(f"[simplify] Fetched {len(resp.text.splitlines())} lines")
    jobs = _parse_table(resp.text)
    print(f"[simplify] Total scraped: {len(jobs)} jobs")
    return jobs
