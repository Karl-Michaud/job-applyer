from models.job import ScrapedJob


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
    blacklisted_keywords: list[str] = prefs.get("blacklisted_keywords") or []
    pref_blacklisted_companies: list[str] = [c.lower() for c in (prefs.get("blacklisted_companies") or [])]

    all_blacklisted = blacklisted_companies | set(pref_blacklisted_companies)

    before = len(jobs)
    filtered = []

    for job in jobs:
        title_lower = job.title.lower()
        desc_lower = (job.description_text or "").lower()
        company_lower = job.company_name.lower()
        location_lower = (job.location or "").lower()

        # Blacklisted company
        if company_lower in all_blacklisted:
            continue

        # Blacklisted keywords in title or description
        if any(kw.lower() in title_lower or kw.lower() in desc_lower for kw in blacklisted_keywords):
            continue

        # Target roles: if set, title must match at least one
        if target_roles and not any(role.lower() in title_lower for role in target_roles):
            continue

        # Target locations: if set, location must match at least one OR job is remote
        if target_locations:
            is_remote = "remote" in location_lower or job.location_type == "remote"
            matches_location = any(loc.lower() in location_lower for loc in target_locations)
            if not is_remote and not matches_location:
                continue

        filtered.append(job)

    removed = before - len(filtered)
    if removed:
        print(f"[filter] Removed {removed} jobs ({before} → {len(filtered)})")
    else:
        print(f"[filter] All {before} jobs passed filters")

    return filtered
