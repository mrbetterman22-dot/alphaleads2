export interface User {
  id: string;
  email: string;
  credits: number;
}

export interface Monitor {
  id: string;
  user_id: string;
  keyword: string;
  location: string;
  status: "active" | "paused";
  last_check_date?: string;
}

export interface Lead {
  id: string;
  monitor_id?: string;
  business_name: string;
  place_id: string;
  rating: number;
  review_count: number;

  // Contact Info
  email?: string;
  phone?: string;
  website?: string;
  full_name?: string;

  // The "Money Metrics"
  reviews_per_score_1?: number;
  reviews_per_score_5?: number;
  website_generator?: string;
  website_has_fb_pixel?: boolean;
  is_verified?: boolean;

  // System Fields
  opportunity_tags: string[]; // This stores the Sales Buckets (e.g., "Website Pitch")
  business_status?: string;
  city?: string;
  is_unlocked: boolean;
}
