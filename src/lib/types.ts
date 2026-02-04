// src/lib/types.ts

export interface User {
  id: string;
  email: string;
  credits: number; // New: Track user balance
}

export interface Monitor {
  id: string;
  user_id: string;
  keyword: string;
  location: string; // We use 'location' instead of 'city' to match your database
  status: "active" | "paused";
  last_check_date?: string;
}

export type LeadType = "new_business" | "pain_point";

export interface Lead {
  id: string;
  monitor_id: string;
  business_name: string;
  place_id: string; // Keeps the Google Maps ID
  rating: number;
  review_text?: string; // New: For the "Pain Hunter"
  review_date?: string;
  email?: string;
  phone?: string;
  opportunity_type: string; // Maps to 'type' in your logic (New Business/Pain Point)
  ai_pitch?: string; // New: For the AI generated message
  is_unlocked: boolean;
}
