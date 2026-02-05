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

    // CASE A: Still Working
    if (data.status === "PENDING" || data.status === "PROCESSING") {
      return NextResponse.json({ status: "PENDING" });
    }

    // CASE B: Finished!
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

      // --- 1. SMART EMAIL MAPPING (The Fix) ---
      let email = item.email_1 || item.email; // Try simple strings first

      // If simple strings failed, check the array
      if (!email && Array.isArray(item.emails) && item.emails.length > 0) {
        const firstEntry = item.emails[0];
        if (typeof firstEntry === "string") {
          email = firstEntry; // It's just "test@test.com"
        } else if (typeof firstEntry === "object" && firstEntry.value) {
          email = firstEntry.value; // It's { value: "test@test.com" }
        }
      }

      // --- 2. SMART NAME MAPPING ---
      let fullName =
        item.owner_name || item.contact_name || item.email_1_full_name;

      // Sometimes the name is hiding in the email array too
      if (!fullName && Array.isArray(item.emails) && item.emails.length > 0) {
        const firstEntry = item.emails[0];
        if (typeof firstEntry === "object" && firstEntry.full_name) {
          fullName = firstEntry.full_name;
        }
      }

      // Fallback: If we still have no name, but we have a title (e.g. "Manager"), use that
      if (!fullName && item.email_1_title) fullName = item.email_1_title;

      // --- 3. BUCKET LOGIC ---
      const businessName = item.name || "Unknown";
      const website = item.site || item.website || null;
      let bucket = null;
      let details = "";
      const rating = item.rating || 0;
      const reviews = item.reviews || 0;
      const verified = item.verified || false;

      if (!verified) {
        bucket = "Unclaimed Business";
        details = "Not verified on Google.";
      } else if (rating > 0 && rating < 4.2) {
        bucket = "Reputation Repair";
        details = `Low Rating: ${rating}`;
      } else if (!website) {
        bucket = "Needs Website";
        details = "No website found.";
      } else if (website && !email) {
        bucket = "Contact Difficult";
        details = "Has site but no email.";
      } else {
        bucket = "Qualified Lead";
        details = "Good data available.";
      }

      validLeads.push({
        place_id: item.place_id,
        business_name: businessName,
        website: website,
        email: email || null, // The fixed email
        full_name: fullName || null, // The fixed name
        city: item.city || item.borough || "Unknown",
        phone: item.phone,
        rating: rating,
        review_count: reviews,
        bucket_category: bucket,
        bucket_details: details,
        business_status: item.business_status || "OPERATIONAL",
        linkedin: item.linkedin_profile || item.linkedin || null,
        email_status: email ? "VALID" : "UNKNOWN",
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
