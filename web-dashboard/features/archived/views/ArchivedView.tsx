"use client";

import { useArchivedViewModel } from "@/features/archived/viewmodels/useArchivedViewModel";
import { ArchivedTable } from "./components/ArchivedTable";

export function ArchivedView() {
  const {
    jobs,
    loading,
    error,
    rowSelection,
    setRowSelection,
    selectedCount,
    deleteJob,
    deleteSelected,
    restoreJob,
  } = useArchivedViewModel();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Archive</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {loading
              ? "Loading..."
              : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} archived`}
          </p>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={deleteSelected}
            className="flex items-center gap-2 rounded-md bg-red-600 hover:bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition-colors"
          >
            Delete {selectedCount} selected
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-500 text-sm">
          Loading archive...
        </div>
      ) : (
        <ArchivedTable
          jobs={jobs}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          onDelete={deleteJob}
          onRestore={restoreJob}
        />
      )}
    </div>
  );
}
