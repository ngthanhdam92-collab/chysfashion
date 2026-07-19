import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Verify secret token
  const auth = req.headers.get("authorization");
  const secret = process.env.MAKE_WEBHOOK_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const date: string = body.date;
  const spend: number = Number(body.spend);

  if (!date || isNaN(spend)) {
    return NextResponse.json({ error: "Invalid payload: date and spend required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const category = "ad_tiktok";

  // Upsert: update existing entry for this date, or insert new
  const { data: existing } = await supabase
    .from("cost_entries")
    .select("id")
    .eq("date", date)
    .eq("category", category)
    .is("order_code", null)
    .maybeSingle();

  if (existing) {
    if (spend <= 0) {
      await supabase.from("cost_entries").delete().eq("id", existing.id);
    } else {
      await supabase.from("cost_entries").update({ amount: spend, note: "TikTok Ads (auto)" }).eq("id", existing.id);
    }
  } else if (spend > 0) {
    await supabase.from("cost_entries").insert({ date, category, amount: spend, note: "TikTok Ads (auto)" });
  }

  return NextResponse.json({ success: true, date, spend });
}
