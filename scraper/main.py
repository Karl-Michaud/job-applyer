import os
from dotenv import load_dotenv
from supabase import create_client

from scrapers.greenhouse import scrape as scrape_greenhouse
from scrapers.lever import scrape as scrape_lever
from scrapers.ashby import scrape as scrape_ashby
from scrapers.simplify import scrape as scrape_simplify
from db.writer import ensure_companies, upsert_jobs
from filter import load_preferences, load_blacklisted_companies, apply as filter_jobs

load_dotenv()


def _run(supabase, jobs):
    jobs = filter_jobs(jobs, prefs, blacklisted_companies)
    if jobs:
        company_names = {j.company_name for j in jobs}
        company_map = ensure_companies(supabase, company_names)
        result = upsert_jobs(supabase, jobs, company_map)
        print(f"[db] Upserted {result['total']} jobs in {result['batches']} batches")
    else:
        print("[db] No jobs to upsert after filtering")


def main():
    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_KEY"],
    )

    global prefs, blacklisted_companies
    prefs = load_preferences(supabase)
    blacklisted_companies = load_blacklisted_companies(supabase)

    # --- Greenhouse ---
    print("\n=== Greenhouse ===")
    targets = supabase.table("greenhouse_targets").select("slug, display_name, enabled").execute().data or []
    if not targets:
        print("No greenhouse targets configured. Add some in Settings.")
    else:
        _run(supabase, scrape_greenhouse(targets))

    # --- Lever ---
    print("\n=== Lever ===")
    targets = supabase.table("lever_targets").select("slug, display_name, enabled").execute().data or []
    if not targets:
        print("No lever targets configured. Add some in Settings.")
    else:
        _run(supabase, scrape_lever(targets))

    # --- Ashby ---
    print("\n=== Ashby ===")
    targets = supabase.table("ashby_targets").select("slug, display_name, enabled").execute().data or []
    if not targets:
        print("No ashby targets configured. Add some in Settings.")
    else:
        _run(supabase, scrape_ashby(targets))

    # --- Simplify ---
    print("\n=== Simplify ===")
    _run(supabase, scrape_simplify())

    print("\nDone.")


if __name__ == "__main__":
    main()
