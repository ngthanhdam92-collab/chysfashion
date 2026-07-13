"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

export async function upsertPageSeo(
  pageKey: string,
  data: { metaTitle: string; metaDescription: string; ogImage: string }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("page_seo").upsert(
    {
      page_key: pageKey,
      meta_title: data.metaTitle.trim() || null,
      meta_description: data.metaDescription.trim() || null,
      og_image: data.ogImage.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_key" }
  );
  if (error) return { error: error.message };

  // Revalidate the page itself + admin
  revalidatePath("/");
  revalidatePath(`/${pageKey === "home" ? "" : pageKey}`);
  revalidatePath("/admin/seo");
  return {};
}
