"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "./supabase/server";

async function upsert(patch: Record<string, unknown>) {
  const supabase = await createClient();
  // Read directly from DB to avoid stale cache data in merge
  const { data } = await supabase
    .from("homepage_settings")
    .select("value")
    .eq("key", "main")
    .maybeSingle();
  const current = (data?.value as Record<string, unknown>) ?? {};
  const merged = { ...current, ...patch };
  const { error } = await supabase
    .from("homepage_settings")
    .upsert({ key: "main", value: merged }, { onConflict: "key" });
  if (error) return { error: error.message };
  revalidateTag("homepage", {});
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  return { success: true };
}

export async function saveFeaturedCategories(values: string[]) {
  return upsert({ featuredCategoryValues: values });
}

export async function saveNewCollectionCategory(value: string | null) {
  return upsert({ newCollectionCategory: value ?? "" });
}

export async function saveNewCollectionSettings(
  category: string | null,
  displayName: string | null
) {
  return upsert({
    newCollectionCategory: category ?? "",
    newCollectionDisplayName: displayName ?? "",
  });
}

export async function saveCollectionBanners(values: string[]) {
  return upsert({ collectionBannerValues: values });
}

export async function saveAnnouncementBar(bar: import("./homepage-settings").AnnouncementBar) {
  return upsert({ announcementBar: bar });
}
