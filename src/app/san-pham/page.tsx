import { Suspense } from "react";
import { ProductFilters } from "@/components/product-filters";
import { SortSelect } from "@/components/sort-select";
import { ProductCard } from "@/components/product-card";
import { getAllProducts } from "@/lib/products";
import { Product } from "@/lib/types";

export const metadata = {
  title: "Sản phẩm — CHYS Fashion",
};

interface Params {
  searchParams: Promise<{
    gender?: string;
    category?: string;
    filter?: string;
    sort?: string;
  }>;
}

export default async function ProductListingPage({ searchParams }: Params) {
  const { gender, category, filter, sort } = await searchParams;
  let items: Product[] = getAllProducts();

  if (gender === "nam" || gender === "nu") {
    items = items.filter((p) => p.gender === gender || p.gender === "unisex");
  }
  if (category) {
    items = items.filter((p) => p.category === category);
  }
  if (filter === "moi") items = items.filter((p) => p.isNew);
  if (filter === "sale") items = items.filter((p) => !!p.compareAtPrice);
  if (filter === "bestseller") items = items.filter((p) => p.isBestSeller);

  if (sort === "gia-tang") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "gia-giam") items = [...items].sort((a, b) => b.price - a.price);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-[12px] tracking-label uppercase text-gold-dark">
          Cửa hàng
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          Tất cả sản phẩm
        </h1>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <Suspense fallback={<div className="lg:w-56 lg:shrink-0" />}>
          <ProductFilters />
        </Suspense>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted">{items.length} sản phẩm</p>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-line py-24 text-center">
              <p className="text-sm text-muted">
                Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
