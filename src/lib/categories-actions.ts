"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { slugify } from "./slugify";

type ActionResult = { error: string } | { success: true };

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const label = String(formData.get("label") || "").trim();
  if (!label) return { error: "Vui lòng nhập tên danh mục." };

  const valueRaw = String(formData.get("value") || "").trim();
  const value = slugify(valueRaw || label);

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ value, label });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/san-pham");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  const label = String(formData.get("label") || "").trim();
  if (!label) return { error: "Vui lòng nhập tên danh mục." };

  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ label }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/san-pham");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/san-pham");
  return { success: true };
}
