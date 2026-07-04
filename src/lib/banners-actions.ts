"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

function parseBannerPayload(formData: FormData) {
  return {
    title: String(formData.get("title") || "").trim(),
    subtitle: String(formData.get("subtitle") || "").trim(),
    image_url: String(formData.get("imageUrl") || "").trim() || null,
    link_url: String(formData.get("linkUrl") || "/san-pham").trim(),
    link_label: String(formData.get("linkLabel") || "Khám phá ngay").trim(),
    position: Number(formData.get("position") || 0),
    is_active: formData.get("isActive") === "true",
  };
}

export async function createBanner(formData: FormData) {
  const payload = parseBannerPayload(formData);
  if (!payload.title) return { error: "Vui lòng nhập tiêu đề banner." };

  const supabase = await createClient();
  const { error } = await supabase.from("banners").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function updateBanner(id: string, formData: FormData) {
  const payload = parseBannerPayload(formData);
  if (!payload.title) return { error: "Vui lòng nhập tiêu đề banner." };

  const supabase = await createClient();
  const { error } = await supabase.from("banners").update(payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function deleteBanner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true };
}
