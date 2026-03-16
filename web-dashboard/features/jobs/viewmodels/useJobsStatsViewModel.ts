"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";

export interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export type TermSeason = "Winter" | "Summer" | "Fall";

export interface Term {
  season: TermSeason;
  year: number;
}

interface UseJobsStatsViewModel {
  countMap: Map<string, number>;
  todayCount: number;
  dailyGoal: number;
  loading: boolean;
}

export function getTermDates(season: TermSeason, year: number): { start: Date; end: Date } {
  switch (season) {
    case "Winter": return { start: new Date(year, 0, 1),  end: new Date(year, 3, 30) };
    case "Summer": return { start: new Date(year, 4, 1),  end: new Date(year, 7, 31) };
    case "Fall":   return { start: new Date(year, 8, 1),  end: new Date(year, 11, 31) };
  }
}

export function getCurrentTerm(): Term {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month <= 4) return { season: "Winter", year };
  if (month <= 8) return { season: "Summer", year };
  return { season: "Fall", year };
}

export function prevTerm({ season, year }: Term): Term {
  if (season === "Winter") return { season: "Fall",   year: year - 1 };
  if (season === "Summer") return { season: "Winter", year };
  return                          { season: "Summer", year };
}

export function nextTerm({ season, year }: Term): Term {
  if (season === "Fall")   return { season: "Winter", year: year + 1 };
  if (season === "Winter") return { season: "Summer", year };
  return                          { season: "Fall",   year };
}

function toLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2)  return 1;
  if (count <= 4)  return 2;
  if (count <= 7)  return 3;
  return 4;
}

export function buildActivityForTerm(countMap: Map<string, number>, term: Term): ActivityDay[] {
  const { start, end } = getTermDates(term.season, term.year);
  const today = new Date();
  const cap = end < today ? end : today;

  const days: ActivityDay[] = [];
  const cursor = new Date(start);
  while (cursor <= cap) {
    const dateStr = cursor.toISOString().split("T")[0];
    const count = countMap.get(dateStr) ?? 0;
    days.push({ date: dateStr, count, level: toLevel(count) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function useJobsStatsViewModel(): UseJobsStatsViewModel {
  const [countMap, setCountMap] = useState<Map<string, number>>(new Map());
  const [todayCount, setTodayCount] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const [{ data: jobData }, { data: prefData }] = await Promise.all([
        supabase.from("jobs").select("updated_at").eq("status", "applied"),
        supabase.from("preferences").select("value").eq("key", "daily_goal").single(),
      ]);

      const map = new Map<string, number>();
      for (const row of jobData ?? []) {
        const day = (row.updated_at as string).split("T")[0];
        map.set(day, (map.get(day) ?? 0) + 1);
      }

      const todayStr = new Date().toISOString().split("T")[0];
      setTodayCount(map.get(todayStr) ?? 0);
      setCountMap(map);
      setDailyGoal(prefData ? Number(prefData.value) : 5);
      setLoading(false);
    }

    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { countMap, todayCount, dailyGoal, loading };
}
