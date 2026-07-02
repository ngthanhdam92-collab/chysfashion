import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";
import { updateProduct } from "@/lib/products-actions";
import { ProductForm } from "@/components/admin/product-form";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const updateWithId = updateProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Sửa sản phẩm</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <ProductForm product={product} action={updateWithId} />
      </div>
    </div>
  );
}
