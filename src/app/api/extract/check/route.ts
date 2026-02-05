import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { requestId } = await req.json();
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    // 1. Check Status
    const statusUrl = `https://api.app.outscraper.com/requests/${requestId}`;
    const response = await fetch(statusUrl, {
      headers: { "X-API-KEY": apiKey! },
    });
    const data = await response.json();

    if (data.status === "PENDING" || data.status === "PROCESSING") {
      return NextResponse.json({ status: "PENDING" });
    }

    // 2. Process Results
    const rawResults = data.data?.[0] || [];
    addLog(`✅ Job Done! Processing ${rawResults.length} leads...`);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "No User" }, { status: 401 });

    const validLeads: any[] = [];
    const validPlaceIds: string[] = [];

    for (const item of rawResults) {
      if (!item.place_id || item.business_status === "CLOSED_PERMANENTLY")
        continue;

      // --- MAPPING HELPERS ---
      let email = item.email_1 || item.email;
      if (!email && Array.isArray(item.emails) && item.emails.length > 0) {
        const firstEntry = item.emails[0];
        email = typeof firstEntry === "string" ? firstEntry : firstEntry?.value;
      }

      let fullName =
        item.owner_name || item.contact_name || item.email_1_full_name;
      if (!fullName && Array.isArray(item.emails) && item.emails.length > 0) {
        const firstEntry = item.emails[0];
        if (typeof firstEntry === "object") fullName = firstEntry.full_name;
      }
      if (!fullName && item.email_1_title) fullName = item.email_1_title;

      // --- CRITICAL FIX: CAPTURE THE DATA POINTS ---
      const oneStar = item.reviews_per_score_1 || 0;
      const fiveStar = item.reviews_per_score_5 || 0;
      const generator = item.site_generator || "";
      const hasPixel = item.site_pixel ? true : false;

      // --- BUCKET LOGIC (Backend Pre-calc) ---
      // We calculate a default bucket here so the DB is never "empty" of status
      let bucket = "Qualified Lead";
      let details = "Good data available.";

      if (item.verified === false) {
        bucket = "Unclaimed Business";
        details = "Google Listing not claimed.";
      } else if (!item.site) {
        bucket = "Needs Website";
        details = "No website found.";
      } else if (oneStar > 0) {
        bucket = "Reputation Repair";
        details = `Has ${oneStar} 1-star reviews.`;
      }

      validLeads.push({
        place_id: item.place_id,
        business_name: item.name || "Unknown",
        website: item.site || item.website || null,
        email: email || null,
        full_name: fullName || null,
        city: item.city || item.borough || "Unknown",
        phone: item.phone,
        rating: item.rating || 0,
        review_count: item.reviews || 0,

        // SAVE THE NEW METRICS (This was missing before!)
        reviews_per_score_1: oneStar,
        reviews_per_score_5: fiveStar,
        website_generator: generator,
        website_has_fb_pixel: hasPixel,
        is_verified: item.verified === false ? false : true,

        bucket_category: bucket,
        bucket_details: details,
        business_status: item.business_status || "OPERATIONAL",
      });
      validPlaceIds.push(item.place_id);
    }

    if (validLeads.length > 0) {
      await supabase
        .from("leads")
        .upsert(validLeads, { onConflict: "place_id", ignoreDuplicates: true });

      const { data: dbLeads } = await supabase
        .from("leads")
        .select("id, place_id")
        .in("place_id", validPlaceIds);

      const userLinks = dbLeads!.map((l) => ({
        user_id: userId,
        lead_id: l.id,
        is_unlocked: false,
      }));
      await supabase
        .from("user_leads")
        .upsert(userLinks, {
          onConflict: "user_id, lead_id",
          ignoreDuplicates: true,
        });
    }

    return NextResponse.json({ status: "SUCCESS", count: validLeads.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
