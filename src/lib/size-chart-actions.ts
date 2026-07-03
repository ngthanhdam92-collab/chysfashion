"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

function parseSizeChartPayload(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  let data: Record<string, unknown> = {};
  try {
    const raw = String(formData.get("data") || "{}");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      data = parsed;
    }
  } catch {}
  return { name, data };
}

export async function createSizeChartTemplate(formData: FormData) {
  const payload = parseSizeChartPayload(formData);
  if (!payload.name) return { error: "Vui lòng nhập tên bảng size." };

  const supabase = await createClient();
  const { error } = await supabase.from("size_charts").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/admin/size-charts");
  redirect("/admin/size-charts");
}

export async function updateSizeChartTemplate(id: string, formData: FormData) {
  const payload = parseSizeChartPayload(formData);
  if (!payload.name) return { error: "Vui lòng nhập tên bảng size." };

  const supabase = await createClient();
  const { error } = await supabase.from("size_charts").update(payload).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/size-charts");
  redirect("/admin/size-charts");
}

export async function deleteSizeChartTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("size_charts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/size-charts");
  return { success: true };
}
