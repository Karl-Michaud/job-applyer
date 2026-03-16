"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/shared/supabase/client";
import { Preferences, Company, GreenhouseTarget, LeverTarget, AshbyTarget } from "@/features/settings/models/types";

const DEFAULT_PREFS: Preferences = {
  target_roles: [],
  target_locations: [],
  job_type_keywords: [],
  must_have_keywords: [],
  blacklisted_keywords: [],
  blacklisted_companies: [],
  daily_goal: 5,
};

interface UseSettingsViewModel {
  prefs: Preferences;
  companies: Company[];
  greenhouseTargets: GreenhouseTarget[];
  leverTargets: LeverTarget[];
  ashbyTargets: AshbyTarget[];
  loading: boolean;
  error: string | null;
  updatePref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>;
  toggleCompanyBlacklist: (companyId: string, blacklisted: boolean) => Promise<void>;
  addGreenhouseTarget: (slug: string, displayName: string) => Promise<void>;
  removeGreenhouseTarget: (id: string) => Promise<void>;
  toggleGreenhouseTarget: (id: string, enabled: boolean) => Promise<void>;
  addLeverTarget: (slug: string, displayName: string) => Promise<void>;
  removeLeverTarget: (id: string) => Promise<void>;
  toggleLeverTarget: (id: string, enabled: boolean) => Promise<void>;
  addAshbyTarget: (slug: string, displayName: string) => Promise<void>;
  removeAshbyTarget: (id: string) => Promise<void>;
  toggleAshbyTarget: (id: string, enabled: boolean) => Promise<void>;
}

export function useSettingsViewModel(): UseSettingsViewModel {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [greenhouseTargets, setGreenhouseTargets] = useState<GreenhouseTarget[]>([]);
  const [leverTargets, setLeverTargets] = useState<LeverTarget[]>([]);
  const [ashbyTargets, setAshbyTargets] = useState<AshbyTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      setError(null);

      const [
        { data: prefData, error: prefErr },
        { data: compData, error: compErr },
        { data: ghData, error: ghErr },
        { data: lvData, error: lvErr },
        { data: abData, error: abErr },
      ] = await Promise.all([
        supabase.from("preferences").select("key, value"),
        supabase.from("companies").select("id, name, domain, blacklisted").order("name"),
        supabase.from("greenhouse_targets").select("id, slug, display_name, enabled").order("display_name"),
        supabase.from("lever_targets").select("id, slug, display_name, enabled").order("display_name"),
        supabase.from("ashby_targets").select("id, slug, display_name, enabled").order("display_name"),
      ]);

      if (prefErr) { setError(prefErr.message); setLoading(false); return; }
      if (compErr) { setError(compErr.message); setLoading(false); return; }
      if (ghErr) { setError(ghErr.message); setLoading(false); return; }
      if (lvErr) { setError(lvErr.message); setLoading(false); return; }
      if (abErr) { setError(abErr.message); setLoading(false); return; }

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
      setGreenhouseTargets((ghData as GreenhouseTarget[]) ?? []);
      setLeverTargets((lvData as LeverTarget[]) ?? []);
      setAshbyTargets((abData as AshbyTarget[]) ?? []);
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

  const addGreenhouseTarget = useCallback(
    async (slug: string, displayName: string) => {
      const { data, error } = await supabase
        .from("greenhouse_targets")
        .insert({ slug: slug.trim().toLowerCase(), display_name: displayName.trim() })
        .select("id, slug, display_name, enabled")
        .single();
      if (error) { setError(error.message); return; }
      setGreenhouseTargets((prev) => [...prev, data as GreenhouseTarget].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeGreenhouseTarget = useCallback(
    async (id: string) => {
      setGreenhouseTargets((prev) => prev.filter((t) => t.id !== id));
      const { error } = await supabase.from("greenhouse_targets").delete().eq("id", id);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleGreenhouseTarget = useCallback(
    async (id: string, enabled: boolean) => {
      setGreenhouseTargets((prev) => prev.map((t) => (t.id === id ? { ...t, enabled } : t)));
      const { error } = await supabase.from("greenhouse_targets").update({ enabled }).eq("id", id);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const addLeverTarget = useCallback(
    async (slug: string, displayName: string) => {
      const { data, error } = await supabase
        .from("lever_targets")
        .insert({ slug: slug.trim().toLowerCase(), display_name: displayName.trim() })
        .select("id, slug, display_name, enabled")
        .single();
      if (error) { setError(error.message); return; }
      setLeverTargets((prev) => [...prev, data as LeverTarget].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeLeverTarget = useCallback(
    async (id: string) => {
      setLeverTargets((prev) => prev.filter((t) => t.id !== id));
      const { error } = await supabase.from("lever_targets").delete().eq("id", id);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleLeverTarget = useCallback(
    async (id: string, enabled: boolean) => {
      setLeverTargets((prev) => prev.map((t) => (t.id === id ? { ...t, enabled } : t)));
      const { error } = await supabase.from("lever_targets").update({ enabled }).eq("id", id);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const addAshbyTarget = useCallback(
    async (slug: string, displayName: string) => {
      const { data, error } = await supabase
        .from("ashby_targets")
        .insert({ slug: slug.trim().toLowerCase(), display_name: displayName.trim() })
        .select("id, slug, display_name, enabled")
        .single();
      if (error) { setError(error.message); return; }
      setAshbyTargets((prev) => [...prev, data as AshbyTarget].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeAshbyTarget = useCallback(
    async (id: string) => {
      setAshbyTargets((prev) => prev.filter((t) => t.id !== id));
      const { error } = await supabase.from("ashby_targets").delete().eq("id", id);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const toggleAshbyTarget = useCallback(
    async (id: string, enabled: boolean) => {
      setAshbyTargets((prev) => prev.map((t) => (t.id === id ? { ...t, enabled } : t)));
      const { error } = await supabase.from("ashby_targets").update({ enabled }).eq("id", id);
      if (error) setError(error.message);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    prefs,
    companies,
    greenhouseTargets,
    leverTargets,
    ashbyTargets,
    loading,
    error,
    updatePref,
    toggleCompanyBlacklist,
    addGreenhouseTarget,
    removeGreenhouseTarget,
    toggleGreenhouseTarget,
    addLeverTarget,
    removeLeverTarget,
    toggleLeverTarget,
    addAshbyTarget,
    removeAshbyTarget,
    toggleAshbyTarget,
  };
}
