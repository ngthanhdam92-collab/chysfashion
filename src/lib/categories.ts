import { unstable_cache } from "next/cache";
import { createPublicClient } from "./supabase/public";

export interface Category {
  id: string;
  value: string;
  label: string;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  gender: "nam" | "nu" | "unisex";
}

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
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
      bannerImageUrl: r.banner_image_url ?? null,
      gender: (r.gender as "nam" | "nu" | "unisex") ?? "unisex",
    }));
  },
  ["categories"],
  { tags: ["categories"], revalidate: 300 }
);
