"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { ProductColor } from "./types";
import { slugify } from "./slugify";

function parseColors(raw: string): ProductColor[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split(",").map((s) => s.trim());
      return { name: name || "Màu", hex: hex || "#171310" };
    });
}

function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildProductPayload(formData: FormData, slug: string) {
  const keptImages = formData.getAll("keptImages").map(String);
  const price = Number(formData.get("price"));
  const compareAtPriceRaw = formData.get("compareAtPrice");
  const compareAtPrice = compareAtPriceRaw ? Number(compareAtPriceRaw) : null;

  // Phân loại hàng: [{color, size, price, stock, sku}] — do form tạo từ Màu × Size
  let variants: { color: string; size: string; price: number; stock: number; sku: string }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("variants") || "[]"));
    if (Array.isArray(parsed)) {
      variants = parsed
        .filter((v) => v && typeof v.color === "string" && typeof v.size === "string")
        .map((v) => ({
          color: v.color,
          size: v.size,
          price: Math.max(0, Number(v.price) || 0),
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          sku: String(v.sku || ""),
        }));
    }
  } catch {
    variants = [];
  }

  // Có phân loại: tổng kho = cộng các phân loại, giá hiển thị = giá thấp nhất trong phân loại
  const hasVariants = variants.length > 0;
  const totalStock = hasVariants
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : Math.max(0, Number(formData.get("stock") || 0));
  const variantPrices = variants.map((v) => v.price).filter((p) => p > 0);
  const displayPrice =
    hasVariants && variantPrices.length > 0 ? Math.min(...variantPrices) : price;

  const videoUrl = String(formData.get("videoUrl") || "").trim() || null;

  return {
    slug,
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || ""),
    category_label: String(formData.get("categoryLabel") || ""),
    gender: String(formData.get("gender") || "unisex"),
    price: displayPrice,
    compare_at_price: compareAtPrice,
    colors: parseColors(String(formData.get("colors") || "")),
    sizes: parseLines(String(formData.get("sizes") || "")),
    description: String(formData.get("description") || ""),
    details: parseLines(String(formData.get("details") || "")),
    is_new: formData.get("isNew") === "on",
    is_bestseller: formData.get("isBestSeller") === "on",
    rating: Number(formData.get("rating") || 5),
    review_count: Number(formData.get("reviewCount") || 0),
    images: keptImages,
    stock: totalStock,
    variants,
    video_url: videoUrl,
  };
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "");
  const slug = slugify(String(formData.get("slug") || name));
  const payload = buildProductPayload(formData, slug);

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(payload);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/san-pham");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = String(formData.get("name") || "");
  const slug = slugify(String(formData.get("slug") || name));
  const payload = buildProductPayload(formData, slug);

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(payload).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/san-pham");
  revalidatePath(`/san-pham/${slug}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/san-pham");
  revalidatePath("/admin/products");
  return { success: true };
}
