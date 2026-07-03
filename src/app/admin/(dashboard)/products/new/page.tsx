import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/products-actions";
import { getCategories } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";
import { getAllSizeChartTemplates } from "@/lib/size-chart-templates";

export default async function NewProductPage() {
  const [categories, allProducts, sizeCharts] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getAllSizeChartTemplates(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Thêm sản phẩm</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <ProductForm
          categories={categories}
          allProducts={allProducts}
          sizeCharts={sizeCharts}
          action={createProduct}
        />
      </div>
    </div>
  );
}
