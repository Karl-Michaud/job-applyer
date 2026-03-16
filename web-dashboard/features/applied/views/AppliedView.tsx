"use client";

import { useAppliedViewModel, MoveBackDestination } from "@/features/applied/viewmodels/useAppliedViewModel";
import { AppliedTable } from "./components/AppliedTable";
import { ApplicationSankey } from "./components/ApplicationSankey";

const DESTINATIONS: { label: string; value: MoveBackDestination }[] = [
  { label: "Jobs", value: "new" },
  { label: "Interested", value: "saved" },
  { label: "Archive", value: "archived" },
];

export function AppliedView() {
  const {
    applications, loading, error,
    rowSelection, setRowSelection, selectedCount,
    updateStage, moveSelected,
  } = useAppliedViewModel();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Applied</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {loading
              ? "Loading..."
              : `${applications.length} active application${applications.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Move {selectedCount} selected to:
            </span>
            {DESTINATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => moveSelected(d.value)}
                className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-500 text-sm">
          Loading applications...
        </div>
      ) : (
        <>
          <ApplicationSankey applications={applications} />
          <AppliedTable
            applications={applications}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onUpdateStage={updateStage}
          />
        </>
      )}
    </div>
  );
}
