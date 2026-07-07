"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import type { BankSettings } from "./bank-settings";

export async function saveBankSettings(settings: BankSettings) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("homepage_settings")
    .upsert({ key: "bank_settings", value: settings }, { onConflict: "key" });
  if (error) return { error: error.message };
  revalidatePath("/thanh-toan");
  revalidatePath("/admin/settings");
  return { success: true };
}
