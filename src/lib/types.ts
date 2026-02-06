// src/lib/types.ts

export interface User {
  id: string;
  email: string;
  credits: number;
}

export interface Lead {
  id: string; // UUID
  place_id: string; // The Google ID
  business_name: string;
  rating: number;
  review_count: number;

  // Contact
  website?: string;
  phone?: string;
  email?: string;
  full_name?: string;

  // Analysis
  reviews_per_score_1?: number;
  reviews_per_score_5?: number;
  website_generator?: string;
  website_has_fb_pixel?: boolean;
  is_verified?: boolean;

  // Categorization
  bucket_category: string; // e.g., "Reputation Repair"
  bucket_details: string;
  business_status?: string;
  city?: string;
}

// Junction Table for User <-> Lead
export interface UserLead {
  user_id: string;
  lead_id: string;
  is_unlocked: boolean;
  notes?: string;
}
