// 4. PROCESS & SAVE
const validLeads: any[] = [];
const validPlaceIds: string[] = [];

for (const item of rawResults) {
  // Skip businesses that are closed or missing IDs
  if (!item.place_id || item.business_status === "CLOSED_PERMANENTLY") continue;

  const tags: string[] = [];

  // 🪣 Bucket A: The Website Pitch
  // Logic: No website OR built with cheap builders (Wix/Joomla/Squarespace) OR missing Facebook Pixel
  const isWeakWebsite =
    !item.site ||
    /wix|joomla|squarespace/i.test(item.website_generator || "") ||
    item.website_has_fb_pixel === false;
  if (isWeakWebsite) tags.push("Website Pitch");

  // 🪣 Bucket B: The AI Chatbot Pitch
  // Logic: Has bad reviews (score 1) AND is established (>10 score 5 reviews) AND has a phone number
  if (
    item.reviews_per_score_1 > 0 &&
    item.reviews_per_score_5 > 10 &&
    item.phone
  ) {
    tags.push("AI Chatbot Pitch");
  }

  // 🪣 Bucket C: The Reputation Rescue
  // Logic: Good business (Rating 3.5 - 4.4) with enough volume (>20 reviews) to benefit from automation
  if (item.rating >= 3.5 && item.rating <= 4.4 && item.review_count > 20) {
    tags.push("Reputation Rescue");
  }

  // 🪣 Bucket D: The Quick Flip
  // Logic: Business profile is not verified/claimed on Google
  if (item.verified === false) {
    tags.push("Quick Flip");
  }

  validLeads.push({
    place_id: item.place_id,
    business_name: item.name || "Unknown",
    website: item.site || item.website || null,
    email: item.email_1 || (item.emails && item.emails[0]) || null,
    full_name: item.owner_name || item.email_1_full_name || null,
    city: location,
    phone: item.phone,
    rating: item.rating || 0,
    review_count: item.reviews || 0,
    reviews_per_score_1: item.reviews_per_score_1 || 0,
    reviews_per_score_5: item.reviews_per_score_5 || 0,
    website_generator: item.website_generator || null,
    website_has_fb_pixel: item.website_has_fb_pixel || false,
    is_verified: item.verified || false,
    opportunity_tags: tags, // Saves the buckets we found
    business_status: item.business_status || "OPERATIONAL",
  });

  validPlaceIds.push(item.place_id);
}
