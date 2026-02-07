import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const REFUND_AMOUNT = 100;

  try {
    const { requestId } = await req.json();
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    // 1. Check Status
    const statusUrl = `https://api.app.outscraper.com/requests/${requestId}`;
    const response = await fetch(statusUrl, {
      headers: { "X-API-KEY": apiKey! },
    });
    const data = await response.json();

    if (data.status === "PENDING" || data.status === "Processing") {
      return NextResponse.json({ status: "PENDING" });
    }

    // 2. Process Results
    const rawResults = data.data?.flat() || [];
    const totalScanned = rawResults.length; // <--- METRIC 1: TOTAL FOUND

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "No User" }, { status: 401 });

    const validLeads: any[] = [];
    const validPlaceIds: string[] = [];

    // --- CTO LOGIC: SNIPER FILTER ---
    for (const item of rawResults) {
      if (
        !item.place_id ||
        !item.name ||
        item.business_status === "CLOSED_PERMANENTLY"
      ) {
        continue;
      }

      // SNIPER FILTER (Discard "Perfect" Businesses)
      const isVerified = item.verified !== false;
      const hasWebsite = !!(item.site || item.website);
      const rating = item.rating || 0;

      if (rating >= 4.5 && hasWebsite && isVerified) {
        continue; // <--- DISCARD (Too perfect)
      }

      // ... (Email Extraction Logic) ...
      let email = null;
      const genericPrefixes = [
        "info",
        "contact",
        "support",
        "admin",
        "sales",
        "hello",
      ];
      const getEmailString = (e: any) =>
        typeof e === "string" ? e : e?.value || null;
      const allEmails: string[] = [];

      if (item.email_1) allEmails.push(item.email_1);
      if (item.email_2) allEmails.push(item.email_2);
      if (Array.isArray(item.emails)) {
        item.emails.forEach((e: any) => {
          const c = getEmailString(e);
          if (c) allEmails.push(c);
        });
      }

      const uniqueEmails = [...new Set(allEmails)];
      const personalEmail = uniqueEmails.find(
        (e) => !genericPrefixes.includes(e.split("@")[0].toLowerCase()),
      );
      email = personalEmail || uniqueEmails[0] || null;

      // Buckets
      let bucket = "Qualified Lead";
      let details = "Standard Opportunity";
      const oneStar = item.reviews_per_score_1 || 0;
      const fiveStar = item.reviews_per_score_5 || 0;

      if (!isVerified) {
        bucket = "Unclaimed Business";
        details = "Google Profile not claimed.";
      } else if (!hasWebsite) {
        bucket = "Needs Website";
        details = "No website detected.";
      } else if (rating < 4.5 || oneStar > 0) {
        bucket = "Reputation Repair";
        details =
          oneStar > 0
            ? `Has ${oneStar} 1-star reviews.`
            : `Low rating (${rating}).`;
      }

      validLeads.push({
        place_id: item.place_id,
        business_name: item.name,
        website: item.site || item.website || null,
        email: email,
        full_name: item.owner_name || null,
        city: item.city || "Unknown",
        phone: item.phone,
        rating: rating,
        review_count: item.reviews || 0,
        reviews_per_score_1: oneStar,
        reviews_per_score_5: fiveStar,
        website_generator: item.site_generator,
        website_has_fb_pixel: !!item.site_pixel,
        is_verified: isVerified,
        bucket_category: bucket,
        bucket_details: details,
        business_status: "OPERATIONAL",
      });
      validPlaceIds.push(item.place_id);
    }

    // 3. REFUND LOGIC (Enhanced Diagnostics)
    if (validLeads.length === 0) {
      addLog(`⚠️ 0 Qualified Leads. Scanned: ${totalScanned}. Refunding.`);

      const { data: user } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (user) {
        await supabase
          .from("users")
          .update({ credits: user.credits + REFUND_AMOUNT })
          .eq("id", userId);
      }

      // DIAGNOSIS: Why was it 0?
      let reason = "NO_DATA";
      if (totalScanned > 0) {
        reason = "MARKET_SATURATED"; // Found leads, but all were perfect
      }

      return NextResponse.json({
        status: "ZERO_RESULTS",
        scanned: totalScanned, // <--- PASS DATA TO FRONTEND
        reason: reason,
      });
    }

    // 4. SAVE LEADS
    addLog(`✅ Saving ${validLeads.length} leads...`);

    const { error: upsertError } = await supabase
      .from("leads")
      .upsert(validLeads, { onConflict: "place_id" });

    if (upsertError) throw upsertError;

    // Link to User
    const { data: dbLeads } = await supabase
      .from("leads")
      .select("id")
      .in("place_id", validPlaceIds);

    if (dbLeads) {
      const userLinks = dbLeads.map((l) => ({
        user_id: userId,
        lead_id: l.id,
        is_unlocked: false,
      }));

      await supabase
        .from("user_leads")
        .upsert(userLinks, { onConflict: "user_id, lead_id" });
    }

    return NextResponse.json({
      status: "SUCCESS",
      count: validLeads.length,
      scanned: totalScanned,
    });
  } catch (error: any) {
    console.error("Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
