import { Product, ProductVariant } from "./types";
import { createPublicClient } from "./supabase/public";
import type { SizeChartRow } from "./size-chart";

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
  variants: ProductVariant[] | null;
  video_url: string | null;
  related_product_ids: string[] | null;
  upsell_product_ids: string[] | null;
  size_chart_id: string | null;
  cost_price: number | null;
  meta_title: string | null;
  meta_description: string | null;
}

function mapRow(
  row: ProductRow,
  sizeChartData?: Record<string, unknown>
): Product {
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
    stock: row.stock ?? 100,
    variants: row.variants ?? [],
    videoUrl: row.video_url ?? null,
    relatedProductIds: row.related_product_ids ?? [],
    upsellProductIds: row.upsell_product_ids ?? [],
    sizeChartId: row.size_chart_id ?? null,
    sizeChart: (sizeChartData ?? {}) as Record<string, Partial<SizeChartRow>>,
    costPrice: row.cost_price ? Number(row.cost_price) : undefined,
    metaTitle: row.meta_title ?? null,
    metaDescription: row.meta_description ?? null,
  };
}

// Fetch size chart data for a product row using a separate query.
// More reliable than PostgREST embedding which requires schema cache refresh.
async function fetchSizeChart(
  sizeChartId: string | null
): Promise<Record<string, unknown>> {
  if (!sizeChartId) return {};
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("size_charts")
    .select("data")
    .eq("id", sizeChartId)
    .maybeSingle();
  return (data?.data as Record<string, unknown>) ?? {};
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
  let query = supabase.from("products").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });

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

  let rows = (data as ProductRow[]).map((r) => mapRow(r));
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
  const row = data as ProductRow;
  const sizeChartData = await fetchSizeChart(row.size_chart_id);
  return mapRow(row, sizeChartData);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  const row = data as ProductRow;
  const sizeChartData = await fetchSizeChart(row.size_chart_id);
  return mapRow(row, sizeChartData);
}

export async function getUpsellProducts(product: Product, limit = 3): Promise<Product[]> {
  if (product.upsellProductIds.length === 0) return [];
  const supabase = createPublicClient();
  const ids = product.upsellProductIds.slice(0, limit);
  const { data, error } = await supabase.from("products").select("*").in("id", ids);
  if (error || !data) return [];
  const map = new Map((data as ProductRow[]).map((r) => [r.id, mapRow(r)]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const supabase = createPublicClient();

  if (product.relatedProductIds.length > 0) {
    const ids = product.relatedProductIds.slice(0, limit);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", ids);
    if (error || !data) return [];
    const map = new Map((data as ProductRow[]).map((r) => [r.id, mapRow(r)]));
    return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  const rows = (data as ProductRow[]).map((r) => mapRow(r));
  const sameCategory = rows.filter((p) => p.category === product.category);
  const others = rows.filter((p) => p.category !== product.category);
  return [...sameCategory, ...others].slice(0, limit);
}
