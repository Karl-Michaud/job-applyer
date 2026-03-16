"use client";

import { useState } from "react";
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
  const {
    prefs, companies, greenhouseTargets, leverTargets, ashbyTargets, loading, error,
    updatePref, toggleCompanyBlacklist,
    addGreenhouseTarget, removeGreenhouseTarget, toggleGreenhouseTarget,
    addLeverTarget, removeLeverTarget, toggleLeverTarget,
    addAshbyTarget, removeAshbyTarget, toggleAshbyTarget,
  } = useSettingsViewModel();

  const [ghSlug, setGhSlug] = useState("");
  const [ghName, setGhName] = useState("");
  const [lvSlug, setLvSlug] = useState("");
  const [lvName, setLvName] = useState("");
  const [abSlug, setAbSlug] = useState("");
  const [abName, setAbName] = useState("");

  const ghNames = new Set(greenhouseTargets.map((t) => t.display_name.toLowerCase()));
  const lvNames = new Set(leverTargets.map((t) => t.display_name.toLowerCase()));
  const abNames = new Set(ashbyTargets.map((t) => t.display_name.toLowerCase()));

  async function handleAddGreenhouse() {
    if (!ghSlug.trim() || !ghName.trim()) return;
    await addGreenhouseTarget(ghSlug, ghName);
    setGhSlug("");
    setGhName("");
  }

  async function handleAddLever() {
    if (!lvSlug.trim() || !lvName.trim()) return;
    await addLeverTarget(lvSlug, lvName);
    setLvSlug("");
    setLvName("");
  }

  async function handleAddAshby() {
    if (!abSlug.trim() || !abName.trim()) return;
    await addAshbyTarget(abSlug, abName);
    setAbSlug("");
    setAbName("");
  }

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
        title="Must-Have Keywords"
        description="Job titles must contain at least one of these words (case-insensitive). Leave empty to allow all titles."
      >
        <div className="flex flex-col gap-1.5">
          <Label>Must-Have Keywords</Label>
          <TagInput
            tags={prefs.must_have_keywords}
            onChange={(v) => updatePref("must_have_keywords", v)}
            placeholder="e.g. software, data, machine learning..."
          />
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

      <Section
        title="Greenhouse Targets"
        description="Companies to scrape via the Greenhouse API. Deduplication is handled automatically by URL."
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={ghName}
              onChange={(e) => setGhName(e.target.value)}
              placeholder="Display name (e.g. Shopify)"
              className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <input
              type="text"
              value={ghSlug}
              onChange={(e) => setGhSlug(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddGreenhouse(); }}
              placeholder="Slug (e.g. shopify)"
              className="w-36 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={handleAddGreenhouse}
              disabled={!ghSlug.trim() || !ghName.trim()}
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {greenhouseTargets.length > 0 && (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {greenhouseTargets.map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                      {target.display_name}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{target.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleGreenhouseTarget(target.id, !target.enabled)}
                      className={`text-xs rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                        target.enabled
                          ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {target.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      onClick={() => removeGreenhouseTarget(target.id)}
                      className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Lever Targets"
        description="Companies to scrape via the Lever API. Find the slug in the careers page URL: jobs.lever.co/{slug}"
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={lvName}
              onChange={(e) => setLvName(e.target.value)}
              placeholder="Display name (e.g. Spotify)"
              className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <input
              type="text"
              value={lvSlug}
              onChange={(e) => setLvSlug(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddLever(); }}
              placeholder="Slug (e.g. spotify)"
              className="w-36 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={handleAddLever}
              disabled={!lvSlug.trim() || !lvName.trim()}
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {leverTargets.length > 0 && (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {leverTargets.map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                      {target.display_name}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{target.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLeverTarget(target.id, !target.enabled)}
                      className={`text-xs rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                        target.enabled
                          ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {target.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      onClick={() => removeLeverTarget(target.id)}
                      className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Ashby Targets"
        description="Companies to scrape via the Ashby API. Find the slug in the careers page URL: jobs.ashbyhq.com/{slug}"
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={abName}
              onChange={(e) => setAbName(e.target.value)}
              placeholder="Display name (e.g. Notion)"
              className="flex-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <input
              type="text"
              value={abSlug}
              onChange={(e) => setAbSlug(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddAshby(); }}
              placeholder="Slug (e.g. notion)"
              className="w-36 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={handleAddAshby}
              disabled={!abSlug.trim() || !abName.trim()}
              className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {ashbyTargets.length > 0 && (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              {ashbyTargets.map((target) => (
                <div
                  key={target.id}
                  className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                      {target.display_name}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">{target.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAshbyTarget(target.id, !target.enabled)}
                      className={`text-xs rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                        target.enabled
                          ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {target.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      onClick={() => removeAshbyTarget(target.id)}
                      className="text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {company.name}
                  </span>
                  {company.domain && (
                    <span className="text-xs text-zinc-400">{company.domain}</span>
                  )}
                  {ghNames.has(company.name.toLowerCase()) && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Greenhouse
                    </span>
                  )}
                  {lvNames.has(company.name.toLowerCase()) && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Lever
                    </span>
                  )}
                  {abNames.has(company.name.toLowerCase()) && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
                      Ashby
                    </span>
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
