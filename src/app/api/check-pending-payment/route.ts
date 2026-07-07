import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ found: false });

  const supabase = await createClient();
  const { data } = await supabase
    .from("pending_payments")
    .select("order_code")
    .eq("order_code", code.toUpperCase().trim())
    .maybeSingle();

  return NextResponse.json({ found: !!data });
}
