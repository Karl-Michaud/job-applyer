"use client";

import { useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import {
  useJobsStatsViewModel,
  buildActivityForTerm,
  getCurrentTerm,
  prevTerm,
  nextTerm,
  type Term,
  type TermSeason,
} from "@/features/jobs/viewmodels/useJobsStatsViewModel";

const TERM_COLORS: Record<TermSeason, string> = {
  Winter: "text-blue-500 dark:text-blue-400",
  Summer: "text-amber-500 dark:text-amber-400",
  Fall:   "text-orange-500 dark:text-orange-400",
};

function isFutureTerm(term: Term): boolean {
  const current = getCurrentTerm();
  if (term.year > current.year) return true;
  if (term.year < current.year) return false;
  const order: TermSeason[] = ["Winter", "Summer", "Fall"];
  return order.indexOf(term.season) > order.indexOf(current.season);
}

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
          <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="6"
            className="stroke-zinc-100 dark:stroke-zinc-800" />
          <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="6"
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
  const { countMap, todayCount, dailyGoal, loading } = useJobsStatsViewModel();
  const [term, setTerm] = useState<Term>(getCurrentTerm);

  if (loading) return null;

  const activity = buildActivityForTerm(countMap, term);
  const termTotal = activity.reduce((sum, d) => sum + d.count, 0);
  const canGoNext = !isFutureTerm(nextTerm(term));

  return (
    <div className="flex gap-6 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 items-start">
      {/* Left: daily progress circle */}
      <div className="flex-shrink-0">
        <DailyProgressCircle count={todayCount} goal={dailyGoal} />
      </div>

      <div className="w-px self-stretch bg-zinc-100 dark:bg-zinc-800" />

      {/* Right: term nav + heatmap */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">
            {termTotal} application{termTotal !== 1 ? "s" : ""} this term
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTerm(prevTerm(term))}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              aria-label="Previous term"
            >
              ←
            </button>
            <span className={`text-sm font-semibold w-28 text-center ${TERM_COLORS[term.season]}`}>
              {term.season} {term.year}
            </span>
            <button
              onClick={() => canGoNext && setTerm(nextTerm(term))}
              disabled={!canGoNext}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next term"
            >
              →
            </button>
          </div>
        </div>

        {activity.length > 1 ? (
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
            style={{ width: "100%" }}
          />
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 py-4 text-center">
            No applications yet this term.
          </p>
        )}
      </div>
    </div>
  );
}
