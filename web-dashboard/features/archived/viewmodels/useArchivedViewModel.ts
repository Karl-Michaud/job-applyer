"use client";

import { useCallback, useEffect, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import { createClient } from "@/shared/supabase/client";
import { Job } from "@/features/jobs/models/types";

interface UseArchivedViewModel {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  rowSelection: RowSelectionState;
  setRowSelection: (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
  selectedCount: number;
  deleteJob: (jobId: string) => Promise<void>;
  deleteSelected: () => Promise<void>;
  restoreJob: (jobId: string) => Promise<void>;
}

export function useArchivedViewModel(): UseArchivedViewModel {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
        .or("status.eq.archived,status.eq.disliked")
        .order("updated_at", { ascending: false });

      if (error) setError(error.message);
      else setJobs((data as unknown as Job[]) ?? []);

      setLoading(false);
    }

    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    setRowSelection((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });

    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) setError(error.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteSelected = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) return;

    setJobs((prev) => prev.filter((j) => !selectedIds.includes(j.id)));
    setRowSelection({});

    const { error } = await supabase.from("jobs").delete().in("id", selectedIds);
    if (error) setError(error.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const restoreJob = useCallback(async (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));

    const { error } = await supabase
      .from("jobs")
      .update({ status: "new" })
      .eq("id", jobId);
    if (error) setError(error.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCount = Object.keys(rowSelection).length;

  return {
    jobs,
    loading,
    error,
    rowSelection,
    setRowSelection,
    selectedCount,
    deleteJob,
    deleteSelected,
    restoreJob,
  };
}
