import { getAllProducts } from "@/lib/products";
import { StoryForm } from "@/components/admin/story-form";

export default async function NewStoryPage() {
  const products = await getAllProducts();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Thêm story mới</h1>
        <p className="mt-0.5 text-sm text-muted">
          Upload ảnh feedback khách hàng và gắn sản phẩm liên quan
        </p>
      </div>
      <StoryForm products={products} />
    </div>
  );
}
