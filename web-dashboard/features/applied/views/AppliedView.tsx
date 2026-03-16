"use client";

import { useAppliedViewModel } from "@/features/applied/viewmodels/useAppliedViewModel";
import { AppliedTable } from "./components/AppliedTable";

export function AppliedView() {
  const { applications, loading, error, updateStage } = useAppliedViewModel();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Applied</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          {loading
            ? "Loading..."
            : `${applications.length} active application${applications.length !== 1 ? "s" : ""}`}
        </p>
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
        <AppliedTable applications={applications} onUpdateStage={updateStage} />
      )}
    </div>
  );
}
