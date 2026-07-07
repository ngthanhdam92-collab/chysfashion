import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ paid: false });

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("orders")
    .select("paid_at")
    .eq("order_code", code.toUpperCase().trim())
    .maybeSingle();

  return NextResponse.json({ paid: !!data?.paid_at });
}
