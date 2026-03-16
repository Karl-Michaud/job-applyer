"use client";

import { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/shared/components/DataTable";
import { Job } from "@/features/jobs/models/types";

interface ArchivedTableProps {
  jobs: Job[];
  rowSelection: RowSelectionState;
  onRowSelectionChange: OnChangeFn<RowSelectionState>;
  onDelete: (jobId: string) => void;
  onRestore: (jobId: string) => void;
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

export function ArchivedTable({
  jobs,
  rowSelection,
  onRowSelectionChange,
  onDelete,
  onRestore,
}: ArchivedTableProps) {
  const columns: ColumnDef<Job, unknown>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded border-zinc-300 dark:border-zinc-600 cursor-pointer"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected();
          }}
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
          <button
            onClick={() => onRestore(row.original.id)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            Restore
          </button>
          <button
            onClick={() => onDelete(row.original.id)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={jobs}
      selectable
      rowSelection={rowSelection}
      onRowSelectionChange={onRowSelectionChange}
      emptyMessage="Archive is empty."
    />
  );
}
