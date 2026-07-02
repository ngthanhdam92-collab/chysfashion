import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/lib/products-actions";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Thêm sản phẩm</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <ProductForm action={createProduct} />
      </div>
    </div>
  );
}
