"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { MovementType } from "./stock-movements";

export async function createStockMovement(payload: {
  productId: string;
  productName: string;
  color: string;
  size: string;
  sku: string;
  type: MovementType;
  quantity: number; // absolute value — direction determined by type
  note: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Determine signed delta for stock
  const delta =
    payload.type === "nhap_hang" || payload.type === "doi_tra_nhap"
      ? payload.quantity
      : payload.type === "xuat_hong"
      ? -payload.quantity
      : payload.type === "dieu_chinh"
      ? payload.quantity // caller passes signed value for adjustment
      : 0; // doi_tra_hong — no stock change

  // Insert movement record — try with sku first, fallback without if column missing
  const insertBase = {
    product_id: payload.productId,
    product_name: payload.productName,
    color: payload.color,
    size: payload.size,
    type: payload.type,
    quantity: delta,
    note: payload.note || null,
  };

  let { error: insErr } = await supabase
    .from("stock_movements")
    .insert({ ...insertBase, sku: payload.sku });

  if (insErr?.message?.includes("sku")) {
    // Column not yet migrated — insert without sku
    const retry = await supabase.from("stock_movements").insert(insertBase);
    insErr = retry.error;
  }

  if (insErr) return { error: insErr.message };

  // Update product stock if delta != 0
  if (delta !== 0) {
    const hasVariants = payload.color !== "" && payload.size !== "";

    if (hasVariants) {
      const { data, error: fetchErr } = await supabase
        .from("products")
        .select("variants, stock")
        .eq("id", payload.productId)
        .single();
      if (fetchErr || !data) return { error: fetchErr?.message ?? "Không tìm thấy sản phẩm" };

      const variants = (
        data.variants as { color: string; size: string; stock: number; [k: string]: unknown }[]
      ) ?? [];
      const updated = variants.map((v) =>
        v.color === payload.color && v.size === payload.size
          ? { ...v, stock: Math.max(0, (v.stock ?? 0) + delta) }
          : v
      );
      const totalStock = updated.reduce((s, v) => s + (v.stock ?? 0), 0);
      const { error: updErr } = await supabase
        .from("products")
        .update({ variants: updated, stock: totalStock })
        .eq("id", payload.productId);
      if (updErr) return { error: updErr.message };
    } else {
      const { data, error: fetchErr } = await supabase
        .from("products")
        .select("stock")
        .eq("id", payload.productId)
        .single();
      if (fetchErr || !data) return { error: fetchErr?.message ?? "Không tìm thấy sản phẩm" };
      const newStock = Math.max(0, ((data as { stock: number }).stock ?? 0) + delta);
      const { error: updErr } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", payload.productId);
      if (updErr) return { error: updErr.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/kho");
  revalidatePath("/admin/products");
  return {};
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function applyStockDelta(
  supabase: Awaited<ReturnType<typeof import("./supabase/server").createClient>>,
  productId: string,
  color: string,
  size: string,
  delta: number
) {
  if (delta === 0) return;
  const hasVariants = color !== "" && size !== "";
  if (hasVariants) {
    const { data, error } = await supabase
      .from("products")
      .select("variants, stock")
      .eq("id", productId)
      .single();
    if (error || !data) return;
    const variants = (
      data.variants as { color: string; size: string; stock: number; [k: string]: unknown }[]
    ) ?? [];
    const updated = variants.map((v) =>
      v.color === color && v.size === size
        ? { ...v, stock: Math.max(0, (v.stock ?? 0) + delta) }
        : v
    );
    const totalStock = updated.reduce((s, v) => s + (v.stock ?? 0), 0);
    await supabase.from("products").update({ variants: updated, stock: totalStock }).eq("id", productId);
  } else {
    const { data, error } = await supabase.from("products").select("stock").eq("id", productId).single();
    if (error || !data) return;
    await supabase
      .from("products")
      .update({ stock: Math.max(0, ((data as { stock: number }).stock ?? 0) + delta) })
      .eq("id", productId);
  }
}

// ── delete ────────────────────────────────────────────────────────────────────

export async function deleteStockMovement(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: m, error: fetchErr } = await supabase
    .from("stock_movements")
    .select("product_id, color, size, quantity")
    .eq("id", id)
    .single();

  if (fetchErr || !m) return { error: fetchErr?.message ?? "Không tìm thấy phiếu" };

  // Reverse the stored delta
  await applyStockDelta(
    supabase,
    m.product_id as string,
    m.color as string,
    m.size as string,
    -(m.quantity as number)
  );

  const { error: delErr } = await supabase.from("stock_movements").delete().eq("id", id);
  if (delErr) return { error: delErr.message };

  revalidatePath("/admin");
  revalidatePath("/admin/kho");
  revalidatePath("/admin/products");
  return {};
}

// ── update ────────────────────────────────────────────────────────────────────

export async function updateStockMovement(
  id: string,
  payload: { type: MovementType; quantity: number; note: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: old, error: fetchErr } = await supabase
    .from("stock_movements")
    .select("product_id, color, size, quantity")
    .eq("id", id)
    .single();

  if (fetchErr || !old) return { error: fetchErr?.message ?? "Không tìm thấy phiếu" };

  const newDelta =
    payload.type === "nhap_hang" || payload.type === "doi_tra_nhap"
      ? Math.abs(payload.quantity)
      : payload.type === "xuat_hong"
      ? -Math.abs(payload.quantity)
      : payload.type === "dieu_chinh"
      ? payload.quantity
      : 0;

  const deltaDiff = newDelta - (old.quantity as number);
  await applyStockDelta(
    supabase,
    old.product_id as string,
    old.color as string,
    old.size as string,
    deltaDiff
  );

  const { error: updErr } = await supabase
    .from("stock_movements")
    .update({ type: payload.type, quantity: newDelta, note: payload.note || null })
    .eq("id", id);

  if (updErr) return { error: updErr.message };

  revalidatePath("/admin");
  revalidatePath("/admin/kho");
  revalidatePath("/admin/products");
  return {};
}
