import { Product } from "./types";
import { createPublicClient } from "./supabase/public";

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: Product["category"];
  category_label: string;
  gender: Product["gender"];
  price: number;
  compare_at_price: number | null;
  colors: Product["colors"];
  sizes: string[];
  description: string;
  details: string[];
  is_new: boolean;
  is_bestseller: boolean;
  rating: number;
  review_count: number;
  images: string[];
  stock: number;
}

function mapRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    categoryLabel: row.category_label,
    gender: row.gender,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
    colors: row.colors,
    sizes: row.sizes,
    description: row.description,
    details: row.details,
    isNew: row.is_new,
    isBestSeller: row.is_bestseller,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    images: row.images ?? [],
    // Cột stock có thể chưa tồn tại nếu chưa chạy migration — coi như còn hàng
    stock: row.stock ?? 100,
  };
}

export interface ProductFilters {
  gender?: "nam" | "nu";
  category?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  hasDiscount?: boolean;
}

export async function getAllProducts(filters?: ProductFilters): Promise<Product[]> {
  const supabase = createPublicClient();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (filters?.gender) {
    query = query.in("gender", [filters.gender, "unisex"]);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.isNew) {
    query = query.eq("is_new", true);
  }
  if (filters?.isBestSeller) {
    query = query.eq("is_bestseller", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getAllProducts error:", error.message);
    return [];
  }

  let rows = (data as ProductRow[]).map(mapRow);
  if (filters?.hasDiscount) {
    rows = rows.filter((p) => !!p.compareAtPrice);
  }
  return rows;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapRow(data as ProductRow);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapRow(data as ProductRow);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  const rows = (data as ProductRow[]).map(mapRow);
  const sameCategory = rows.filter((p) => p.category === product.category);
  const others = rows.filter((p) => p.category !== product.category);
  return [...sameCategory, ...others].slice(0, limit);
}
