import { Suspense } from "react";
import { ProductFilters } from "@/components/product-filters";
import { SortSelect } from "@/components/sort-select";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { getAllProducts } from "@/lib/products";
import { getCategories } from "@/lib/categories";
import { Product } from "@/lib/types";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("san-pham", {
    title: "Sản phẩm — CHYS Fashion",
    description: "Khám phá bộ sưu tập thời trang cao cấp CHYS Fashion — áo, quần, phụ kiện cho nam và nữ.",
  });
}

const PAGE_SIZE = 24;

interface Params {
  searchParams: Promise<{
    gender?: string;
    category?: string;
    filter?: string;
    sort?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ProductListingPage({ searchParams }: Params) {
  const { gender, category, filter, sort, q, page: pageParam } = await searchParams;
  let items: Product[] = await getAllProducts();
  const categories = await getCategories();

  if (q?.trim()) {
    const keyword = q.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.categoryLabel.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
    );
  }
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

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(offset, offset + PAGE_SIZE);

  const from = totalCount === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, totalCount);

  // Build breadcrumb
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "Sản phẩm", href: "/san-pham" }];
  if (q?.trim()) {
    breadcrumbItems.push({ label: `Tìm kiếm: "${q.trim()}"` });
  } else if (gender === "nam") {
    breadcrumbItems.push({ label: "Nam" });
  } else if (gender === "nu") {
    breadcrumbItems.push({ label: "Nữ" });
  } else if (category) {
    const cat = categories.find((c) => c.value === category);
    breadcrumbItems.push({ label: cat?.label ?? category });
  } else if (filter === "moi") {
    breadcrumbItems.push({ label: "Hàng mới" });
  } else if (filter === "sale") {
    breadcrumbItems.push({ label: "Khuyến mãi" });
  } else if (filter === "bestseller") {
    breadcrumbItems.push({ label: "Bán chạy" });
  }

  const pageTitle = q?.trim()
    ? `"${q.trim()}"`
    : gender === "nam" ? "Thời trang Nam"
    : gender === "nu" ? "Thời trang Nữ"
    : category ? (categories.find((c) => c.value === category)?.label ?? "Danh mục")
    : filter === "moi" ? "Hàng mới về"
    : filter === "sale" ? "Khuyến mãi"
    : filter === "bestseller" ? "Bán chạy nhất"
    : "Tất cả sản phẩm";

  // Build searchParams object for pagination links (exclude "page")
  const spObj: Record<string, string> = {};
  if (gender) spObj.gender = gender;
  if (category) spObj.category = category;
  if (filter) spObj.filter = filter;
  if (sort) spObj.sort = sort;
  if (q) spObj.q = q;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumb items={breadcrumbItems} />
      <div className="mb-10">
        <p className="text-[12px] tracking-label uppercase text-gold-dark">
          {q?.trim() ? "Tìm kiếm" : "Cửa hàng"}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          {pageTitle}
        </h1>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <Suspense fallback={<div className="lg:w-56 lg:shrink-0" />}>
          <ProductFilters categories={categories} />
        </Suspense>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted">
              {totalCount === 0
                ? "Không có sản phẩm"
                : `${totalCount} sản phẩm`}
            </p>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {pageItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-line py-24 text-center">
              <p className="text-sm text-muted">
                Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
              {pageItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination + stats */}
          {totalCount > 0 && (
            <div className="mt-12 space-y-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                basePath="/san-pham"
                searchParams={spObj}
              />
              <p className="text-center text-xs text-muted">
                Hiển thị {from}–{to} trong {totalCount} sản phẩm
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
