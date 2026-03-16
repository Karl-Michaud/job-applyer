export type JobStatus = "new" | "saved" | "archived" | "disliked";

/**
 * Actions a user can take on a job from the feed.
 * "applied" is separate from JobStatus — it creates an applications row
 * instead of (or in addition to) updating jobs.status.
 */
export type JobAction = JobStatus | "applied";
export type DeadlineType = "date" | "rolling" | "unknown";
export type JobLocationType = "remote" | "hybrid" | "onsite";
export type JobType = "internship" | "full_time" | "part_time" | "contract";

export interface Company {
  id: string;
  name: string;
  domain: string | null;
}

export interface Job {
  id: string;
  title: string;
  source_url: string;
  company: Company;

  location: string | null;
  location_type: JobLocationType | null;
  job_type: JobType | null;

  /** e.g. "summer-2026", "fall-2025" */
  term: string | null;
  /** e.g. "4 months", "8 months" */
  duration: string | null;

  description: string | null;
  description_text: string | null;

  posted_at: string | null;   // ISO string
  closing_at: string | null;  // ISO string, null when rolling or unknown
  deadline_type: DeadlineType;

  salary_min: number | null;
  salary_max: number | null;
  tags: string[];

  status: JobStatus;
  rank: number | null;
  notes: string | null;

  scraped_at: string;
  updated_at: string;
}
