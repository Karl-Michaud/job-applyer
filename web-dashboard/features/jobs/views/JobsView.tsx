"use client";

import { useRef, useState } from "react";
import { useJobsViewModel, ALL_SCRAPERS, ScraperConfig } from "@/features/jobs/viewmodels/useJobsViewModel";
import { JobsTable } from "./components/JobsTable";
import { JobsStats } from "./components/JobsStats";
import { JobAction } from "@/features/jobs/models/types";

const BATCH_ACTIONS: { label: string; value: JobAction }[] = [
  { label: "Interested", value: "saved" },
  { label: "Already Applied", value: "applied" },
  { label: "Not Interested", value: "disliked" },
  { label: "Archive", value: "archived" },
];

const SCRAPER_LABELS: Record<string, string> = {
  greenhouse: "Greenhouse",
  lever: "Lever",
  ashby: "Ashby",
  simplify: "Simplify",
};

export function JobsView() {
  const { jobs, loading, error, scraping, scraperError, rowSelection, setRowSelection, selectedCount, handleAction, batchAction, runScraper } = useJobsViewModel();

  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<ScraperConfig>({
    scrapers: [...ALL_SCRAPERS],
    applyFilters: true,
    remotePreference: "any",
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  function toggleScraper(name: string) {
    setConfig((prev) => ({
      ...prev,
      scrapers: prev.scrapers.includes(name)
        ? prev.scrapers.filter((s) => s !== name)
        : [...prev.scrapers, name],
    }));
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New Jobs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {loading ? "Loading..." : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} from the scraper`}
          </p>
        </div>
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Move {selectedCount} selected to:
            </span>
            {BATCH_ACTIONS.map((a) => (
              <button
                key={a.value}
                onClick={() => batchAction(a.value)}
                className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="relative flex items-center gap-1" ref={dropdownRef}>
            <button
              onClick={() => runScraper(config)}
              disabled={scraping}
              className="flex items-center gap-2 rounded-l-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-4 h-4 ${scraping ? "animate-spin" : ""}`}
                viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
              >
                <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" strokeLinecap="round"/>
                <path d="M10.5 2.5h3v3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {scraping ? "Running..." : "Reload scraper"}
            </button>
            <button
              onClick={() => setConfigOpen((o) => !o)}
              disabled={scraping}
              className="rounded-r-md border border-l-0 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Scraper config"
            >
              ···
            </button>

            {configOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg p-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Scrapers</p>
                  {ALL_SCRAPERS.map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.scrapers.includes(s)}
                        onChange={() => toggleScraper(s)}
                        className="rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">{SCRAPER_LABELS[s]}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.applyFilters}
                      onChange={(e) => setConfig((prev) => ({ ...prev, applyFilters: e.target.checked }))}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Apply filters</span>
                  </label>
                  {config.applyFilters && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">Remote</p>
                      <div className="flex gap-1 p-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                        {(["any", "remote_only", "no_remote"] as const).map((opt) => {
                          const labels = { any: "Any", remote_only: "Only", no_remote: "None" };
                          return (
                            <button
                              key={opt}
                              onClick={() => setConfig((prev) => ({ ...prev, remotePreference: opt }))}
                              className={`flex-1 text-xs px-2 py-0.5 rounded transition-colors ${
                                config.remotePreference === opt
                                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                              }`}
                            >
                              {labels[opt]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {scraperError && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Scraper error: {scraperError}
        </div>
      )}

      <JobsStats />

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-500 text-sm">
          Loading jobs...
        </div>
      ) : (
        <JobsTable
          jobs={jobs}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
