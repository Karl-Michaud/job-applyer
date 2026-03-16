"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";
import { Job, JobAction } from "@/features/jobs/models/types";

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
    async function fetchJobs() {
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
      else setJobs((data as unknown as Job[]) ?? []);

      setLoading(false);
    }

    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = useCallback(
    async (jobId: string, action: JobAction) => {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));

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
    []
  );

  return { jobs, loading, error, handleAction };
}
