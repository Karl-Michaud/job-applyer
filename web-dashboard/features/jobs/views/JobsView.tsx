"use client";

import { useJobsViewModel } from "@/features/jobs/viewmodels/useJobsViewModel";
import { JobsTable } from "./components/JobsTable";
import { JobsStats } from "./components/JobsStats";

export function JobsView() {
  const { jobs, loading, error, handleAction } = useJobsViewModel();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New Jobs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {loading ? "Loading..." : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} from the scraper`}
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed opacity-60"
          title="Scraper not connected yet"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round"/>
            <path d="M10.5 2.5h3v3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Reload scraper
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <JobsStats />

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-500 text-sm">
          Loading jobs...
        </div>
      ) : (
        <JobsTable jobs={jobs} onAction={handleAction} />
      )}
    </div>
  );
}
