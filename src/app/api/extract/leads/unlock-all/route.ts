import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { leadIds } = await req.json();
    const cost = leadIds?.length || 0;

    if (cost === 0) return NextResponse.json({ success: true });

    // 1. Auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    // 2. Credits
    const { data: user } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();
    if (!user || user.credits < cost) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // 3. Deduct
    const { error: creditError } = await supabase
      .from("users")
      .update({ credits: user.credits - cost })
      .eq("id", userId);
    if (creditError) throw new Error("Payment failed");

    // 4. Unlock
    const unlockEntries = leadIds.map((id: string) => ({
      user_id: userId,
      lead_id: id,
      is_unlocked: true,
    }));

    const { error: unlockError } = await supabase
      .from("user_leads")
      .upsert(unlockEntries, { onConflict: "user_id, lead_id" });
    if (unlockError) throw unlockError;

    return NextResponse.json({ success: true, count: cost });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
