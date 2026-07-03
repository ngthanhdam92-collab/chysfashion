"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { ProductColor } from "./types";
import { slugify } from "./slugify";
import { createPublicClient } from "./supabase/public";

function parseColors(raw: string, variantImagesJson: string): ProductColor[] {
  let variantImages: Record<string, string[]> = {};
  try {
    variantImages = JSON.parse(variantImagesJson || "{}");
  } catch {}

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split(",").map((s) => s.trim());
      const colorName = name || "Màu";
      return {
        name: colorName,
        hex: hex || "#171310",
        images: variantImages[colorName] ?? [],
      };
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
  // Fallback price/stock for products without classifications
  const fallbackPrice = Number(formData.get("price") || 0);
  const fallbackCompareAtPriceRaw = formData.get("compareAtPrice");
  const fallbackCompareAtPrice = fallbackCompareAtPriceRaw ? Number(fallbackCompareAtPriceRaw) : null;
  const fallbackStock = Math.max(0, Number(formData.get("stock") || 0));

  // Phân loại hàng — each variant can carry its own price, compareAtPrice, stock, sku
  let variants: { color: string; size: string; price: number; compareAtPrice?: number; stock: number; sku: string }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("variants") || "[]"));
    if (Array.isArray(parsed)) {
      variants = parsed
        .filter((v) => v && typeof v.color === "string" && typeof v.size === "string")
        .map((v) => ({
          color: v.color,
          size: v.size,
          price: Math.max(0, Number(v.price) || 0),
          ...(v.compareAtPrice ? { compareAtPrice: Math.max(0, Number(v.compareAtPrice) || 0) } : {}),
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          sku: String(v.sku || ""),
        }));
    }
  } catch {
    variants = [];
  }

  // Display price = min variant price; display compareAtPrice = min variant compareAtPrice
  const hasVariants = variants.length > 0;
  const totalStock = hasVariants
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : fallbackStock;
  const variantPrices = variants.map((v) => v.price).filter((p) => p > 0);
  const displayPrice = hasVariants && variantPrices.length > 0 ? Math.min(...variantPrices) : fallbackPrice;
  const variantComparePrices = variants
    .map((v) => v.compareAtPrice)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const displayCompareAtPrice = hasVariants && variantComparePrices.length > 0
    ? Math.min(...variantComparePrices)
    : fallbackCompareAtPrice;

  const videoUrl = String(formData.get("videoUrl") || "").trim() || null;

  let relatedProductIds: string[] = [];
  try {
    const raw = String(formData.get("relatedProductIds") || "[]");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) relatedProductIds = parsed.filter((v) => typeof v === "string");
  } catch {}

  return {
    slug,
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || ""),
    category_label: String(formData.get("categoryLabel") || ""),
    gender: String(formData.get("gender") || "unisex"),
    price: displayPrice,
    compare_at_price: displayCompareAtPrice,
    colors: parseColors(
      String(formData.get("colors") || ""),
      String(formData.get("variantImages") || "{}")
    ),
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
    related_product_ids: relatedProductIds,
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

export async function updateVariantImages(
  productId: string,
  variantImages: Record<string, string[]>
) {
  const pub = createPublicClient();
  const { data } = await pub
    .from("products")
    .select("colors, slug")
    .eq("id", productId)
    .maybeSingle();

  if (!data) return { error: "Không tìm thấy sản phẩm" };

  const colors = ((data.colors ?? []) as ProductColor[]).map((c) => ({
    ...c,
    images: variantImages[c.name] ?? c.images ?? [],
  }));

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ colors })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/san-pham");
  revalidatePath(`/san-pham/${data.slug}`);
  revalidatePath("/admin/products");
  return { success: true };
}
