"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";
import { Preferences, Company } from "@/features/settings/models/types";

const DEFAULT_PREFS: Preferences = {
  target_roles: [],
  target_locations: [],
  blacklisted_keywords: [],
  blacklisted_companies: [],
  daily_goal: 5,
};

interface UseSettingsViewModel {
  prefs: Preferences;
  companies: Company[];
  loading: boolean;
  error: string | null;
  updatePref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>;
  toggleCompanyBlacklist: (companyId: string, blacklisted: boolean) => Promise<void>;
}

export function useSettingsViewModel(): UseSettingsViewModel {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);

      const [{ data: prefData, error: prefErr }, { data: compData, error: compErr }] =
        await Promise.all([
          supabase.from("preferences").select("key, value"),
          supabase.from("companies").select("id, name, domain, blacklisted").order("name"),
        ]);

      if (prefErr) { setError(prefErr.message); setLoading(false); return; }
      if (compErr) { setError(compErr.message); setLoading(false); return; }

      const merged = { ...DEFAULT_PREFS };
      for (const row of prefData ?? []) {
        const key = row.key as keyof Preferences;
        if (key === "daily_goal") {
          merged.daily_goal = Number(row.value);
        } else if (key in merged) {
          (merged as Record<string, unknown>)[key] = row.value;
        }
      }

      setPrefs(merged);
      setCompanies((compData as Company[]) ?? []);
      setLoading(false);
    }

    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePref = useCallback(
    async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPrefs((prev) => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from("preferences")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleCompanyBlacklist = useCallback(
    async (companyId: string, blacklisted: boolean) => {
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, blacklisted } : c))
      );

      const { error } = await supabase
        .from("companies")
        .update({ blacklisted })
        .eq("id", companyId);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { prefs, companies, loading, error, updatePref, toggleCompanyBlacklist };
}
