import { notFound } from "next/navigation";
import { getCategoryTileById } from "@/lib/category-tiles";
import { updateCategoryTile } from "@/lib/category-tiles-actions";
import { CategoryTileForm } from "@/components/admin/category-tile-form";
import { getCategories } from "@/lib/categories";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryTilePage({ params }: Params) {
  const { id } = await params;
  const [tile, categories] = await Promise.all([
    getCategoryTileById(id),
    getCategories(),
  ]);
  if (!tile) notFound();

  const updateWithId = updateCategoryTile.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Sửa ô danh mục</h1>
      <div className="max-w-xl border border-line bg-surface p-6">
        <CategoryTileForm tile={tile} categories={categories} action={updateWithId} />
      </div>
    </div>
  );
}
