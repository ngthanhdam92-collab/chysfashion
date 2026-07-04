import { CategoryTileForm } from "@/components/admin/category-tile-form";
import { createCategoryTile } from "@/lib/category-tiles-actions";
import { getCategories } from "@/lib/categories";

export default async function NewCategoryTilePage() {
  const categories = await getCategories();
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Thêm ô danh mục</h1>
      <div className="max-w-xl border border-line bg-surface p-6">
        <CategoryTileForm action={createCategoryTile} categories={categories} />
      </div>
    </div>
  );
}
