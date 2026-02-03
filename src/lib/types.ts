// This represents your search settings
export interface Monitor {
  id: string;
  keyword: string; // e.g. "Dentists"
  location: string; // e.g. "Budapest"
  status: "active" | "paused";
}

// This represents the businesses we find
export interface Lead {
  id: string;
  business_name: string;
  opportunity_tag: "Missed Call" | "New Business" | "Bad Review";
  is_unlocked: boolean;
  email?: string; // Only shows if unlocked
}
