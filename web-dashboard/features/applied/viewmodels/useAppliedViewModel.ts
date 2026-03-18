"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import { createClient } from "@/shared/supabase/client";
import { Application, ApplicationStage } from "@/features/applied/models/types";

function chunks<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

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
  addManual: (data: { company: string; title: string; url: string; appliedAt: string }) => Promise<void>;
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
            term, duration, description, description_text,
            posted_at, closing_at, deadline_type,
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

      for (const chunk of chunks(selectedIds, 500)) {
        const { error: delErr } = await supabase.from("applications").delete().in("id", chunk);
        if (delErr) { setError(delErr.message); return; }
      }

      for (const chunk of chunks(jobIds, 500)) {
        const { error: jobErr } = await supabase.from("jobs").update({ status: destination }).in("id", chunk);
        if (jobErr) { setError(jobErr.message); return; }
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, removeFromList]
  );

  const addManual = useCallback(
    async ({ company, title, url, appliedAt }: { company: string; title: string; url: string; appliedAt: string }) => {
      // Upsert company
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("name", company)
        .maybeSingle();

      let companyId: string;
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: compErr } = await supabase
          .from("companies")
          .insert({ name: company })
          .select("id")
          .single();
        if (compErr) throw new Error(compErr.message);
        companyId = newCompany.id;
      }

      // Create job
      const sourceUrl = url || `manual:${crypto.randomUUID()}`;
      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .insert({
          source_url: sourceUrl,
          title,
          company_id: companyId,
          status: "applied",
          job_type: "internship",
        })
        .select("id, title, source_url, location, location_type, job_type, term, duration, description, description_text, posted_at, closing_at, deadline_type, salary_min, salary_max, tags, status, rank, notes, scraped_at, updated_at")
        .single();
      if (jobErr) throw new Error(jobErr.message);

      // Create application
      const { data: app, error: appErr } = await supabase
        .from("applications")
        .insert({
          job_id: job.id,
          stage: "applied",
          applied_at: appliedAt,
        })
        .select("id, job_id, applied_at, stage, stage_history, cover_letter, resume_version, contact_name, contact_email, next_action_date, next_action_note, created_at, updated_at")
        .single();
      if (appErr) throw new Error(appErr.message);

      const newApp: Application = {
        ...app,
        job: { ...job, company: { id: companyId, name: company, domain: null } },
      };

      const updated = [newApp, ...applicationsRef.current];
      applicationsRef.current = updated;
      setApplications(updated);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
    addManual,
  };
}
