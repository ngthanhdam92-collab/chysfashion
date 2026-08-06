import { NextResponse, type NextRequest } from "next/server";
import { createOrder, type CreateOrderInput } from "@/lib/orders";
import { createPublicClient } from "@/lib/supabase/public";
import { checkInternalSecret } from "@/lib/internal-api-auth";

// Create an order from CHYS Chat. The website is the source of truth.
// Idempotent by order_code so a retry never creates a duplicate.
export async function POST(req: NextRequest) {
  const denied = checkInternalSecret(req);
  if (denied) return denied;

  const body = (await req.json()) as CreateOrderInput;
  const supabase = createPublicClient();

  if (body.orderCode) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id, order_code")
      .eq("order_code", body.orderCode)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        orderId: existing.id,
        orderCode: existing.order_code,
      });
    }
  }

  const result = await createOrder(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("order_code", result.orderCode)
    .maybeSingle();

  return NextResponse.json({ orderId: data?.id ?? null, orderCode: result.orderCode });
}
