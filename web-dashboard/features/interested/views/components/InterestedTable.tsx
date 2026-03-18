"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Job, JobAction } from "@/features/jobs/models/types";
import { InterestedStatusSelect } from "./InterestedStatusSelect";
import { JobDetailModal } from "@/features/jobs/views/components/JobDetailModal";

interface InterestedTableProps {
  jobs: Job[];
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
  if (job.deadline_type === "unknown" || !job.closing_at) return "Unknown";
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
  return term.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InterestedTable({ jobs, onAction }: InterestedTableProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const columns: ColumnDef<Job, unknown>[] = [
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
        if (type === "remote") return (
          <span className="text-xs rounded-full px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400">Remote</span>
        );
        if (!loc) return <span className="text-zinc-400 dark:text-zinc-500">—</span>;
        return (
          <div className="flex items-center gap-1.5 max-w-[160px]">
            <span className="text-zinc-500 dark:text-zinc-400 truncate">{loc}</span>
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
          <InterestedStatusSelect jobId={row.original.id} onAction={onAction} />
          <button
            onClick={() => setSelectedJob(row.original)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            See more →
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={jobs}
        emptyMessage="No saved jobs. Mark jobs as Interested from the feed."
      />
      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </>
  );
}
