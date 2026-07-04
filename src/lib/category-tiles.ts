import { createPublicClient } from "./supabase/public";

export interface CategoryTile {
  id: string;
  label: string;
  href: string;
  imageUrl: string | null;
  position: number;
  isActive: boolean;
}

interface CategoryTileRow {
  id: string;
  label: string;
  href: string;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

function mapRow(row: CategoryTileRow): CategoryTile {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    imageUrl: row.image_url,
    position: row.position,
    isActive: row.is_active,
  };
}

export async function getAllCategoryTiles(): Promise<CategoryTile[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category_tiles")
    .select("*")
    .order("position", { ascending: true });
  if (error) return [];
  return (data as CategoryTileRow[]).map(mapRow);
}

export async function getActiveCategoryTiles(): Promise<CategoryTile[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category_tiles")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });
  if (error) return [];
  return (data as CategoryTileRow[]).map(mapRow);
}

export async function getCategoryTileById(id: string): Promise<CategoryTile | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("category_tiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as CategoryTileRow);
}
