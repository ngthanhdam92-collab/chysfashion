"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

export interface CostEntry {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string | null;
  orderCode: string | null;
  createdAt: string;
}

interface CostRow {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string | null;
  order_code: string | null;
  created_at: string;
}

function mapCostRow(row: CostRow): CostEntry {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? null,
    orderCode: row.order_code ?? null,
    createdAt: row.created_at,
  };
}

export async function getCostEntries(from: string, to: string): Promise<CostEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cost_entries")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as CostRow[]).map(mapCostRow);
}

// Ad costs: one entry per day per channel (upsert pattern)
export async function addCostEntry(
  date: string,
  category: string,
  amount: number,
  note?: string,
) {
  if (amount <= 0) return { error: "Số tiền phải lớn hơn 0" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("cost_entries")
    .insert({ date, category, amount: Number(amount), note: note || null });
  if (error) return { error: error.message };
  revalidatePath("/admin/chi-phi");
  revalidatePath("/admin/analytics");
  return { success: true };
}

export async function deleteCostEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cost_entries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/chi-phi");
  revalidatePath("/admin/analytics");
  return { success: true };
}

export async function saveAdCost(
  date: string,
  channel: "facebook" | "zalo" | "tiktok",
  amount: number,
  note?: string,
) {
  const supabase = await createClient();
  const category = `ad_${channel}`;

  const { data: existing } = await supabase
    .from("cost_entries")
    .select("id")
    .eq("date", date)
    .eq("category", category)
    .is("order_code", null)
    .maybeSingle();

  if (existing) {
    if (amount <= 0) {
      await supabase.from("cost_entries").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("cost_entries")
        .update({ amount, note: note || null })
        .eq("id", existing.id);
    }
  } else if (amount > 0) {
    await supabase
      .from("cost_entries")
      .insert({ date, category, amount, note: note || null });
  }

  revalidatePath("/admin/chi-phi");
  revalidatePath("/admin/analytics");
  return { success: true };
}

