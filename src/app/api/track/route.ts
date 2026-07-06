import { NextRequest, NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

const ALLOWED_EVENTS = new Set(["page_view", "add_to_cart"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, session_id, page_path, referrer, product_id, utm_source, utm_medium, utm_campaign } = body;

    if (
      !ALLOWED_EVENTS.has(event_type) ||
      typeof session_id !== "string" ||
      session_id.length < 5 ||
      session_id.length > 60
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createPublicClient();
    await supabase.from("analytics_events").insert({
      event_type,
      session_id,
      page_path:    typeof page_path    === "string" ? page_path.slice(0, 200)    : null,
      referrer:     typeof referrer     === "string" ? referrer.slice(0, 500)     : null,
      product_id:   typeof product_id   === "string" ? product_id.slice(0, 100)   : null,
      utm_source:   typeof utm_source   === "string" ? utm_source.slice(0, 100)   : null,
      utm_medium:   typeof utm_medium   === "string" ? utm_medium.slice(0, 100)   : null,
      utm_campaign: typeof utm_campaign === "string" ? utm_campaign.slice(0, 200) : null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
