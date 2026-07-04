"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { StoryProductLink } from "./stories";

export async function createStory(formData: FormData) {
  const supabase = await createClient();
  const imageUrl = formData.get("imageUrl") as string;
  const customerName = (formData.get("customerName") as string) ?? "";
  const position = parseInt((formData.get("position") as string) ?? "0", 10);
  const isActive = formData.get("isActive") === "true";
  const productLinksRaw = formData.get("productLinks") as string;
  const productLinks: StoryProductLink[] = productLinksRaw
    ? JSON.parse(productLinksRaw)
    : [];

  if (!imageUrl) return { error: "Vui lòng upload ảnh" };

  const { error } = await supabase.from("customer_stories").insert({
    image_url: imageUrl,
    customer_name: customerName,
    position,
    is_active: isActive,
    product_links: productLinks,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/stories");
  return { success: true };
}

export async function updateStory(id: string, formData: FormData) {
  const supabase = await createClient();
  const imageUrl = formData.get("imageUrl") as string;
  const customerName = (formData.get("customerName") as string) ?? "";
  const position = parseInt((formData.get("position") as string) ?? "0", 10);
  const isActive = formData.get("isActive") === "true";
  const productLinksRaw = formData.get("productLinks") as string;
  const productLinks: StoryProductLink[] = productLinksRaw
    ? JSON.parse(productLinksRaw)
    : [];

  if (!imageUrl) return { error: "Vui lòng upload ảnh" };

  const { error } = await supabase
    .from("customer_stories")
    .update({
      image_url: imageUrl,
      customer_name: customerName,
      position,
      is_active: isActive,
      product_links: productLinks,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/stories");
  return { success: true };
}

export async function deleteStory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_stories")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/stories");
  return { success: true };
}
