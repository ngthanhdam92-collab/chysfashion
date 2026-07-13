"use server";

import { revalidatePath } from "next/cache";
import type { CartLine } from "./types";
import { createPublicClient } from "./supabase/public";
import { createClient } from "./supabase/server";

export interface AbandonedCart {
  id: string;
  session_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  items: CartLine[];
  subtotal: number;
  recovered: boolean;
  order_code: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Called from checkout page on mount and when contact info changes. */
export async function upsertAbandonedCart(data: {
  sessionId: string;
  items: CartLine[];
  subtotal: number;
  fullName?: string;
  phone?: string;
  email?: string;
}): Promise<void> {
  const supabase = createPublicClient();
  await supabase.from("abandoned_carts").upsert(
    {
      session_id: data.sessionId,
      items: data.items,
      subtotal: data.subtotal,
      full_name: data.fullName || null,
      phone: data.phone || null,
      email: data.email || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" }
  );
}

/** Called when checkout completes successfully. */
export async function recoverAbandonedCart(
  sessionId: string,
  orderCode: string
): Promise<void> {
  const supabase = createPublicClient();
  await supabase
    .from("abandoned_carts")
    .update({
      recovered: true,
      order_code: orderCode,
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);
}

/** Admin: fetch non-recovered carts from the last 30 days. */
export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("abandoned_carts")
    .select("*")
    .eq("recovered", false)
    .gt("updated_at", cutoff)
    .order("updated_at", { ascending: false });
  return (data ?? []) as AbandonedCart[];
}

/** Admin: stamp contacted_at so the cart is marked as followed up. */
export async function markCartContacted(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("abandoned_carts")
    .update({ contacted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/gio-hang-bo");
}
