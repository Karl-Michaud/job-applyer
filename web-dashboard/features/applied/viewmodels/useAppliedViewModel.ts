"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";
import { Application, ApplicationStage } from "@/features/applied/models/types";

interface UseAppliedViewModel {
  applications: Application[];
  loading: boolean;
  error: string | null;
  updateStage: (applicationId: string, jobId: string, stage: ApplicationStage) => Promise<void>;
}

export function useAppliedViewModel(): UseAppliedViewModel {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchApplications() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("applications")
        .select(`
          id, job_id, applied_at, stage, stage_history,
          cover_letter, resume_version,
          contact_name, contact_email,
          next_action_date, next_action_note,
          created_at, updated_at,
          job:jobs (
            id, title, source_url, location, location_type, job_type,
            term, duration, posted_at, closing_at, deadline_type,
            salary_min, salary_max, tags, status, rank, notes,
            scraped_at, updated_at,
            company:companies ( id, name, domain )
          )
        `)
        .not("stage", "in", '("withdrawn")')
        .order("applied_at", { ascending: false });

      if (error) setError(error.message);
      else setApplications((data as unknown as Application[]) ?? []);

      setLoading(false);
    }

    fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStage = useCallback(
    async (applicationId: string, jobId: string, stage: ApplicationStage) => {
      // Optimistically remove from list if withdrawn
      if (stage === "withdrawn") {
        setApplications((prev) => prev.filter((a) => a.id !== applicationId));
      } else {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, stage } : a))
        );
      }

      const { error: appErr } = await supabase
        .from("applications")
        .update({ stage })
        .eq("id", applicationId);
      if (appErr) { setError(appErr.message); return; }

      // Withdrawn → archive the job
      if (stage === "withdrawn") {
        const { error: jobErr } = await supabase
          .from("jobs")
          .update({ status: "archived" })
          .eq("id", jobId);
        if (jobErr) setError(jobErr.message);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { applications, loading, error, updateStage };
}
