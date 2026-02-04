// src/app/api/extract/route.ts
import { NextRequest, NextResponse } from "next/server";
import { identifyLead } from "@/lib/data";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // 1. Outscraper sends the 'results' here
    const results = data.results || [];

    // 2. We would normally fetch the "History" from your Database here
    const history: any[] = [];

    // 3. Compare and find leads
    const newLeads = results
      .map((bus: any) => identifyLead(bus, history))
      .filter(Boolean);

    // 4. Send back a success message
    return NextResponse.json({
      message: "Data processed successfully",
      leadsFound: newLeads.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process data" },
      { status: 500 },
    );
  }
}
