export interface Preferences {
  target_roles: string[];
  target_locations: string[];
  job_type_keywords: string[];
  must_have_keywords: string[];
  blacklisted_keywords: string[];
  blacklisted_companies: string[];
  daily_goal: number;
  max_age_weeks: number;
  remote_preference: "any" | "remote_only" | "no_remote";
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  blacklisted: boolean;
}

export interface GreenhouseTarget {
  id: string;
  slug: string;
  display_name: string;
  enabled: boolean;
}

export interface LeverTarget {
  id: string;
  slug: string;
  display_name: string;
  enabled: boolean;
}

export interface AshbyTarget {
  id: string;
  slug: string;
  display_name: string;
  enabled: boolean;
}
