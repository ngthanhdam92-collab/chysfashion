"use server";

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
  total: number;
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
    total: Number(row.total),
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
  total: number;
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
    total: input.total,
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
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
