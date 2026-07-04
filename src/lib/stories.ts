import { createPublicClient } from "./supabase/public";

export interface StoryProductLink {
  productId: string;
  productSlug: string;
  productName: string;
  price: number;
}

export interface Story {
  id: string;
  imageUrl: string;
  customerName: string;
  productLinks: StoryProductLink[];
  position: number;
  isActive: boolean;
}

function mapRow(r: Record<string, unknown>): Story {
  return {
    id: r.id as string,
    imageUrl: r.image_url as string,
    customerName: (r.customer_name as string) ?? "",
    productLinks: Array.isArray(r.product_links)
      ? (r.product_links as StoryProductLink[])
      : [],
    position: (r.position as number) ?? 0,
    isActive: r.is_active as boolean,
  };
}

export async function getActiveStories(): Promise<Story[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("customer_stories")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true });
  return (data ?? []).map(mapRow);
}

export async function getAllStories(): Promise<Story[]> {
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_stories")
    .select("*")
    .order("position", { ascending: true });
  return (data ?? []).map(mapRow);
}

export async function getStoryById(id: string): Promise<Story | null> {
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_stories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ? mapRow(data) : null;
}
