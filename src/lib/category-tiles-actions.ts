"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

function parseTilePayload(formData: FormData) {
  return {
    label: String(formData.get("label") || "").trim(),
    href: String(formData.get("href") || "/san-pham").trim(),
    image_url: String(formData.get("imageUrl") || "").trim() || null,
    position: Number(formData.get("position") || 0),
    is_active: formData.get("isActive") === "true",
  };
}

export async function createCategoryTile(formData: FormData) {
  const payload = parseTilePayload(formData);
  if (!payload.label) return { error: "Vui lòng nhập tên danh mục." };
  const supabase = await createClient();
  const { error } = await supabase.from("category_tiles").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  redirect("/admin/homepage");
}

export async function updateCategoryTile(id: string, formData: FormData) {
  const payload = parseTilePayload(formData);
  if (!payload.label) return { error: "Vui lòng nhập tên danh mục." };
  const supabase = await createClient();
  const { error } = await supabase.from("category_tiles").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  redirect("/admin/homepage");
}

export async function deleteCategoryTile(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("category_tiles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  return { success: true };
}
