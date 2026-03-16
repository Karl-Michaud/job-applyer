"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";
import { Job, JobAction } from "@/features/jobs/models/types";
import { MOCK_JOBS } from "@/features/jobs/models/mockJobs";

interface UseJobsViewModel {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  handleAction: (jobId: string, action: JobAction) => Promise<void>;
}

export function useJobsViewModel(): UseJobsViewModel {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // TODO: delete MOCK_JOBS import and this block when API is live
    setJobs(MOCK_JOBS);
    setLoading(false);

    // --- real fetch (uncomment when API is ready) ---
    // async function fetchJobs() {
    //   setLoading(true);
    //   setError(null);
    //   const { data, error } = await supabase
    //     .from("jobs")
    //     .select(`
    //       id, title, source_url, location, location_type, job_type,
    //       term, duration, description, description_text,
    //       posted_at, closing_at, deadline_type,
    //       salary_min, salary_max, tags,
    //       status, rank, notes, scraped_at, updated_at,
    //       company:companies ( id, name, domain )
    //     `)
    //     .eq("status", "new")
    //     .order("scraped_at", { ascending: false });
    //   if (error) setError(error.message);
    //   else setJobs((data as unknown as Job[]) ?? []);
    //   setLoading(false);
    // }
    // fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = useCallback(
    async (jobId: string, action: JobAction) => {
      // Optimistically remove from the new feed regardless of action
      setJobs((prev) => prev.filter((j) => j.id !== jobId));

      // TODO: remove mock behaviour and uncomment real calls when API is ready
      void supabase; // suppress unused warning until real calls are enabled

      if (action === "applied") {
        // --- real: create an application row, then archive the job (uncomment when API is ready) ---
        // const { error: appErr } = await supabase
        //   .from("applications")
        //   .insert({ job_id: jobId, stage: "applied" });
        // if (appErr) { setError(appErr.message); return; }
        // const { error: jobErr } = await supabase
        //   .from("jobs")
        //   .update({ status: "archived" })
        //   .eq("id", jobId);
        // if (jobErr) setError(jobErr.message);
      } else {
        // --- real: update job status (uncomment when API is ready) ---
        // const { error } = await supabase
        //   .from("jobs")
        //   .update({ status: action })
        //   .eq("id", jobId);
        // if (error) setError(error.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { jobs, loading, error, handleAction };
}
