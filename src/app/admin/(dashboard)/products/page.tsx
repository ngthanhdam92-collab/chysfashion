import Link from "next/link";
import { Plus, LayoutList } from "lucide-react";
import { getAllProducts } from "@/lib/products";
import { ProductsTable } from "@/components/admin/products-table";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 20;

interface Params {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Params) {
  const { page: pageParam } = await searchParams;
  const allProducts = await getAllProducts();

  const totalCount = allProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const pageProducts = allProducts.slice(offset, offset + PAGE_SIZE);

  const from = totalCount === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE_SIZE, totalCount);

  // Stats based on ALL products
  const stats = {
    total: totalCount,
    inStock: allProducts.filter((p) => p.stock > 0).length,
    outOfStock: allProducts.filter((p) => p.stock === 0).length,
    onSale: allProducts.filter((p) => !!p.compareAtPrice).length,
    isNew: allProducts.filter((p) => p.isNew).length,
    isBestSeller: allProducts.filter((p) => p.isBestSeller).length,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Sản phẩm</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/bulk-new"
            className="flex items-center gap-2 border border-line px-4 py-2.5 text-[12px] tracking-label uppercase text-ink hover:bg-cream"
          >
            <LayoutList size={15} /> Đăng hàng loạt
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-ink px-4 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85"
          >
            <Plus size={15} /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      <ProductsTable products={pageProducts} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath="/admin/products"
            searchParams={{}}
          />
          <p className="mt-3 text-center text-xs text-muted">
            Hiển thị {from}–{to} trong {totalCount} sản phẩm
          </p>
        </div>
      )}

      {/* Product stats */}
      <div className="mt-8 border-t border-line pt-6">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-label text-muted">
          Thống kê sản phẩm
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { label: "Tổng cộng", value: stats.total, color: "text-ink" },
            { label: "Còn hàng", value: stats.inStock, color: "text-green-700" },
            { label: "Hết hàng", value: stats.outOfStock, color: "text-error" },
            { label: "Đang sale", value: stats.onSale, color: "text-gold-dark" },
            { label: "Hàng mới", value: stats.isNew, color: "text-ink" },
            { label: "Bán chạy", value: stats.isBestSeller, color: "text-ink" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded border border-line bg-surface px-3 py-3 text-center">
              <p className={`text-xl font-semibold ${color}`}>{value}</p>
              <p className="mt-0.5 text-[11px] text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
