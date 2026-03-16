import os
from dotenv import load_dotenv
from supabase import create_client

from scrapers.greenhouse import scrape as scrape_greenhouse
from scrapers.lever import scrape as scrape_lever
from db.writer import ensure_companies, upsert_jobs
from filter import load_preferences, load_blacklisted_companies, apply as filter_jobs

load_dotenv()


def main():
    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_KEY"],
    )

    prefs = load_preferences(supabase)
    blacklisted_companies = load_blacklisted_companies(supabase)

    # --- Greenhouse ---
    print("\n=== Greenhouse ===")
    targets_res = supabase.table("greenhouse_targets").select("slug, display_name, enabled").execute()
    targets = targets_res.data or []

    if not targets:
        print("No greenhouse targets configured. Add some in Settings.")
    else:
        jobs = scrape_greenhouse(targets)

        if jobs:
            jobs = filter_jobs(jobs, prefs, blacklisted_companies)

        if jobs:
            company_names = {j.company_name for j in jobs}
            company_map = ensure_companies(supabase, company_names)
            result = upsert_jobs(supabase, jobs, company_map)
            print(f"[db] Upserted {result['total']} jobs in {result['batches']} batches")
        else:
            print("[db] No jobs to upsert after filtering")

    # --- Lever ---
    print("\n=== Lever ===")
    lever_targets_res = supabase.table("lever_targets").select("slug, display_name, enabled").execute()
    lever_targets = lever_targets_res.data or []

    if not lever_targets:
        print("No lever targets configured. Add some in Settings.")
    else:
        jobs = scrape_lever(lever_targets)

        if jobs:
            jobs = filter_jobs(jobs, prefs, blacklisted_companies)

        if jobs:
            company_names = {j.company_name for j in jobs}
            company_map = ensure_companies(supabase, company_names)
            result = upsert_jobs(supabase, jobs, company_map)
            print(f"[db] Upserted {result['total']} jobs in {result['batches']} batches")
        else:
            print("[db] No jobs to upsert after filtering")

    print("\nDone.")


if __name__ == "__main__":
    main()
