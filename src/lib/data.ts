import { Lead } from "./types";

export function identifyLead(
  incomingBusiness: any,
  history: Lead[],
): Lead | null {
  // Check if we already have this business in our database
  const exists = history.find((h) => h.place_id === incomingBusiness.place_id);

  // If it's a brand new business we've never seen, it's a Lead
  if (!exists) {
    return {
      id: crypto.randomUUID(),
      monitor_id: incomingBusiness.monitor_id,
      place_id: incomingBusiness.place_id,
      business_name: incomingBusiness.name || incomingBusiness.business_name,
      opportunity_type: "New Business",
      is_unlocked: false,
      rating: incomingBusiness.rating || 0,
      review_count:
        incomingBusiness.reviews || incomingBusiness.review_count || 0,
      reviews_per_score_1: incomingBusiness.reviews_per_score_1 || 0,
      created_at: new Date().toISOString(),
    };
  }

  // If we already knew about them, check if they now have "Pain Points"
  // Logic: Less than 50 reviews AND less than 4.6 stars AND at least one 1-star review
  const hasPain =
    incomingBusiness.rating < 4.6 &&
    (incomingBusiness.reviews || incomingBusiness.review_count) < 50 &&
    incomingBusiness.reviews_per_score_1 > 0;

  if (hasPain) {
    return {
      id: crypto.randomUUID(),
      monitor_id: incomingBusiness.monitor_id,
      place_id: incomingBusiness.place_id,
      business_name: incomingBusiness.name || incomingBusiness.business_name,
      opportunity_type: "Bad Review",
      is_unlocked: false,
      rating: incomingBusiness.rating,
      review_count: incomingBusiness.reviews || incomingBusiness.review_count,
      reviews_per_score_1: incomingBusiness.reviews_per_score_1,
      created_at: new Date().toISOString(),
    };
  }

  return null;
}
