"use client";

import { useSettingsViewModel } from "@/features/settings/viewmodels/useSettingsViewModel";
import { TagInput } from "./components/TagInput";

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-6 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
      {children}
    </label>
  );
}

export function SettingsView() {
  const { prefs, companies, loading, error, updatePref, toggleCompanyBlacklist } =
    useSettingsViewModel();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400 dark:text-zinc-500 text-sm">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Preferences used by the scraper and job feed.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      <Section
        title="Scraper Targets"
        description="Roles and locations the scraper should prioritize."
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Target Roles</Label>
            <TagInput
              tags={prefs.target_roles}
              onChange={(v) => updatePref("target_roles", v)}
              placeholder="e.g. Software Engineer, Backend Developer..."
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Target Locations</Label>
            <TagInput
              tags={prefs.target_locations}
              onChange={(v) => updatePref("target_locations", v)}
              placeholder="e.g. Toronto, Remote..."
            />
          </div>
        </div>
      </Section>

      <Section
        title="Blacklist"
        description="Jobs matching these keywords will be hidden from the feed."
      >
        <div className="flex flex-col gap-1.5">
          <Label>Blacklisted Keywords</Label>
          <TagInput
            tags={prefs.blacklisted_keywords}
            onChange={(v) => updatePref("blacklisted_keywords", v)}
            placeholder="e.g. Senior, Lead, Manager..."
          />
        </div>
      </Section>

      <Section
        title="Daily Goal"
        description="Target number of applications per day."
      >
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={prefs.daily_goal}
            onChange={(e) => updatePref("daily_goal", Number(e.target.value))}
            className="w-20 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">applications / day</span>
        </div>
      </Section>

      {companies.length > 0 && (
        <Section
          title="Companies"
          description="Toggle blacklist on companies scraped so far. Blacklisted companies won't appear in your feed."
        >
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {company.name}
                  </span>
                  {company.domain && (
                    <span className="ml-2 text-xs text-zinc-400">{company.domain}</span>
                  )}
                </div>
                <button
                  onClick={() => toggleCompanyBlacklist(company.id, !company.blacklisted)}
                  className={`text-xs rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                    company.blacklisted
                      ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {company.blacklisted ? "Blacklisted" : "Blacklist"}
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
