import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { leadId } = await req.json();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Check current credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 },
      );
    }

    // 2. Deduct 1 credit from Profile
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", session.user.id);

    // 3. Mark Lead as Unlocked
    const { error } = await supabase
      .from("leads")
      .update({ is_unlocked: true })
      .eq("id", leadId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
