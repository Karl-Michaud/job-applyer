"use client";

import { useMemo, useState } from "react";
import { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Job, JobAction } from "@/features/jobs/models/types";
import { JobStatusSelect } from "./JobStatusSelect";
import { JobDetailModal } from "./JobDetailModal";

interface JobsTableProps {
  jobs: Job[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onAction: (jobId: string, action: JobAction) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDeadline(job: Job): string {
  if (job.deadline_type === "rolling") return "Rolling";
  if (job.deadline_type === "unknown" || !job.closing_at) {
    return "Unknown";
  }
  const date = new Date(job.closing_at);
  const daysLeft = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const label = date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
  return `${label} (${daysLeft}d)`;
}

function deadlineUrgency(job: Job): string {
  if (job.deadline_type !== "date" || !job.closing_at) return "";
  const daysLeft = Math.ceil((new Date(job.closing_at).getTime() - Date.now()) / 86_400_000);
  if (daysLeft <= 3) return "text-red-600 dark:text-red-400 font-semibold";
  if (daysLeft <= 7) return "text-amber-600 dark:text-amber-400 font-medium";
  return "";
}

function formatTerm(term: string | null): string {
  if (!term) return "—";
  // "summer-2026" → "Summer 2026"
  return term.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function JobsTable({ jobs, rowSelection, onRowSelectionChange, onAction }: JobsTableProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const columns: ColumnDef<Job, unknown>[] = useMemo(() => [
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
      accessorFn: (row) => row.company.name,
      header: "Company",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "title",
      header: "Job Title",
      cell: ({ getValue }) => (
        <span className="text-zinc-800 dark:text-zinc-200">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      size: 160,
      cell: ({ row }) => {
        const loc = row.original.location?.split(" / ")[0] ?? null;
        const type = row.original.location_type;
        if (!loc) return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
        return (
          <div className="flex items-center gap-1.5 max-w-[160px]">
            <span className="text-zinc-500 dark:text-zinc-400 truncate">{loc}</span>
            {type === "remote" && (
              <span className="shrink-0 text-xs rounded-full px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">Remote</span>
            )}
            {type === "hybrid" && (
              <span className="shrink-0 text-xs rounded-full px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400">Hybrid</span>
            )}
          </div>
        );
      },
    },
    {
      id: "posted_at",
      accessorKey: "posted_at",
      header: "Posted",
      cell: ({ getValue }) => (
        <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {formatDate(getValue<string | null>())}
        </span>
      ),
    },
    {
      id: "deadline",
      accessorFn: (row) => row.closing_at,
      header: "Deadline",
      cell: ({ row }) => (
        <span className={`whitespace-nowrap ${deadlineUrgency(row.original)}`}>
          {formatDeadline(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "duration",
      header: "Length",
      cell: ({ getValue }) => (
        <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {getValue<string | null>() ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "term",
      header: "Period",
      cell: ({ getValue }) => (
        <span className="text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {formatTerm(getValue<string | null>())}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <JobStatusSelect jobId={row.original.id} onAction={onAction} />
          <button
            onClick={() => setSelectedJob(row.original)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            See more →
          </button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [onAction]);

  return (
    <>
      <DataTable
        columns={columns}
        data={jobs}
        selectable
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        getRowId={(row) => row.id}
        emptyMessage="No new jobs. Run the scraper to fetch more."
      />
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </>
  );
}
