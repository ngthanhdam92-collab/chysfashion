"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { ProductColor } from "./types";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

async function uploadImages(
  formData: FormData,
  slug: string
): Promise<string[]> {
  const supabase = await createClient();
  const files = formData.getAll("newImages").filter((f): f is File => f instanceof File && f.size > 0);
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop();
    const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-media").upload(path, file);
    if (error) {
      console.error("uploadImages error:", error.message);
      continue;
    }
    const { data } = supabase.storage.from("product-media").getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

function buildProductPayload(formData: FormData, slug: string, newImageUrls: string[]) {
  const keptImages = formData.getAll("keptImages").map(String);
  const price = Number(formData.get("price"));
  const compareAtPriceRaw = formData.get("compareAtPrice");
  const compareAtPrice = compareAtPriceRaw ? Number(compareAtPriceRaw) : null;

  return {
    slug,
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || ""),
    category_label: String(formData.get("categoryLabel") || ""),
    gender: String(formData.get("gender") || "unisex"),
    price,
    compare_at_price: compareAtPrice,
    colors: parseColors(String(formData.get("colors") || "")),
    sizes: parseLines(String(formData.get("sizes") || "")),
    description: String(formData.get("description") || ""),
    details: parseLines(String(formData.get("details") || "")),
    is_new: formData.get("isNew") === "on",
    is_bestseller: formData.get("isBestSeller") === "on",
    rating: Number(formData.get("rating") || 5),
    review_count: Number(formData.get("reviewCount") || 0),
    images: [...keptImages, ...newImageUrls],
  };
}

export async function createProduct(formData: FormData) {
  const name = String(formData.get("name") || "");
  const slug = slugify(String(formData.get("slug") || name));
  const newImageUrls = await uploadImages(formData, slug);
  const payload = buildProductPayload(formData, slug, newImageUrls);

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
  const newImageUrls = await uploadImages(formData, slug);
  const payload = buildProductPayload(formData, slug, newImageUrls);

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
