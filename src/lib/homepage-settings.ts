import { createPublicClient } from "./supabase/public";

export interface HomepageSettings {
  featuredCategoryValues: string[]; // thứ tự hiển thị
  newCollectionCategory: string | null; // value của category
}

const DEFAULT: HomepageSettings = {
  featuredCategoryValues: [],
  newCollectionCategory: null,
};

function parse(raw: unknown): HomepageSettings {
  if (!raw || typeof raw !== "object") return DEFAULT;
  const d = raw as Record<string, unknown>;
  return {
    featuredCategoryValues: Array.isArray(d.featuredCategoryValues)
      ? (d.featuredCategoryValues as string[])
      : [],
    newCollectionCategory:
      typeof d.newCollectionCategory === "string" && d.newCollectionCategory
        ? d.newCollectionCategory
        : null,
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("homepage_settings")
    .select("value")
    .eq("key", "main")
    .maybeSingle();
  return parse(data?.value);
}
