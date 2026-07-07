"use server";

import { revalidatePath } from "next/cache";
import { Order, OrderItem, OrderStatus } from "./types";
import { createPublicClient } from "./supabase/public";
import { createClient } from "./supabase/server";

interface OrderRow {
  id: string;
  order_code: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  note: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promo_code: string | null;
  payment_method: "cod" | "bank_transfer" | null;
  paid_at: string | null;
  status: OrderStatus;
  created_at: string;
}

function mapRow(row: OrderRow): Order {
  return {
    id: row.id,
    orderCode: row.order_code,
    fullName: row.full_name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    note: row.note,
    items: row.items,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount ?? 0),
    total: Number(row.total),
    promoCode: row.promo_code ?? null,
    paymentMethod: row.payment_method ?? "cod",
    paidAt: row.paid_at ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface CreateOrderInput {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promoCode?: string;
  paymentMethod?: "cod" | "bank_transfer";
  orderCode?: string;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ orderCode: string } | { error: string }> {
  const supabase = createPublicClient();
  const orderCode = input.orderCode || `CHYS${Date.now().toString().slice(-8)}`;

  // Check if customer already transferred before placing the order
  const { data: pending } = await supabase
    .from("pending_payments")
    .select("paid_at")
    .eq("order_code", orderCode)
    .maybeSingle();

  const { error } = await supabase.from("orders").insert({
    order_code: orderCode,
    full_name: input.fullName,
    phone: input.phone,
    address: input.address,
    city: input.city,
    note: input.note || null,
    items: input.items,
    subtotal: input.subtotal,
    shipping: input.shipping,
    discount: input.discount,
    total: input.total,
    promo_code: input.promoCode || null,
    payment_method: input.paymentMethod ?? "cod",
    // If payment already received, stamp paid_at right in the INSERT
    ...(pending ? { paid_at: pending.paid_at, status: "dang_xu_ly" } : {}),
  });

  if (error) {
    console.error("createOrder error:", error.message);
    return { error: "Không thể tạo đơn hàng, vui lòng thử lại." };
  }

  // Clean up pending record
  if (pending) {
    await supabase.from("pending_payments").delete().eq("order_code", orderCode);
  }

  return { orderCode };
}

export async function getAllOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as OrderRow[]).map(mapRow);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapRow(data as OrderRow);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getOrderByCode(
  orderCode: string
): Promise<Order | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", orderCode.toUpperCase().trim())
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as OrderRow);
}

export async function updateOrderCustomerInfo(
  id: string,
  data: { phone: string; address: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ phone: data.phone, address: data.address })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/orders/${id}`);
  return { success: true };
}

export async function updateOrderFull(
  id: string,
  data: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    note: string;
    shipping: number;
    discount: number;
  }
) {
  const supabase = await createClient();
  // Re-fetch subtotal to recompute total correctly
  const { data: row } = await supabase
    .from("orders")
    .select("subtotal")
    .eq("id", id)
    .maybeSingle();
  const subtotal = Number((row as { subtotal: number } | null)?.subtotal ?? 0);
  const total = Math.max(0, subtotal - data.discount + data.shipping);

  const { error } = await supabase
    .from("orders")
    .update({
      full_name: data.fullName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      note: data.note || null,
      shipping: data.shipping,
      discount: data.discount,
      total,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function deleteOrder(id: string) {
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("orders")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) return { error: error.message };
  if (count === 0) return { error: "Không thể xóa đơn — bảng orders chưa có RLS DELETE policy. Xem hướng dẫn bên dưới." };
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true };
}

export async function markOrderPaid(orderCode: string) {
  const code = orderCode.toUpperCase().trim();
  const paidAt = new Date().toISOString();
  const supabase = await createClient();

  // Try to update the order directly
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("order_code", code)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("orders")
      .update({ paid_at: paidAt, status: "dang_xu_ly" })
      .eq("order_code", code)
      .is("paid_at", null);
    if (error) return { error: error.message };
  } else {
    // Order not placed yet — store payment so createOrder can pick it up later
    const { error } = await supabase
      .from("pending_payments")
      .upsert({ order_code: code, paid_at: paidAt }, { onConflict: "order_code" });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return { success: true };
}
