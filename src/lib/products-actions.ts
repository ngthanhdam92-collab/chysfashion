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
  const fallbackCostPriceRaw = formData.get("costPrice");
  const fallbackCostPrice = fallbackCostPriceRaw ? Math.max(0, Number(fallbackCostPriceRaw)) : null;

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
          ...(v.costPrice ? { costPrice: Math.max(0, Number(v.costPrice) || 0) } : {}),
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

  let upsellProductIds: string[] = [];
  try {
    const raw = String(formData.get("upsellProductIds") || "[]");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) upsellProductIds = parsed.filter((v) => typeof v === "string");
  } catch {}

  const sizeChartId = String(formData.get("sizeChartId") || "").trim() || null;
  const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
  const metaDescription = String(formData.get("metaDescription") || "").trim() || null;

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
    upsell_product_ids: upsellProductIds,
    size_chart_id: sizeChartId,
    cost_price: fallbackCostPrice,
    meta_title: metaTitle,
    meta_description: metaDescription,
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout"); // revalidate all pages sharing root layout
  revalidatePath(`/san-pham/${slug}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateVariantStock(
  productId: string,
  color: string,
  size: string,
  newStock: number
): Promise<{ error?: string }> {
  const supabase = await createClient();

  // Fetch current product to get existing variants
  const { data, error: fetchErr } = await supabase
    .from("products")
    .select("variants, stock")
    .eq("id", productId)
    .single();
  if (fetchErr || !data) return { error: fetchErr?.message ?? "Không tìm thấy sản phẩm" };

  const hasVariants = color !== "—" && size !== "—";

  if (hasVariants) {
    // Update the matching variant's stock
    const variants = (data.variants as { color: string; size: string; stock: number; [k: string]: unknown }[]) ?? [];
    const updated = variants.map((v) =>
      v.color === color && v.size === size ? { ...v, stock: Math.max(0, newStock) } : v
    );
    const totalStock = updated.reduce((s, v) => s + (v.stock ?? 0), 0);
    const { error } = await supabase
      .from("products")
      .update({ variants: updated, stock: totalStock })
      .eq("id", productId);
    if (error) return { error: error.message };
  } else {
    // Product without variants — update stock directly
    const { error } = await supabase
      .from("products")
      .update({ stock: Math.max(0, newStock) })
      .eq("id", productId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  return {};
}

export async function reorderProducts(orderedIds: string[]) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("products").update({ sort_order: idx + 1 }).eq("id", id)
    )
  );
  revalidatePath("/admin/products");
  revalidatePath("/san-pham");
}

export async function moveProductUp(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (!data) return;

  const idx = data.findIndex((p) => p.id === id);
  if (idx <= 0) return; // already first

  const above = data[idx - 1];
  const current = data[idx];
  await supabase.from("products").update({ sort_order: above.sort_order }).eq("id", current.id);
  await supabase.from("products").update({ sort_order: current.sort_order }).eq("id", above.id);

  revalidatePath("/admin/products");
  revalidatePath("/san-pham");
}

export async function moveProductDown(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (!data) return;

  const idx = data.findIndex((p) => p.id === id);
  if (idx < 0 || idx >= data.length - 1) return; // already last

  const below = data[idx + 1];
  const current = data[idx];
  await supabase.from("products").update({ sort_order: below.sort_order }).eq("id", current.id);
  await supabase.from("products").update({ sort_order: current.sort_order }).eq("id", below.id);

  revalidatePath("/admin/products");
  revalidatePath("/san-pham");
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

  revalidatePath("/", "layout");
  revalidatePath(`/san-pham/${data.slug}`);
  revalidatePath("/admin/products");
  return { success: true };
}

export async function createBulkProducts(formData: FormData) {
  const category = String(formData.get("category") || "");
  const categoryLabel = String(formData.get("categoryLabel") || "");
  const gender = String(formData.get("gender") || "unisex");
  const description = String(formData.get("description") || "");
  const detailsRaw = String(formData.get("details") || "");
  const isNew = formData.get("isNew") === "on";
  const isBestSeller = formData.get("isBestSeller") === "on";
  const rating = Number(formData.get("rating") || 5);
  const reviewCount = Number(formData.get("reviewCount") || 0);
  const sizeChartId = String(formData.get("sizeChartId") || "").trim() || null;

  // Parse colors (format: "name,hex\n...")
  const colorsRaw = String(formData.get("colors") || "");
  const colorsTemplate = colorsRaw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, hex] = l.split(",").map((s) => s.trim());
      return { name: name || "Màu", hex: hex || "#171310" };
    });

  // Parse sizes
  const sizes = parseLines(String(formData.get("sizes") || ""));

  // Parse variant template (price/stock per color×size combo, no SKU)
  type VariantTemplate = {
    color: string; size: string; price: number;
    compareAtPrice?: number; costPrice?: number; stock: number;
  };
  let variantsTemplate: VariantTemplate[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("variantsTemplate") || "[]"));
    if (Array.isArray(parsed)) variantsTemplate = parsed;
  } catch {}

  // Parse items [{name, images, variantImages, sku}]
  type ItemInput = { name: string; images: string[]; variantImages: Record<string, string[]>; sku: string };
  let items: ItemInput[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("items") || "[]"));
    if (Array.isArray(parsed)) items = parsed;
  } catch {}

  const validItems = items.filter((it) => it.name?.trim());
  if (validItems.length === 0) return { error: "Chưa có sản phẩm nào hợp lệ." };

  const details = parseLines(detailsRaw);

  const supabase = await createClient();

  const payloads = validItems.map((item) => {
    const name = item.name.trim();
    const slug = slugify(name);

    const colors: ProductColor[] = colorsTemplate.map((c) => ({
      name: c.name,
      hex: c.hex,
      images: item.variantImages?.[c.name] ?? [],
    }));

    const variants = variantsTemplate.map((v) => ({
      color: v.color,
      size: v.size,
      price: Math.max(0, Number(v.price) || 0),
      ...(v.compareAtPrice ? { compareAtPrice: Math.max(0, Number(v.compareAtPrice)) } : {}),
      ...(v.costPrice ? { costPrice: Math.max(0, Number(v.costPrice)) } : {}),
      stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      sku: item.sku ?? "",
    }));

    const totalStock = variants.reduce((s, v) => s + v.stock, 0);
    const variantPrices = variants.map((v) => v.price).filter((p) => p > 0);
    const displayPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
    const variantComparePrices = variants
      .map((v) => v.compareAtPrice)
      .filter((p): p is number => typeof p === "number" && p > 0);
    const displayCompareAtPrice = variantComparePrices.length > 0 ? Math.min(...variantComparePrices) : null;

    return {
      slug,
      name,
      category,
      category_label: categoryLabel,
      gender,
      price: displayPrice,
      compare_at_price: displayCompareAtPrice,
      colors,
      sizes,
      description,
      details,
      is_new: isNew,
      is_bestseller: isBestSeller,
      rating,
      review_count: reviewCount,
      images: item.images ?? [],
      stock: totalStock,
      variants,
      video_url: null,
      related_product_ids: [],
      size_chart_id: sizeChartId,
      cost_price: null,
    };
  });

  const { error } = await supabase.from("products").insert(payloads);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductFlag(
  id: string,
  flag: "is_bestseller" | "is_new",
  value: boolean
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ [flag]: value })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { success: true };
}


