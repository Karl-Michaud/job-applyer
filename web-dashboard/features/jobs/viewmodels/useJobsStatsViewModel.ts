"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";

export interface ActivityDay {
  date: string;  // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface UseJobsStatsViewModel {
  activity: ActivityDay[];
  todayCount: number;
  dailyGoal: number;
  loading: boolean;
}

function toLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function useJobsStatsViewModel(): UseJobsStatsViewModel {
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const [{ data: appData }, { data: prefData }] = await Promise.all([
        supabase
          .from("applications")
          .select("applied_at")
          .gte("applied_at", oneYearAgo.toISOString()),
        supabase
          .from("preferences")
          .select("value")
          .eq("key", "daily_goal")
          .single(),
      ]);

      // Build count map from raw dates
      const countMap = new Map<string, number>();
      for (const row of appData ?? []) {
        const day = row.applied_at.split("T")[0];
        countMap.set(day, (countMap.get(day) ?? 0) + 1);
      }

      // Fill every day in the last year so the calendar renders correctly
      const days: ActivityDay[] = [];
      const today = new Date();
      const cursor = new Date(oneYearAgo);
      while (cursor <= today) {
        const dateStr = toDateStr(cursor);
        const count = countMap.get(dateStr) ?? 0;
        days.push({ date: dateStr, count, level: toLevel(count) });
        cursor.setDate(cursor.getDate() + 1);
      }

      const todayStr = toDateStr(today);
      setTodayCount(countMap.get(todayStr) ?? 0);
      setActivity(days);
      setDailyGoal(prefData ? Number(prefData.value) : 5);
      setLoading(false);
    }

    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { activity, todayCount, dailyGoal, loading };
}
