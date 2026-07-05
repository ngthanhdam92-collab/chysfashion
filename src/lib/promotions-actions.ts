"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { createPublicClient } from "./supabase/public";
import { type Promotion, type PromotionType, type AppliesTo, calcDiscount } from "./promotions";

interface PromoRow {
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

function mapRow(r: PromoRow): Promotion {
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

export interface CreatePromotionInput {
  code: string;
  name: string;
  type: PromotionType;
  value: number;
  minOrderValue: number;
  appliesTo: AppliesTo;
  categoryValue: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
}

export async function createPromotion(input: CreatePromotionInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").insert({
    code: input.code.toUpperCase().trim(),
    name: input.name.trim(),
    type: input.type,
    value: input.value,
    min_order_value: input.minOrderValue,
    applies_to: input.appliesTo,
    category_value: input.appliesTo === "category" ? input.categoryValue : null,
    usage_limit: input.usageLimit ? Number(input.usageLimit) : null,
    expires_at: input.expiresAt || null,
    is_active: input.isActive,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function updatePromotion(id: string, input: CreatePromotionInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      type: input.type,
      value: input.value,
      min_order_value: input.minOrderValue,
      applies_to: input.appliesTo,
      category_value: input.appliesTo === "category" ? input.categoryValue : null,
      usage_limit: input.usageLimit ? Number(input.usageLimit) : null,
      expires_at: input.expiresAt || null,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function deletePromotion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/promotions");
  return { success: true };
}

export async function togglePromotion(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/promotions");
  return { success: true };
}

export interface ValidateResult {
  discount: number;
  freeShipping: boolean;
  label: string;
  promoId: string;
}

export async function validatePromoCode(
  code: string,
  subtotal: number,
  productSlugs?: string[]
): Promise<{ error: string } | ValidateResult> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (error || !data) return { error: "Mã khuyến mại không tồn tại." };

  const promo = mapRow(data as PromoRow);
  const result = calcDiscount(promo, subtotal, undefined, productSlugs);
  if (!result) {
    if (!promo.isActive) return { error: "Mã khuyến mại đã bị vô hiệu hóa." };
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date())
      return { error: "Mã khuyến mại đã hết hạn." };
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
      return { error: "Mã khuyến mại đã đạt giới hạn sử dụng." };
    if (promo.appliesTo === "product")
      return { error: "Mã này chỉ áp dụng cho một số sản phẩm nhất định trong giỏ hàng của bạn." };
    return {
      error: `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString("vi-VN")}đ để dùng mã này.`,
    };
  }
  return { ...result, promoId: promo.id };
}
