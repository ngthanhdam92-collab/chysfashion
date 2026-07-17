import { createPublicClient } from "./supabase/public";
import { createClient } from "./supabase/server";
import { getAllProducts } from "./products";
import type { Product } from "./types";

interface CampaignRow {
  id: string;
  title: string;
  slug: string;
  banner_message: string | null;
  ends_at: string;
  product_ids: string[];
  is_active: boolean;
  created_at: string;
  description: string | null;
  countdown_hours: number;
  discount_percent: number | null;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  bannerMessage: string | null;
  endsAt: string;
  productIds: string[];
  isActive: boolean;
  createdAt: string;
  description: string | null;
  countdownHours: number;
  discountPercent: number | null;
}

export interface CampaignWithProducts extends Campaign {
  products: Product[];
}

function mapRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    bannerMessage: row.banner_message,
    endsAt: row.ends_at,
    productIds: row.product_ids ?? [],
    isActive: row.is_active,
    createdAt: row.created_at,
    description: row.description ?? null,
    countdownHours: row.countdown_hours ?? 1,
    discountPercent: row.discount_percent ?? null,
  };
}

export async function getCampaignBySlug(slug: string): Promise<CampaignWithProducts | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;

  const campaign = mapRow(data as CampaignRow);
  const allProducts = await getAllProducts();
  const products = campaign.productIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  return { ...campaign, products };
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as CampaignRow[]).map(mapRow);
}
