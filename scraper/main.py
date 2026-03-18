import os
import argparse
from dotenv import load_dotenv
from supabase import create_client

from scrapers.greenhouse import scrape as scrape_greenhouse
from scrapers.lever import scrape as scrape_lever
from scrapers.ashby import scrape as scrape_ashby
from scrapers.simplify import scrape as scrape_simplify
from db.writer import ensure_companies, upsert_jobs
from filter import load_preferences, load_blacklisted_companies, apply as filter_jobs

load_dotenv()

ALL_SCRAPERS = ["greenhouse", "lever", "ashby", "simplify"]


def _run(supabase, jobs, apply_filters):
    if apply_filters:
        jobs = filter_jobs(jobs, prefs, blacklisted_companies)
    if jobs:
        company_names = {j.company_name for j in jobs}
        company_map = ensure_companies(supabase, company_names)
        result = upsert_jobs(supabase, jobs, company_map)
        print(f"[db] Upserted {result['total']} jobs in {result['batches']} batches")
    else:
        print("[db] No jobs to upsert after filtering")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scrapers", nargs="*", default=ALL_SCRAPERS,
                        help="Which scrapers to run (default: all)")
    parser.add_argument("--no-filter", action="store_true",
                        help="Skip preference/keyword filtering and insert all scraped jobs")
    parser.add_argument("--remote-preference", choices=["any", "remote_only", "no_remote"], default=None,
                        help="Override remote_preference for this run")
    args = parser.parse_args()

    enabled = set(args.scrapers)
    apply_filters = not args.no_filter
    remote_preference_override = args.remote_preference

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_KEY"],
    )

    global prefs, blacklisted_companies
    prefs = load_preferences(supabase)
    blacklisted_companies = load_blacklisted_companies(supabase)

    if remote_preference_override:
        prefs["remote_preference"] = remote_preference_override

    if apply_filters:
        print("[filter] Filters ON")
    else:
        print("[filter] Filters OFF — inserting all scraped jobs")

    if "greenhouse" in enabled:
        print("\n=== Greenhouse ===")
        targets = supabase.table("greenhouse_targets").select("slug, display_name, enabled").execute().data or []
        if not targets:
            print("No greenhouse targets configured. Add some in Settings.")
        else:
            _run(supabase, scrape_greenhouse(targets), apply_filters)

    if "lever" in enabled:
        print("\n=== Lever ===")
        targets = supabase.table("lever_targets").select("slug, display_name, enabled").execute().data or []
        if not targets:
            print("No lever targets configured. Add some in Settings.")
        else:
            _run(supabase, scrape_lever(targets), apply_filters)

    if "ashby" in enabled:
        print("\n=== Ashby ===")
        targets = supabase.table("ashby_targets").select("slug, display_name, enabled").execute().data or []
        if not targets:
            print("No ashby targets configured. Add some in Settings.")
        else:
            _run(supabase, scrape_ashby(targets), apply_filters)

    if "simplify" in enabled:
        print("\n=== Simplify ===")
        _run(supabase, scrape_simplify(), apply_filters)

    print("\nDone.")


if __name__ == "__main__":
    main()
