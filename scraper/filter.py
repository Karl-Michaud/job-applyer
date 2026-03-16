import re
from datetime import datetime, timedelta, timezone

from models.job import ScrapedJob

# Words to strip from user-supplied role strings before keyword matching.
# These carry no signal when matching against a role like "Software Engineer Intern".
_INTERN_WORDS = {"intern", "internship", "co-op", "coop", "co", "op", "interns"}
_STOP_WORDS = {"and", "or", "the", "a", "an", "of", "for", "in", "at", "to", "with", "on"}

# Ordered longest-first so we strip the most specific suffix first.
_SUFFIXES = ["ment", "ation", "tion", "ing", "ion", "ists", "ist", "ers", "er", "or", "ed", "s"]


def _stem(word: str) -> str:
    """Strip common English suffixes to get a rough root form.

    Examples: developer → develop, development → develop, scientist → scient
    """
    for suffix in _SUFFIXES:
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]
    return word


def _role_stems(role: str) -> list[str]:
    """Return stemmed keywords from a role string, ignoring intern/stop words."""
    words = re.split(r"[\s\-/,]+", role.lower())
    meaningful = [w for w in words if w and w not in _INTERN_WORDS and w not in _STOP_WORDS and len(w) >= 3]
    return [_stem(w) for w in meaningful]


def _title_stems(title: str) -> set[str]:
    words = re.split(r"[\s\-/,()]+", title.lower())
    return {_stem(w) for w in words if w}


def _title_matches_role(title_lower: str, role: str) -> bool:
    """True if any stemmed keyword from the role appears in the stemmed title words."""
    keywords = _role_stems(role)
    if not keywords:
        return True
    stems = _title_stems(title_lower)
    return any(kw in stems for kw in keywords)


def load_preferences(supabase) -> dict:
    res = supabase.table("preferences").select("key, value").execute()
    prefs: dict = {}
    for row in res.data or []:
        prefs[row["key"]] = row["value"]
    return prefs


def load_blacklisted_companies(supabase) -> set[str]:
    res = supabase.table("companies").select("name").eq("blacklisted", True).execute()
    return {r["name"].lower() for r in res.data or []}


def apply(jobs: list[ScrapedJob], prefs: dict, blacklisted_companies: set[str]) -> list[ScrapedJob]:
    target_roles: list[str] = prefs.get("target_roles") or []
    target_locations: list[str] = prefs.get("target_locations") or []
    job_type_keywords: list[str] = prefs.get("job_type_keywords") or []
    must_have_keywords: list[str] = prefs.get("must_have_keywords") or []
    blacklisted_keywords: list[str] = prefs.get("blacklisted_keywords") or []
    pref_blacklisted_companies: list[str] = [c.lower() for c in (prefs.get("blacklisted_companies") or [])]
    max_age_weeks: int = int(prefs.get("max_age_weeks") or 0)

    all_blacklisted = blacklisted_companies | set(pref_blacklisted_companies)
    cutoff = (
        datetime.now(tz=timezone.utc) - timedelta(weeks=max_age_weeks)
        if max_age_weeks > 0 else None
    )

    before = len(jobs)
    filtered = []
    dropped = {"blacklisted_company": 0, "too_old": 0, "job_type": 0, "must_have": 0, "blacklisted_kw": 0, "target_roles": 0, "location": 0}

    for job in jobs:
        title_lower = job.title.lower()
        desc_lower = (job.description_text or "").lower()
        company_lower = job.company_name.lower()
        location_lower = (job.location or "").lower()

        if company_lower in all_blacklisted:
            dropped["blacklisted_company"] += 1; continue

        if cutoff and job.posted_at:
            try:
                posted = datetime.fromisoformat(job.posted_at)
                if posted < cutoff:
                    dropped["too_old"] += 1; continue
            except ValueError:
                pass

        if job_type_keywords and job.job_type != "internship" and not any(
            re.search(r"\b" + re.escape(kw.lower()) + r"\b", title_lower)
            for kw in job_type_keywords
        ):
            dropped["job_type"] += 1; continue

        if must_have_keywords and not any(kw.lower() in title_lower for kw in must_have_keywords):
            dropped["must_have"] += 1; continue

        if any(kw.lower() in title_lower or kw.lower() in desc_lower for kw in blacklisted_keywords):
            dropped["blacklisted_kw"] += 1; continue

        if target_roles and not any(_title_matches_role(title_lower, role) for role in target_roles):
            dropped["target_roles"] += 1; continue

        if target_locations:
            is_remote = "remote" in location_lower or (job.location_type or "").lower() == "remote"
            matches_location = any(loc.lower() in location_lower for loc in target_locations)
            if not is_remote and not matches_location:
                dropped["location"] += 1; continue

        filtered.append(job)

    active = {k: v for k, v in dropped.items() if v}
    if active:
        breakdown = ", ".join(f"{k}: -{v}" for k, v in active.items())
        print(f"[filter] {before} → {len(filtered)} jobs  ({breakdown})")
    else:
        print(f"[filter] All {before} jobs passed")

    return filtered
