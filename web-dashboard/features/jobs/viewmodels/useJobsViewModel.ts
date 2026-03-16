"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import { createClient } from "@/shared/supabase/client";
import { Job, JobAction } from "@/features/jobs/models/types";

function chunks<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

interface UseJobsViewModel {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  scraping: boolean;
  scraperError: string | null;
  rowSelection: RowSelectionState;
  setRowSelection: (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
  selectedCount: number;
  handleAction: (jobId: string, action: JobAction) => Promise<void>;
  batchAction: (action: JobAction) => Promise<void>;
  runScraper: () => Promise<void>;
}

export function useJobsViewModel(): UseJobsViewModel {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const jobsRef = useRef<Job[]>([]);

  const supabase = createClient();

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id, title, source_url, location, location_type, job_type,
        term, duration, description, description_text,
        posted_at, closing_at, deadline_type,
        salary_min, salary_max, tags,
        status, rank, notes, scraped_at, updated_at,
        company:companies ( id, name, domain )
      `)
      .eq("status", "new")
      .order("scraped_at", { ascending: false });

    if (error) setError(error.message);
    else {
      const fetched = (data as unknown as Job[]) ?? [];
      jobsRef.current = fetched;
      setJobs(fetched);
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const removeFromList = useCallback((ids: string[]) => {
    const next = jobsRef.current.filter((j) => !ids.includes(j.id));
    jobsRef.current = next;
    setJobs(next);
  }, []);

  const handleAction = useCallback(
    async (jobId: string, action: JobAction) => {
      removeFromList([jobId]);

      if (action === "applied") {
        const { error: appErr } = await supabase
          .from("applications")
          .upsert({ job_id: jobId, stage: "applied" }, { onConflict: "job_id" });
        if (appErr) { setError(appErr.message); return; }

        const { error: jobErr } = await supabase
          .from("jobs")
          .update({ status: "applied" })
          .eq("id", jobId);
        if (jobErr) setError(jobErr.message);
      } else {
        const { error } = await supabase
          .from("jobs")
          .update({ status: action })
          .eq("id", jobId);
        if (error) setError(error.message);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeFromList]
  );

  const batchAction = useCallback(
    async (action: JobAction) => {
      const selectedIds = Object.keys(rowSelection);
      if (selectedIds.length === 0) return;

      const selected = jobsRef.current.filter((j) => selectedIds.includes(j.id));

      removeFromList(selectedIds);
      setRowSelection({});

      const idChunks = chunks(selectedIds, 500);

      if (action === "applied") {
        for (const chunk of chunks(selected, 500)) {
          const { error: appErr } = await supabase
            .from("applications")
            .upsert(
              chunk.map((j) => ({ job_id: j.id, stage: "applied" })),
              { onConflict: "job_id" }
            );
          if (appErr) { setError(appErr.message); return; }
        }
        for (const chunk of idChunks) {
          const { error: jobErr } = await supabase.from("jobs").update({ status: "applied" }).in("id", chunk);
          if (jobErr) { setError(jobErr.message); return; }
        }
      } else {
        for (const chunk of idChunks) {
          const { error: jobErr } = await supabase.from("jobs").update({ status: action }).in("id", chunk);
          if (jobErr) { setError(jobErr.message); return; }
        }
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, removeFromList]
  );

  const runScraper = useCallback(async () => {
    setScraping(true);
    setScraperError(null);
    try {
      const res = await fetch("/api/scraper/run", { method: "POST" });
      const json = await res.json();
      if (!json.ok) setScraperError(json.error ?? "Scraper failed");
      else await fetchJobs();
    } catch (e) {
      setScraperError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setScraping(false);
    }
  }, [fetchJobs]);

  const selectedCount = Object.keys(rowSelection).length;

  return { jobs, loading, error, scraping, scraperError, rowSelection, setRowSelection, selectedCount, handleAction, batchAction, runScraper };
}
