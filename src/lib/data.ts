/// src/lib/data.ts
import { Lead } from "./types";

export function identifyLead(
  incomingBusiness: any,
  history: Lead[],
): Lead | null {
  const exists = history.find((h) => h.place_id === incomingBusiness.place_id);

  if (!exists) {
    return {
      id: crypto.randomUUID(),
      monitor_id: incomingBusiness.monitor_id, // Match DB
      place_id: incomingBusiness.place_id, // Match DB
      business_name: incomingBusiness.name, // Match DB
      opportunity_type: "New Business", // Match DB
      is_unlocked: false, // Match DB
      created_at: new Date().toISOString(),
    };
  }

  // Pain Point Logic
  if (
    incomingBusiness.rating < 3 &&
    incomingBusiness.reviews_count > (exists as any).reviews_count
  ) {
    return {
      id: crypto.randomUUID(),
      monitor_id: incomingBusiness.monitor_id,
      place_id: incomingBusiness.place_id,
      business_name: incomingBusiness.name,
      opportunity_type: "Bad Review",
      is_unlocked: false,
      created_at: new Date().toISOString(),
    };
  }

  return null;
}
