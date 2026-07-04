import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { getAllCategoryTiles } from "@/lib/category-tiles";
import { getAllProducts } from "@/lib/products";
import { DeleteCategoryTileButton } from "@/components/admin/delete-category-tile-button";
import { HomepageProductPicker } from "@/components/admin/homepage-product-picker";

export default async function HomepagePage() {
  const [tiles, products] = await Promise.all([
    getAllCategoryTiles(),
    getAllProducts(),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-ink">Quản lý trang chủ</h1>
        <p className="mt-0.5 text-sm text-muted">
          Cấu hình nội dung hiển thị trên trang chủ của cửa hàng
        </p>
      </div>

      {/* ── DANH MỤC NỔI BẬT ── */}
      <section>
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-semibold text-ink">Danh mục nổi bật</h2>
            <p className="mt-0.5 text-xs text-muted">Các ô ảnh danh mục hiển thị ở trang chủ</p>
          </div>
          <Link
            href="/admin/homepage/tiles/new"
            className="flex items-center gap-2 bg-ink px-4 py-2 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85"
          >
            <Plus size={14} /> Thêm ô
          </Link>
        </div>

        <div className="mt-4">
          {tiles.length === 0 ? (
            <div className="rounded border border-dashed border-line px-6 py-10 text-center">
              <p className="text-sm text-muted">Chưa có ô danh mục nào.</p>
              <Link href="/admin/homepage/tiles/new" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Tạo ô đầu tiên
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-line border border-line bg-white">
              {tiles.map((t) => (
                <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden bg-cream">
                    {t.imageUrl ? (
                      <Image src={t.imageUrl} alt={t.label} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[9px] text-stone">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-ink">{t.label}</p>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        t.isActive ? "bg-emerald-100 text-emerald-700" : "bg-line text-stone"
                      }`}>
                        {t.isActive ? "Hiển thị" : "Ẩn"}
                      </span>
                    </div>
                    <p className="text-xs text-stone">Vị trí: {t.position} · {t.href}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/admin/homepage/tiles/${t.id}/edit`}
                      className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-ink hover:border-gold hover:text-gold-dark"
                    >
                      <Pencil size={12} /> Sửa
                    </Link>
                    <DeleteCategoryTileButton id={t.id} label={t.label} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SẢN PHẨM BÁN CHẠY ── */}
      <section>
        <div className="border-b border-line pb-3">
          <h2 className="font-semibold text-ink">Sản phẩm bán chạy</h2>
          <p className="mt-0.5 text-xs text-muted">
            Tích chọn sản phẩm để hiển thị trong mục &quot;Sản phẩm bán chạy&quot; ở trang chủ
          </p>
        </div>
        <div className="mt-4">
          <HomepageProductPicker products={products} flag="is_bestseller" label="Bán chạy" limit={8} />
        </div>
      </section>

      {/* ── BỘ SƯU TẬP MỚI ── */}
      <section>
        <div className="border-b border-line pb-3">
          <h2 className="font-semibold text-ink">Bộ sưu tập mới</h2>
          <p className="mt-0.5 text-xs text-muted">
            Tích chọn sản phẩm để hiển thị trong mục &quot;Bộ sưu tập mới&quot; ở trang chủ
          </p>
        </div>
        <div className="mt-4">
          <HomepageProductPicker products={products} flag="is_new" label="Mới" limit={8} />
        </div>
      </section>
    </div>
  );
}
