"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = rawSlug || slugify(title);
  const bannerMessage = String(formData.get("bannerMessage") || "").trim() || null;
  const productIds = JSON.parse(String(formData.get("productIds") || "[]")) as string[];

  if (!title) return { error: "Tên chiến dịch là bắt buộc" };

  const description = String(formData.get("description") || "").trim() || null;
  const countdownHours = Number(formData.get("countdownHours") || 1);
  const discountPercent = Number(formData.get("discountPercent") || 0) || null;

  const { error } = await supabase.from("campaigns").insert({
    title,
    slug,
    banner_message: bannerMessage,
    ends_at: "2099-12-31T23:59:59Z",
    product_ids: productIds,
    is_active: true,
    description,
    countdown_hours: countdownHours,
    discount_percent: discountPercent,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return { success: true };
}

export async function updateCampaign(id: string, formData: FormData) {
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = rawSlug || slugify(title);
  const bannerMessage = String(formData.get("bannerMessage") || "").trim() || null;
  const productIds = JSON.parse(String(formData.get("productIds") || "[]")) as string[];

  if (!title) return { error: "Tên chiến dịch là bắt buộc" };

  const description = String(formData.get("description") || "").trim() || null;
  const countdownHours = Number(formData.get("countdownHours") || 1);
  const discountPercent = Number(formData.get("discountPercent") || 0) || null;

  const { error } = await supabase.from("campaigns").update({
    title,
    slug,
    banner_message: bannerMessage,
    product_ids: productIds,
    description,
    countdown_hours: countdownHours,
    discount_percent: discountPercent,
  }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  revalidatePath(`/khuyen-mai/${slug}`);
  return { success: true };
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return { success: true };
}

export async function toggleCampaign(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/campaigns");
  return { success: true };
}
