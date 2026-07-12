import { BulkProductForm } from "@/components/admin/bulk-product-form";
import { createBulkProducts } from "@/lib/products-actions";
import { getCategories } from "@/lib/categories";
import { getAllSizeChartTemplates } from "@/lib/size-chart-templates";

export default async function BulkNewProductPage() {
  const [categories, sizeCharts] = await Promise.all([
    getCategories(),
    getAllSizeChartTemplates(),
  ]);

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl text-ink">Đăng sản phẩm hàng loạt</h1>
      <p className="mb-6 text-sm text-muted">
        Điền thông tin chung một lần, sau đó thêm từng sản phẩm với tên, ảnh và SKU riêng.
      </p>
      <div className="max-w-4xl">
        <BulkProductForm
          categories={categories}
          sizeCharts={sizeCharts}
          action={createBulkProducts}
        />
      </div>
    </div>
  );
}
