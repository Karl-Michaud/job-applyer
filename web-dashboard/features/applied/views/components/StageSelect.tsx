"use client";

import { ApplicationStage } from "@/features/applied/models/types";

interface StageSelectProps {
  applicationId: string;
  jobId: string;
  currentStage: ApplicationStage;
  onUpdate: (applicationId: string, jobId: string, stage: ApplicationStage) => void;
}

const STAGES: { label: string; value: ApplicationStage }[] = [
  { label: "Applied", value: "applied" },
  { label: "OA", value: "oa" },
  { label: "Phone Screen", value: "phone_screen" },
  { label: "Interviewing", value: "interviewing" },
  { label: "Onsite", value: "onsite" },
  { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" },
  { label: "Ghosted", value: "ghosted" },
  { label: "Withdrawn", value: "withdrawn" },
];

const STAGE_COLORS: Record<ApplicationStage, string> = {
  applied:      "text-zinc-600 dark:text-zinc-400",
  oa:           "text-blue-600 dark:text-blue-400",
  phone_screen: "text-blue-600 dark:text-blue-400",
  interviewing: "text-indigo-600 dark:text-indigo-400",
  onsite:       "text-violet-600 dark:text-violet-400",
  offer:        "text-green-600 dark:text-green-400",
  rejected:     "text-red-600 dark:text-red-400",
  ghosted:      "text-amber-600 dark:text-amber-400",
  withdrawn:    "text-zinc-500 dark:text-zinc-500",
};

export function StageSelect({ applicationId, jobId, currentStage, onUpdate }: StageSelectProps) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as ApplicationStage;
    if (value !== currentStage) onUpdate(applicationId, jobId, value);
  }

  return (
    <select
      value={currentStage}
      onChange={handleChange}
      className={`text-sm rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 pr-6 cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 font-medium ${STAGE_COLORS[currentStage]}`}
    >
      {STAGES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
