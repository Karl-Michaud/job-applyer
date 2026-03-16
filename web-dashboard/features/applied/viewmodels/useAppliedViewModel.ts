"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import { createClient } from "@/shared/supabase/client";
import { Application, ApplicationStage } from "@/features/applied/models/types";

export type MoveBackDestination = "new" | "saved" | "archived";

interface UseAppliedViewModel {
  applications: Application[];
  loading: boolean;
  error: string | null;
  rowSelection: RowSelectionState;
  setRowSelection: (updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState)) => void;
  selectedCount: number;
  updateStage: (applicationId: string, jobId: string, stage: ApplicationStage) => Promise<void>;
  moveSelected: (destination: MoveBackDestination) => Promise<void>;
}

export function useAppliedViewModel(): UseAppliedViewModel {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const applicationsRef = useRef<Application[]>([]);

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
      else {
        const apps = (data as unknown as Application[]) ?? [];
        applicationsRef.current = apps;
        setApplications(apps);
      }

      setLoading(false);
    }

    fetchApplications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFromList = useCallback((ids: string[]) => {
    const next = applicationsRef.current.filter((a) => !ids.includes(a.id));
    applicationsRef.current = next;
    setApplications(next);
  }, []);

  const updateStage = useCallback(
    async (applicationId: string, jobId: string, stage: ApplicationStage) => {
      const app = applicationsRef.current.find((a) => a.id === applicationId);
      if (!app) return;

      const updatedHistory = stage === "applied"
        ? []
        : [...(app.stage_history ?? []), { stage, changed_at: new Date().toISOString() }];

      if (stage === "withdrawn") {
        removeFromList([applicationId]);
      } else {
        const next = applicationsRef.current.map((a) =>
          a.id === applicationId ? { ...a, stage, stage_history: updatedHistory } : a
        );
        applicationsRef.current = next;
        setApplications(next);
      }

      const { error: appErr } = await supabase
        .from("applications")
        .update({ stage, stage_history: updatedHistory })
        .eq("id", applicationId);
      if (appErr) { setError(appErr.message); return; }

      if (stage === "withdrawn") {
        const { error: jobErr } = await supabase
          .from("jobs")
          .update({ status: "archived" })
          .eq("id", jobId);
        if (jobErr) setError(jobErr.message);
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [removeFromList]
  );

  const moveSelected = useCallback(
    async (destination: MoveBackDestination) => {
      const selectedIds = Object.keys(rowSelection);
      if (selectedIds.length === 0) return;

      const selected = applicationsRef.current.filter((a) => selectedIds.includes(a.id));
      const jobIds = selected.map((a) => a.job_id);

      removeFromList(selectedIds);
      setRowSelection({});

      const { error: delErr } = await supabase
        .from("applications")
        .delete()
        .in("id", selectedIds);
      if (delErr) { setError(delErr.message); return; }

      const { error: jobErr } = await supabase
        .from("jobs")
        .update({ status: destination })
        .in("id", jobIds);
      if (jobErr) setError(jobErr.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, removeFromList]
  );

  const selectedCount = Object.keys(rowSelection).length;

  return {
    applications,
    loading,
    error,
    rowSelection,
    setRowSelection,
    selectedCount,
    updateStage,
    moveSelected,
  };
}
