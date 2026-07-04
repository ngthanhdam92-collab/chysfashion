import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/products";
import { getStoryById } from "@/lib/stories";
import { StoryForm } from "@/components/admin/story-form";

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [story, products] = await Promise.all([
    getStoryById(id),
    getAllProducts(),
  ]);

  if (!story) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Chỉnh sửa story</h1>
        <p className="mt-0.5 text-sm text-muted">
          Cập nhật ảnh và sản phẩm liên kết
        </p>
      </div>
      <StoryForm story={story} products={products} />
    </div>
  );
}
