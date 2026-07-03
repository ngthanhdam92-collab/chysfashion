import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/products-actions";
import { getCategories } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";

export default async function NewProductPage() {
  const [categories, allProducts] = await Promise.all([getCategories(), getAllProducts()]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Thêm sản phẩm</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <ProductForm categories={categories} allProducts={allProducts} action={createProduct} />
      </div>
    </div>
  );
}
