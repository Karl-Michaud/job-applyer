export interface Preferences {
  target_roles: string[];
  target_locations: string[];
  blacklisted_keywords: string[];
  blacklisted_companies: string[];
  daily_goal: number;
}

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  blacklisted: boolean;
}
