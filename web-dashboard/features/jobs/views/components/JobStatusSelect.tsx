"use client";

import { JobAction } from "@/features/jobs/models/types";

interface JobStatusSelectProps {
  jobId: string;
  onAction: (jobId: string, action: JobAction) => void;
}

const OPTIONS: { label: string; value: JobAction }[] = [
  { label: "Interested", value: "saved" },
  { label: "Already Applied", value: "applied" },
  { label: "Not Interested", value: "disliked" },
  { label: "Archive", value: "archived" },
];

export function JobStatusSelect({ jobId, onAction }: JobStatusSelectProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as JobAction;
    if (value) onAction(jobId, value);
  }

  return (
    <select
      defaultValue=""
      onChange={handleChange}
      className="text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 pr-6 text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400"
    >
      <option value="" disabled>
        Move to...
      </option>
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
