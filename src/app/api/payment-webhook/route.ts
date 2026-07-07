import { NextRequest, NextResponse } from "next/server";
import { markOrderPaid } from "@/lib/orders";

// Extract order code (CHYS + 8 digits) from transfer description
function extractOrderCode(text: string): string | null {
  const match = text.match(/CHYS\d{8}/i);
  return match ? match[0].toUpperCase() : null;
}

// Verify shared secret — Sepay sends as body.apiKey, Casso sends as body.secure_token
function isAuthorized(body: Record<string, unknown>, req: NextRequest): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured = allow all (dev mode)
  const received =
    (body.apiKey as string | undefined) ||
    (body.secure_token as string | undefined) ||
    req.headers.get("x-api-key") ||
    "";
  return received === secret;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isAuthorized(body, req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Collect all transaction descriptions to process
  const descriptions: string[] = [];

  if (Array.isArray(body.data)) {
    // Casso format: { data: [{ description, amount, ... }] }
    for (const tx of body.data as Record<string, unknown>[]) {
      const desc = String(tx.description ?? tx.content ?? "");
      if (desc) descriptions.push(desc);
    }
  } else {
    // Sepay format: { content, transferType, transferAmount, ... }
    if (body.transferType && body.transferType !== "in") {
      // Ignore outgoing transfers
      return NextResponse.json({ success: true, message: "Skipped outgoing transfer" });
    }
    const desc = String(body.content ?? body.description ?? "");
    if (desc) descriptions.push(desc);
  }

  const results: { orderCode: string; updated: number }[] = [];

  for (const desc of descriptions) {
    const orderCode = extractOrderCode(desc);
    if (!orderCode) continue;
    const result = await markOrderPaid(orderCode);
    if ("success" in result) {
      results.push({ orderCode, updated: 1 });
    }
  }

  return NextResponse.json({ success: true, results });
}
