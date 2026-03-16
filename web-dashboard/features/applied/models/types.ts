import type { Job } from "@/features/jobs/models/types";

export type ApplicationStage =
  | "applied"
  | "oa"
  | "phone_screen"
  | "interviewing"
  | "onsite"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn";

export interface Application {
  id: string;
  job_id: string;
  applied_at: string;
  stage: ApplicationStage;
  stage_history: { stage: ApplicationStage; changed_at: string; note?: string }[];
  cover_letter: string | null;
  resume_version: string | null;
  contact_name: string | null;
  contact_email: string | null;
  next_action_date: string | null;
  next_action_note: string | null;
  created_at: string;
  updated_at: string;
  job: Job;
}
