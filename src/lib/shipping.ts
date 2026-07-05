import { createPublicClient } from "./supabase/public";

export interface ShippingRule {
  id: string;
  label: string;
  minOrderValue: number;
  fee: number;
  position: number;
}

interface ShippingRuleRow {
  id: string;
  label: string;
  min_order_value: number;
  fee: number;
  position: number;
}

function mapRow(r: ShippingRuleRow): ShippingRule {
  return {
    id: r.id,
    label: r.label,
    minOrderValue: r.min_order_value,
    fee: r.fee,
    position: r.position,
  };
}

export async function getShippingRules(): Promise<ShippingRule[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("shipping_rules")
    .select("*")
    .order("position", { ascending: true });
  if (error || !data) return [];
  return (data as ShippingRuleRow[]).map(mapRow);
}

export function calcShippingFee(subtotal: number, rules: ShippingRule[]): number {
  if (rules.length === 0) return subtotal >= 500000 ? 0 : 30000;
  const sorted = [...rules].sort((a, b) => b.minOrderValue - a.minOrderValue);
  const match = sorted.find((r) => subtotal >= r.minOrderValue);
  return match ? match.fee : sorted[sorted.length - 1].fee;
}
