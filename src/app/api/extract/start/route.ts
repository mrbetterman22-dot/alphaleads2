import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // --- PRODUCTION ECONOMY SETTINGS ---
    const COST = 100; // Cost per scan
    const LIMIT = 200; // Max leads scraped per scan (THE 200 LIMIT)
    const MAX_SCANS = 10; // Hard limit scans per month
    const MONTHLY_CREDITS = 3000; // Reset amount

    // 1. GET USER DATA
    const { data: user } = await supabase
      .from("users")
      .select("credits, scans_this_month, billing_start_date")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. LAZY RESET LOGIC (New Month Check)
    const now = new Date();
    const billingStart = new Date(user.billing_start_date);
    const oneMonthLater = new Date(billingStart);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    let currentScanCount = user.scans_this_month;
    let currentCredits = user.credits;

    if (now >= oneMonthLater) {
      // ✅ IT'S A NEW MONTH! REFILL & RESET
      await supabase
        .from("users")
        .update({
          scans_this_month: 0,
          credits: MONTHLY_CREDITS,
          billing_start_date: now.toISOString(),
        })
        .eq("id", userId);

      currentScanCount = 0;
      currentCredits = MONTHLY_CREDITS;
    }

    // 3. MONTHLY LIMIT CHECK
    if (currentScanCount >= MAX_SCANS) {
      return NextResponse.json(
        {
          error: `Monthly limit reached (${MAX_SCANS}/${MAX_SCANS}). Resets on ${oneMonthLater.toLocaleDateString()}.`,
        },
        { status: 403 },
      );
    }

    // 4. CREDIT BALANCE CHECK
    if (currentCredits < COST) {
      return NextResponse.json(
        { error: `Insufficient credits. This scan costs ${COST} credits.` },
        { status: 402 },
      );
    }

    // 5. TRANSACTION (Deduct Credits + Increment Count)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        credits: currentCredits - COST,
        scans_this_month: currentScanCount + 1,
      })
      .eq("id", userId);

    if (updateError) throw new Error("Failed to process transaction");

    // 6. EXECUTE SCRAPE
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    const searchQuery = `${keyword} in ${location}`;
    addLog(`🚀 STARTING JOB: "${searchQuery}" (-${COST} credits)`);

    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(
      searchQuery,
    )}&limit=${LIMIT}&async=true&reviewsLimit=3&reviewsSort=newest&extractEmails=true&extractContacts=true&emailValidation=true`;

    const response = await fetch(apiUrl, { headers: { "X-API-KEY": apiKey! } });
    const data = await response.json();

    if (!data.id) {
      // Refund if API call fails immediately
      await supabase
        .from("users")
        .update({
          credits: currentCredits,
          scans_this_month: currentScanCount,
        })
        .eq("id", userId);

      throw new Error("Outscraper API Failed. Credits Refunded.");
    }

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    console.error("Start Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
