import { unstable_cache } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { createClient } from "./supabase/server";

export interface FlashSale {
  id: string;
  name: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface FlashSaleWithProducts extends FlashSale {
  productIds: string[];
}

interface FlashSaleRow {
  id: string;
  name: string;
  discount_percent: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

function mapRow(row: FlashSaleRow): FlashSale {
  return {
    id: row.id,
    name: row.name,
    discountPercent: row.discount_percent,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export const getActiveFlashSale = unstable_cache(
  async (): Promise<FlashSaleWithProducts | null> => {
    const supabase = createPublicClient();
    const now = new Date().toISOString();

    const { data: sale } = await supabase
      .from("flash_sales")
      .select("*")
      .eq("is_active", true)
      .lte("start_time", now)
      .gte("end_time", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sale) return null;

    const { data: links } = await supabase
      .from("flash_sale_products")
      .select("product_id")
      .eq("flash_sale_id", sale.id);

    return {
      ...mapRow(sale as FlashSaleRow),
      productIds: (links ?? []).map((l: { product_id: string }) => l.product_id),
    };
  },
  ["flash-sale-active"],
  { tags: ["flash-sales"], revalidate: 60 }
);

export async function getAllFlashSales(): Promise<FlashSale[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("flash_sales")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => mapRow(r as FlashSaleRow));
}

export async function getFlashSaleProductIds(flashSaleId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("flash_sale_products")
    .select("product_id")
    .eq("flash_sale_id", flashSaleId);
  return (data ?? []).map((r: { product_id: string }) => r.product_id);
}
