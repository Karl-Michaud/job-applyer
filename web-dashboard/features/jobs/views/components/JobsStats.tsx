"use client";

import { ActivityCalendar } from "react-activity-calendar";
import { useJobsStatsViewModel } from "@/features/jobs/viewmodels/useJobsStatsViewModel";

function DailyProgressCircle({ count, goal }: { count: number; goal: number }) {
  const pct = Math.min(count / goal, 1);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  const done = count >= goal;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            strokeWidth="6"
            className="stroke-zinc-100 dark:stroke-zinc-800"
          />
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={done ? "stroke-green-500" : "stroke-green-400"}
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold leading-none ${done ? "text-green-600 dark:text-green-500" : "text-zinc-800 dark:text-zinc-100"}`}>
            {count}
          </span>
          <span className="text-[10px] text-zinc-400 leading-none mt-0.5">/ {goal}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {done ? "Daily goal reached!" : "Today's applications"}
        </p>
        <p className="text-xs text-zinc-400 mt-0.5">
          {done ? `${count} of ${goal} applied today` : `${goal - count} more to hit your goal`}
        </p>
      </div>
    </div>
  );
}

export function JobsStats() {
  const { activity, todayCount, dailyGoal, loading } = useJobsStatsViewModel();

  if (loading || activity.length === 0) return null;

  const totalYear = activity.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col gap-6 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <DailyProgressCircle count={todayCount} goal={dailyGoal} />
        <p className="text-sm text-zinc-400 dark:text-zinc-500 self-end">
          {totalYear} application{totalYear !== 1 ? "s" : ""} in the last year
        </p>
      </div>

      <ActivityCalendar
        data={activity}
        maxLevel={4}
        blockSize={13}
        fontSize={12}
        showWeekdayLabels
        theme={{
          light: ["#f4f4f5", "#bbf7d0", "#4ade80", "#16a34a", "#14532d"],
          dark:  ["#27272a", "#14532d", "#16a34a", "#4ade80", "#bbf7d0"],
        }}
        labels={{
          totalCount: "{{count}} applications in the last year",
        }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
