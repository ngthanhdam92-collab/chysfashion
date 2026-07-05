import { createPublicClient } from "./supabase/public";

export type PromotionType = "percentage" | "fixed" | "free_shipping";
export type AppliesTo = "all" | "category" | "product";

export interface Promotion {
  id: string;
  code: string;
  name: string;
  type: PromotionType;
  value: number;
  minOrderValue: number;
  appliesTo: AppliesTo;
  categoryValue: string | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PromotionRow {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  min_order_value: number;
  applies_to: string;
  category_value: string | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function mapRow(r: PromotionRow): Promotion {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    type: r.type as PromotionType,
    value: r.value,
    minOrderValue: r.min_order_value,
    appliesTo: (r.applies_to as AppliesTo) ?? "all",
    categoryValue: r.category_value,
    usageLimit: r.usage_limit,
    usedCount: r.used_count,
    expiresAt: r.expires_at,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export async function getPromotions(): Promise<Promotion[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as PromotionRow[]).map(mapRow);
}

export interface DiscountResult {
  discount: number;
  freeShipping: boolean;
  label: string;
}

export function calcDiscount(
  promo: Promotion,
  subtotal: number,
  categoryValue?: string,
  productSlugs?: string[]
): DiscountResult | null {
  if (!promo.isActive) return null;
  if (subtotal < promo.minOrderValue) return null;
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return null;
  if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) return null;
  if (promo.appliesTo === "category" && promo.categoryValue) {
    const allowed = promo.categoryValue.split(",").map((s) => s.trim()).filter(Boolean);
    if (!categoryValue || !allowed.includes(categoryValue)) return null;
  }
  if (promo.appliesTo === "product" && promo.categoryValue) {
    const allowed = promo.categoryValue.split(",").map((s) => s.trim()).filter(Boolean);
    if (!productSlugs || !productSlugs.some((slug) => allowed.includes(slug))) return null;
  }

  if (promo.type === "free_shipping") {
    return { discount: 0, freeShipping: true, label: "Miễn phí vận chuyển" };
  }
  if (promo.type === "percentage") {
    const discount = Math.round((subtotal * promo.value) / 100);
    return { discount, freeShipping: false, label: `-${promo.value}%` };
  }
  if (promo.type === "fixed") {
    const discount = Math.min(promo.value, subtotal);
    return { discount, freeShipping: false, label: `-${promo.value.toLocaleString("vi-VN")}đ` };
  }
  return null;
}
