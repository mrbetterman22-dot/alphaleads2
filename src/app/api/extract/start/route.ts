import { NextResponse } from "next/server";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { keyword, location, limit } = await req.json();
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    // 1. Trigger Outscraper (Async Mode)
    const searchQuery = `${keyword} in ${location}`;
    addLog(`🚀 STARTING JOB: "${searchQuery}"`);

    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(
      searchQuery,
    )}&limit=${limit || 20}&async=true&reviewsLimit=3&reviewsSort=newest&extractEmails=true&extractContacts=true`;

    const response = await fetch(apiUrl, { headers: { "X-API-KEY": apiKey! } });
    const data = await response.json();

    // 2. Return the Request ID immediately
    // We do NOT wait here. We just hand the ID back to the Frontend.
    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
