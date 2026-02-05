import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addLog } from "@/lib/logger";

// Helper: Wait function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // 1. Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const { keyword, location, limit } = await req.json();
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    // 2. START THE JOB (Async Mode)
    // We set 'async=true'. Outscraper will return a Request ID immediately, not the data.
    const searchQuery = `${keyword} in ${location}`;
    addLog(`------------------------------------------------`);
    addLog(`🚀 STARTING DEEP SCAN: "${searchQuery}"`);
    addLog(`⏳ This will take time (visiting websites for Names/Emails)...`);

    const startUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(
      searchQuery,
    )}&limit=${limit || 20}&async=true&reviewsLimit=3&reviewsSort=newest&extractEmails=true&extractContacts=true`;

    const startResponse = await fetch(startUrl, {
      headers: { "X-API-KEY": apiKey! },
    });
    const startData = await startResponse.json();

    // Get the Request ID (The Ticket)
    const requestId = startData.id;
    addLog(`🎫 Job Started! ID: ${requestId}. Waiting for results...`);

    // 3. THE WAITING ROOM (Polling Loop)
    let isFinished = false;
    let rawResults: any[] = [];
    let attempts = 0;

    while (!isFinished) {
      // Wait 5 seconds before checking
      await sleep(5000);
      attempts++;

      // Ask Outscraper: "Are you done?"
      const statusUrl = `https://api.app.outscraper.com/requests/${requestId}`;
      const statusResponse = await fetch(statusUrl, {
        headers: { "X-API-KEY": apiKey! },
      });
      const statusData = await statusResponse.json();

      if (statusData.status === "SUCCESS") {
        isFinished = true;
        rawResults = statusData.data?.[0] || [];
        addLog(`✅ Job Complete! Downloaded ${rawResults.length} leads.`);
      } else {
        // Still working... log a dot every 5 attempts to keep console clean
        if (attempts % 2 === 0)
          addLog(`... scanning websites (${attempts * 5}s elapsed)`);
      }

      // Safety Break (Stop after 5 minutes to prevent infinite hangs)
      if (attempts > 60) {
        throw new Error("Timeout: Scrape took too long (>5 mins).");
      }
    }

    // 4. PROCESS & SAVE (Same Logic as Before)
    const validLeads: any[] = [];
    const validPlaceIds: string[] = [];

    for (const item of rawResults) {
      if (!item.place_id || item.business_status === "CLOSED_PERMANENTLY")
        continue;

      // MAPPING
      const businessName = item.name || "Unknown";
      const website = item.site || item.website || null;
      const email = item.email_1 || (item.emails && item.emails[0]) || null;

      // Try hard to find the Name
      let fullName =
        item.owner_name || item.email_1_full_name || item.contact_name || null;

      if (!fullName && item.email_1_title) fullName = item.email_1_title;

      // BUCKET LOGIC
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
        email: email,
        full_name: fullName,
        city: location,
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

    if (validLeads.length === 0)
      return NextResponse.json({ success: true, count: 0 });

    // SAVE TO DB
    const { error: upsertError } = await supabase
      .from("leads")
      .upsert(validLeads, { onConflict: "place_id", ignoreDuplicates: true });

    if (upsertError) throw upsertError;

    const { data: dbLeads } = await supabase
      .from("leads")
      .select("id, place_id")
      .in("place_id", validPlaceIds);

    const userLinks = dbLeads!.map((lead) => ({
      user_id: userId,
      lead_id: lead.id,
      is_unlocked: false,
    }));

    await supabase
      .from("user_leads")
      .upsert(userLinks, {
        onConflict: "user_id, lead_id",
        ignoreDuplicates: true,
      });

    addLog(`📦 Data Saved to Supabase!`);

    return NextResponse.json({ success: true, count: validLeads.length });
  } catch (error: any) {
    addLog(`❌ ERROR: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
