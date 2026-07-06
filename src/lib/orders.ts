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
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ orderCode: string } | { error: string }> {
  const supabase = createPublicClient();
  const orderCode = `CHYS${Date.now().toString().slice(-8)}`;

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
  });

  if (error) {
    console.error("createOrder error:", error.message);
    return { error: "Không thể tạo đơn hàng, vui lòng thử lại." };
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
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { success: true };
}
