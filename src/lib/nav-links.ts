import { createPublicClient } from "./supabase/public";

export interface NavLink {
  id: string;
  label: string;
  href: string;
  position: number;
}

export async function getNavLinks(): Promise<NavLink[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("nav_links")
    .select("*")
    .order("position", { ascending: true });

  if (error || !data) {
    console.error("getNavLinks error:", error?.message);
    return [];
  }

  return data as NavLink[];
}
