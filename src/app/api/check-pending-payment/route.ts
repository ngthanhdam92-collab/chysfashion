import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ found: false });

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("pending_payments")
    .select("order_code")
    .eq("order_code", code.toUpperCase().trim())
    .maybeSingle();

  return NextResponse.json({ found: !!data });
}
