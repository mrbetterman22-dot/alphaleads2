import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { query, location } = await req.json();
  const apiKey = process.env.OUTSCRAPER_API_KEY;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const response = await fetch(
      `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(query + " in " + location)}&limit=10`,
      { headers: { "X-API-KEY": apiKey || "" } },
    );
    const data = await response.json();
    const results = data.results?.[0] || [];

    // Mapping Outscraper to YOUR specific table columns
    const leadsToInsert = results.map((item: any) => ({
      business_name: item.name,
      place_id: item.place_id,
      email: item.email || null,
      // Logic: If rating is low, tag it as a 'Pain Point' for your agency
      opportunity_tag: item.rating < 4.1 ? "pain-point" : "fresh-blood",
      is_unlocked: false,
      // For now, we leave monitor_id null or link it to a default
    }));

    const { error } = await supabase.from("leads").insert(leadsToInsert);

    if (error) throw error;
    return NextResponse.json({ success: true, count: leadsToInsert.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
