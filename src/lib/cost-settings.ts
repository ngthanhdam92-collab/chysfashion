"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";

export interface CostSettings {
  packagingPerOrder: number;
  printingPerOrder: number;
  returnRatePct: number;
  returnCostPerUnit: number;
}

const DEFAULT: CostSettings = {
  packagingPerOrder: 0,
  printingPerOrder: 0,
  returnRatePct: 0,
  returnCostPerUnit: 0,
};

export async function getCostSettings(): Promise<CostSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cost_settings")
    .select("*")
    .eq("id", "singleton")
    .maybeSingle();
  if (!data) return DEFAULT;
  return {
    packagingPerOrder: Number(data.packaging_per_order ?? 0),
    printingPerOrder: Number(data.printing_per_order ?? 0),
    returnRatePct: Number(data.return_rate_pct ?? 0),
    returnCostPerUnit: Number(data.return_cost_per_unit ?? 0),
  };
}

export async function saveCostSettings(settings: CostSettings) {
  const supabase = await createClient();
  const { error } = await supabase.from("cost_settings").upsert(
    {
      id: "singleton",
      packaging_per_order: settings.packagingPerOrder,
      printing_per_order: settings.printingPerOrder,
      return_rate_pct: settings.returnRatePct,
      return_cost_per_unit: settings.returnCostPerUnit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/chi-phi");
  revalidatePath("/admin/analytics");
  return { success: true };
}
