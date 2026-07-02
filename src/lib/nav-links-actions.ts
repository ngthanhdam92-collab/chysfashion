"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

type ActionResult = { error: string } | { success: true };

export async function createNavLink(formData: FormData): Promise<ActionResult> {
  const label = String(formData.get("label") || "").trim();
  const href = String(formData.get("href") || "").trim();
  if (!label || !href) return { error: "Vui lòng nhập đầy đủ tên và đường dẫn." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("nav_links")
    .select("*", { count: "exact", head: true });
  const position = (count ?? 0) + 1;

  const { error } = await supabase.from("nav_links").insert({ label, href, position });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

export async function updateNavLink(id: string, formData: FormData): Promise<ActionResult> {
  const label = String(formData.get("label") || "").trim();
  const href = String(formData.get("href") || "").trim();
  if (!label || !href) return { error: "Vui lòng nhập đầy đủ tên và đường dẫn." };

  const supabase = await createClient();
  const { error } = await supabase.from("nav_links").update({ label, href }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

export async function deleteNavLink(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("nav_links").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

export async function moveNavLink(
  id: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: links, error: fetchError } = await supabase
    .from("nav_links")
    .select("*")
    .order("position", { ascending: true });

  if (fetchError || !links) return { error: fetchError?.message ?? "Không tải được menu." };

  const index = links.findIndex((l) => l.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= links.length) {
    return { success: true };
  }

  const current = links[index];
  const swapWith = links[swapIndex];

  const [{ error: err1 }, { error: err2 }] = await Promise.all([
    supabase.from("nav_links").update({ position: swapWith.position }).eq("id", current.id),
    supabase.from("nav_links").update({ position: current.position }).eq("id", swapWith.id),
  ]);

  if (err1 || err2) return { error: (err1 || err2)?.message ?? "Có lỗi xảy ra." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}
