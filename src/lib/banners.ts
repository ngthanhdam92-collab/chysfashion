import { createPublicClient } from "./supabase/public";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  linkUrl: string;
  linkLabel: string;
  position: number;
  isActive: boolean;
  createdAt: string;
}

interface BannerRow {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  link_url: string;
  link_label: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

function mapRow(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
    position: row.position,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function getAllBanners(): Promise<Banner[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as BannerRow[]).map(mapRow);
}

export async function getActiveBanners(): Promise<Banner[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as BannerRow[]).map(mapRow);
}

export async function getBannerById(id: string): Promise<Banner | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as BannerRow);
}
