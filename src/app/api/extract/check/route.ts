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

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "No User" }, { status: 401 });

    const validLeads: any[] = [];
    const validPlaceIds: string[] = [];

    // --- FILTER LOOP ---
    for (const item of rawResults) {
      // STRICTER FILTER: Must have place_id AND a name
      if (
        !item.place_id ||
        !item.name ||
        item.business_status === "CLOSED_PERMANENTLY"
      )
        continue;

      // ... (Rest of your Email/Bucket Logic remains the same) ...
      // I am condensing the middle part for brevity, assume the logic we built previously is here.
      // Copy the logic from previous steps or just use this improved structure:

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
      if (Array.isArray(item.emails))
        item.emails.forEach((e: any) => {
          const c = getEmailString(e);
          if (c) allEmails.push(c);
        });
      const uniqueEmails = [...new Set(allEmails)];
      const personalEmail = uniqueEmails.find(
        (e) => !genericPrefixes.includes(e.split("@")[0].toLowerCase()),
      );
      email = personalEmail || uniqueEmails[0] || null;

      // Metrics
      const oneStar = item.reviews_per_score_1 || 0;
      const fiveStar = item.reviews_per_score_5 || 0;
      const isVerified = item.verified !== false;

      // Buckets
      let bucket = "Qualified Lead";
      let details = "Good data available.";
      if (!isVerified) {
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
        business_name: item.name,
        website: item.site || item.website || null,
        email: email,
        full_name: item.owner_name || null,
        city: item.city || "Unknown",
        phone: item.phone,
        rating: item.rating || 0,
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

    // --- CTO FIX: REFUND IF VALID LEADS IS ZERO ---
    // (Even if Outscraper sent 1 junk result, we count it as zero)
    if (validLeads.length === 0) {
      addLog(`⚠️ Results were empty or junk. Refunding User.`);

      // REFUND 10 CREDITS
      const { data: user } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (user) {
        await supabase
          .from("users")
          .update({ credits: user.credits + 10 })
          .eq("id", userId);
      }

      return NextResponse.json({ status: "ZERO_RESULTS" });
    }

    // 3. Save Valid Leads
    if (validLeads.length > 0) {
      addLog(`✅ Saving ${validLeads.length} valid leads...`);

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

      await supabase.from("user_leads").upsert(userLinks, {
        onConflict: "user_id, lead_id",
        ignoreDuplicates: true,
      });
    }

    return NextResponse.json({ status: "SUCCESS", count: validLeads.length });
  } catch (error: any) {
    console.error("Check Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
