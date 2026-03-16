from datetime import datetime, timezone

from models.job import ScrapedJob

BATCH_SIZE = 50

# Columns we update on conflict — never touch status, rank, notes, ats_score, tailored_resume
UPSERT_FIELDS = [
    "external_id", "title", "company_id",
    "location", "location_type", "job_type",
    "term", "description", "description_text",
    "posted_at", "scraped_at",
]


def ensure_companies(supabase, company_names: set[str]) -> dict[str, str]:
    """
    Returns a name -> id map for all given company names.
    Inserts any that don't exist yet.
    """
    names = list(company_names)

    existing_res = supabase.table("companies").select("id, name").in_("name", names).execute()
    company_map: dict[str, str] = {r["name"]: r["id"] for r in existing_res.data}

    missing = [n for n in names if n not in company_map]
    if missing:
        insert_res = supabase.table("companies").insert(
            [{"name": n} for n in missing]
        ).execute()
        for r in insert_res.data:
            company_map[r["name"]] = r["id"]

    return company_map


def upsert_jobs(supabase, jobs: list[ScrapedJob], company_map: dict[str, str]) -> dict:
    """
    Batch upserts jobs into the DB. Returns summary counts.
    Conflicts on source_url — updates metadata but never user fields.
    """
    now = datetime.now(timezone.utc).isoformat()
    records = []

    for job in jobs:
        company_id = company_map.get(job.company_name)
        if not company_id:
            print(f"  [writer] WARNING: no company_id for '{job.company_name}', skipping")
            continue

        records.append({
            "source_url": job.source_url,
            "external_id": job.external_id,
            "title": job.title,
            "company_id": company_id,
            "location": job.location,
            "location_type": job.location_type,
            "job_type": job.job_type,
            "term": job.term,
            "description": job.description,
            "description_text": job.description_text,
            "posted_at": job.posted_at,
            "scraped_at": now,
            # status defaults to 'new' on insert; not included so it's never overwritten
        })

    if not records:
        return {"total": 0, "batches": 0}

    batches = [records[i:i + BATCH_SIZE] for i in range(0, len(records), BATCH_SIZE)]

    for batch in batches:
        supabase.table("jobs").upsert(
            batch,
            on_conflict="source_url",
        ).execute()

    return {"total": len(records), "batches": len(batches)}
