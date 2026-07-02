import { createPublicClient } from "./supabase/public";

export interface Category {
  id: string;
  value: string;
  label: string;
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

  return data as Category[];
}
