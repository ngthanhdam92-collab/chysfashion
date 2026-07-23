"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { requireAdmin } from "./admin-guard";

export interface ReturnRecord {
  id: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  returnDate: string;
  returnCost: number;
  notes: string | null;
  createdAt: string;
}

export interface ReturnItem {
  productId: string;
  name: string;
  color: string;
  size: string;
  quantity: number;
}

export interface CreateReturnInput {
  orderId: string;
  orderCode: string;
  customerName: string;
  returnDate: string;
  returnedItems: ReturnItem[];
  returnCost: number;
  notes?: string;
}

async function incrementVariantStock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  color: string,
  size: string,
  qty: number
) {
  const { data } = await supabase
    .from("products")
    .select("variants, stock")
    .eq("id", productId)
    .single();
  if (!data) return;

  const hasVariants = color !== "—" && size !== "—";
  if (hasVariants) {
    const variants = (
      (data.variants as { color: string; size: string; stock: number; [k: string]: unknown }[]) ?? []
    ).map((v) =>
      v.color === color && v.size === size
        ? { ...v, stock: Math.max(0, (v.stock || 0) + qty) }
        : v
    );
    const totalStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
    await supabase.from("products").update({ variants, stock: totalStock }).eq("id", productId);
  } else {
    await supabase
      .from("products")
      .update({ stock: Math.max(0, (data.stock as number) + qty) })
      .eq("id", productId);
  }
}

export async function createReturnRecord(
  input: CreateReturnInput
): Promise<{ success: true } | { error: string }> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const supabase = await createClient();

  // Guard: order must not already be da_hoan
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("status")
    .eq("id", input.orderId)
    .single();
  if (existingOrder?.status === "da_hoan") {
    return { error: "Đơn này đã được ghi nhận hoàn trước đó." };
  }

  // 1. Increment stock for each returned item
  for (const item of input.returnedItems) {
    await incrementVariantStock(supabase, item.productId, item.color, item.size, item.quantity);
  }

  // 2. Mark order as da_hoan
  await supabase.from("orders").update({ status: "da_hoan" }).eq("id", input.orderId);

  // 3. Insert return record
  const { error } = await supabase.from("return_records").insert({
    order_id: input.orderId,
    order_code: input.orderCode,
    customer_name: input.customerName,
    return_date: input.returnDate,
    return_cost: input.returnCost,
    notes: input.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/hoan-hang");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true };
}

export async function getReturnRecords(from?: string, to?: string): Promise<ReturnRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from("return_records")
    .select("*")
    .order("return_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (from) query = query.gte("return_date", from);
  if (to) query = query.lte("return_date", to);
  const { data } = await query;
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    orderId: r.order_id,
    orderCode: r.order_code,
    customerName: r.customer_name,
    returnDate: r.return_date,
    returnCost: Number(r.return_cost),
    notes: r.notes ?? null,
    createdAt: r.created_at,
  }));
}

export async function deleteReturnRecord(
  id: string
): Promise<{ success: true } | { error: string }> {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  const supabase = await createClient();
  const { error } = await supabase.from("return_records").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/hoan-hang");
  return { success: true };
}
