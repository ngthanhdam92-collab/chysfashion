import { createPublicClient } from "./supabase/public";

export interface Category {
  id: string;
  value: string;
  label: string;
  imageUrl: string | null;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("getCategories error:", error?.message);
    return [];
  }

  return data.map((r) => ({
    id: r.id,
    value: r.value,
    label: r.label,
    imageUrl: r.image_url ?? null,
  }));
}
