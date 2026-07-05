import { createPublicClient } from "./supabase/public";

export interface HomepageSettings {
  featuredCategoryValues: string[];
  collectionBannerValues: string[];
  newCollectionCategory: string | null;
  newCollectionDisplayName: string | null;
}

const DEFAULT: HomepageSettings = {
  featuredCategoryValues: [],
  collectionBannerValues: [],
  newCollectionCategory: null,
  newCollectionDisplayName: null,
};

function parse(raw: unknown): HomepageSettings {
  if (!raw || typeof raw !== "object") return DEFAULT;
  const d = raw as Record<string, unknown>;
  return {
    featuredCategoryValues: Array.isArray(d.featuredCategoryValues)
      ? (d.featuredCategoryValues as string[])
      : [],
    collectionBannerValues: Array.isArray(d.collectionBannerValues)
      ? (d.collectionBannerValues as string[])
      : [],
    newCollectionCategory:
      typeof d.newCollectionCategory === "string" && d.newCollectionCategory
        ? d.newCollectionCategory
        : null,
    newCollectionDisplayName:
      typeof d.newCollectionDisplayName === "string" && d.newCollectionDisplayName
        ? d.newCollectionDisplayName
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
