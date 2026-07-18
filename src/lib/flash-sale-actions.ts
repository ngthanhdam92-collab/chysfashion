"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "./supabase/server";

export async function createFlashSale(data: {
  name: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("flash_sales").insert({
    name: data.name,
    discount_percent: data.discountPercent,
    start_time: data.startTime,
    end_time: data.endTime,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidateTag("flash-sales", {});
  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true };
}

export async function updateFlashSale(
  id: string,
  data: { name: string; discountPercent: number; startTime: string; endTime: string }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("flash_sales")
    .update({
      name: data.name,
      discount_percent: data.discountPercent,
      start_time: data.startTime,
      end_time: data.endTime,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateTag("flash-sales", {});
  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFlashSale(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("flash_sales").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateTag("flash-sales", {});
  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true };
}

export async function toggleFlashSale(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("flash_sales")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateTag("flash-sales", {});
  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true };
}

export async function setFlashSaleProducts(flashSaleId: string, productIds: string[]) {
  const supabase = await createClient();
  await supabase.from("flash_sale_products").delete().eq("flash_sale_id", flashSaleId);
  if (productIds.length > 0) {
    const { error } = await supabase.from("flash_sale_products").insert(
      productIds.map((product_id) => ({ flash_sale_id: flashSaleId, product_id }))
    );
    if (error) return { error: error.message };
  }
  revalidateTag("flash-sales", {});
  revalidatePath("/admin/flash-sales");
  revalidatePath("/");
  return { success: true };
}
