"use client";

import { useMemo, useState } from "react";
import { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Application, ApplicationStage } from "@/features/applied/models/types";
import { Job } from "@/features/jobs/models/types";
import { StageSelect } from "./StageSelect";
import { JobDetailModal } from "@/features/jobs/views/components/JobDetailModal";

interface AppliedTableProps {
  applications: Application[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onUpdateStage: (applicationId: string, jobId: string, stage: ApplicationStage) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTerm(term: string | null): string {
  if (!term) return "—";
  return term.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AppliedTable({ applications, rowSelection, onRowSelectionChange, onUpdateStage }: AppliedTableProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const columns: ColumnDef<Application, unknown>[] = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-zinc-300 dark:border-zinc-600 cursor-pointer"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-zinc-300 dark:border-zinc-600 cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      id: "company",
      accessorFn: (row) => row.job.company.name,
      header: "Company",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: "title",
      accessorFn: (row) => row.job.title,
      header: "Job Title",
      cell: ({ getValue }) => (
        <span className="text-zinc-800 dark:text-zinc-200">{getValue<string>()}</span>
      ),
    },
    {
      id: "location",
      accessorFn: (row) => row.job.location,
      header: "Location",
      cell: ({ row }) => {
        const loc = row.original.job.location;
        const type = row.original.job.location_type;
        if (!loc) return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{loc}</span>
            {type === "remote" && (
              <span className="text-xs rounded-full px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">Remote</span>
            )}
            {type === "hybrid" && (
              <span className="text-xs rounded-full px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400">Hybrid</span>
            )}
          </div>
        );
      },
    },
    {
      id: "term",
      accessorFn: (row) => row.job.term,
      header: "Period",
      cell: ({ getValue }) => (
        <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {formatTerm(getValue<string | null>())}
        </span>
      ),
    },
    {
      id: "duration",
      accessorFn: (row) => row.job.duration,
      header: "Length",
      cell: ({ getValue }) => (
        <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {getValue<string | null>() ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "applied_at",
      header: "Applied",
      cell: ({ getValue }) => (
        <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {formatDate(getValue<string>())}
        </span>
      ),
    },
    {
      id: "stage",
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <StageSelect
          applicationId={row.original.id}
          jobId={row.original.job_id}
          currentStage={row.original.stage}
          onUpdate={onUpdateStage}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedJob(row.original.job)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
        >
          See more →
        </button>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [onUpdateStage]);

  return (
    <>
      <DataTable
        columns={columns}
        data={applications}
        selectable
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        getRowId={(row) => row.id}
        emptyMessage="No applications yet. Mark a job as applied to track it here."
      />
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </>
  );
}
