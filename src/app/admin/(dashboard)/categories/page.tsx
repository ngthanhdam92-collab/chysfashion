import { getCategories } from "@/lib/categories";
import { CategoryRow } from "@/components/admin/category-row";
import { AddCategoryForm } from "@/components/admin/add-category-form";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Danh mục</h1>

      <div className="mb-6 border border-line bg-surface p-5">
        <AddCategoryForm />
      </div>

      <div className="border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
              <th className="px-4 py-3">Tên danh mục</th>
              <th className="px-4 py-3">Đường dẫn (value)</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <CategoryRow key={c.id} category={c} />
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted">
                  Chưa có danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
