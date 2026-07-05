import { getPromotions } from "@/lib/promotions";
import { getCategories } from "@/lib/categories";
import { createPublicClient } from "@/lib/supabase/public";
import { PromotionsClient } from "@/components/admin/promotions-client";

export interface SimpleProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  categoryLabel: string;
}

async function getSimpleProducts(): Promise<SimpleProduct[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, images, category_label")
    .order("name", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    image: Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null,
    categoryLabel: r.category_label,
  }));
}

export default async function PromotionsPage() {
  const [promotions, categories, products] = await Promise.all([
    getPromotions(),
    getCategories(),
    getSimpleProducts(),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Quản lí khuyến mại</h1>
        <p className="mt-1 text-sm text-muted">Tạo mã giảm giá và quản lí các chương trình khuyến mãi.</p>
      </div>
      <PromotionsClient promotions={promotions} categories={categories} products={products} />
    </div>
  );
}
