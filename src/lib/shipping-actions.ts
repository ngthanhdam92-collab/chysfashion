"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

export interface ShippingRuleInput {
  label: string;
  minOrderValue: number;
  fee: number;
  position: number;
}

export async function saveShippingRules(rules: ShippingRuleInput[]) {
  const supabase = await createClient();
  const { error: delErr } = await supabase
    .from("shipping_rules")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) return { error: delErr.message };

  if (rules.length > 0) {
    const { error: insErr } = await supabase.from("shipping_rules").insert(
      rules.map((r, i) => ({
        label: r.label,
        min_order_value: r.minOrderValue,
        fee: r.fee,
        position: i,
      }))
    );
    if (insErr) return { error: insErr.message };
  }

  revalidatePath("/admin/shipping");
  return { success: true };
}
