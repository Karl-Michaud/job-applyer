"use client";

import { useEffect, useState } from "react";
import { Job } from "@/features/jobs/models/types";

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
}

function formatDeadline(job: Job): string {
  if (job.deadline_type === "rolling") return "Rolling";
  if (job.deadline_type === "unknown" || !job.closing_at) return "Unknown";
  return new Date(job.closing_at).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  if (job.salary_min) return `From ${fmt(job.salary_min)}`;
  return `Up to ${fmt(job.salary_max!)}`;
}

export function JobDetailModal({ job, onClose }: JobDetailModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const salary = formatSalary(job);
  const [copied, setCopied] = useState(false);

  function copyDescription() {
    const text = job.description_text ?? job.description ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">
              {job.company.name}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
              {job.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xl leading-none mt-0.5"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 px-6 pt-4 pb-2">
          {job.location && (
            <Pill>{job.location}</Pill>
          )}
          {job.location_type && (
            <Pill className="capitalize">{job.location_type}</Pill>
          )}
          {job.term && (
            <Pill className="capitalize">{job.term.replace(/-/g, " ")}</Pill>
          )}
          {job.duration && <Pill>{job.duration}</Pill>}
          {salary && <Pill>{salary}</Pill>}
          <Pill>Deadline: {formatDeadline(job)}</Pill>
          {job.tags.map((tag) => (
            <Pill key={tag} className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              {tag}
            </Pill>
          ))}
        </div>

        {/* Apply link */}
        <div className="px-6 pb-4">
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            View original posting ↗
          </a>
        </div>

        {/* Description */}
        <div className="px-6 pb-6">
          {(job.description_text || job.description) && (
            <div className="flex justify-end mb-2">
              <button
                onClick={copyDescription}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1"
              >
                {copied ? "Copied!" : "Copy description"}
              </button>
            </div>
          )}
          {job.description_text ? (
            <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {job.description_text}
            </div>
          ) : job.description ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No description available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block text-xs px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 ${className}`}
    >
      {children}
    </span>
  );
}
