import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json(); // We ignore 'limit' from frontend to be safe

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const COST = 10; // CTO FIX: Hardcoded cost
    const LIMIT = 10; // CTO FIX: Hardcoded limit

    // 1. CHECK CREDITS
    const { data: user } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (!user || user.credits < COST) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // 2. DEDUCT CREDITS
    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: user.credits - COST })
      .eq("id", userId);

    if (updateError) throw new Error("Failed to deduct credits");

    // 3. START JOB
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    const searchQuery = `${keyword} in ${location}`;
    addLog(`🚀 STARTING JOB: "${searchQuery}" (-${COST} credits)`);

    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(
      searchQuery,
    )}&limit=${LIMIT}&async=true&reviewsLimit=3&reviewsSort=newest&extractEmails=true&extractContacts=true&emailValidation=true`;

    const response = await fetch(apiUrl, { headers: { "X-API-KEY": apiKey! } });
    const data = await response.json();

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
