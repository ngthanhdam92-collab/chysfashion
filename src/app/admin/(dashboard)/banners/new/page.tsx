import { BannerForm } from "@/components/admin/banner-form";
import { createBanner } from "@/lib/banners-actions";
import { getCategories } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";

export default async function NewBannerPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getAllProducts(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Thêm banner</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <BannerForm action={createBanner} categories={categories} products={products} />
      </div>
    </div>
  );
}
