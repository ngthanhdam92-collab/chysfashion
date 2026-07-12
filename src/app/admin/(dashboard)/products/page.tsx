import Link from "next/link";
import { Plus, LayoutList } from "lucide-react";
import { getAllProducts } from "@/lib/products";
import { ProductsTable } from "@/components/admin/products-table";

export default async function AdminProductsPage() {
  const products = await getAllProducts();

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

      <ProductsTable products={products} />
    </div>
  );
}
