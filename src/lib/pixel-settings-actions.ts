"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "./supabase/server";
import type { PixelSettings } from "./pixel-settings";

export async function savePixelSettings(settings: PixelSettings) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("homepage_settings")
    .upsert({ key: "pixel_settings", value: settings }, { onConflict: "key" });
  if (error) return { error: error.message };
  revalidateTag("pixel", {});
  revalidatePath("/", "layout");
  revalidatePath("/admin/pixel");
  return { success: true };
}
