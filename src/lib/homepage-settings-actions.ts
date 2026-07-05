"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { getHomepageSettings } from "./homepage-settings";

async function upsert(patch: Record<string, unknown>) {
  const current = await getHomepageSettings();
  const merged = { ...current, ...patch };
  const supabase = await createClient();
  const { error } = await supabase
    .from("homepage_settings")
    .upsert({ key: "main", value: merged }, { onConflict: "key" });
  if (error) return { error: error.message };
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
