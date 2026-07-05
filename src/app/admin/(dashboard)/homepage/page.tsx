import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCategories } from "@/lib/categories";
import { getAllProducts } from "@/lib/products";
import { getHomepageSettings } from "@/lib/homepage-settings";
import { HomepageFeaturedCategories } from "@/components/admin/homepage-featured-categories";
import { HomepageCollectionBanners } from "@/components/admin/homepage-collection-banners";
import { HomepageNewCollection } from "@/components/admin/homepage-new-collection";

export default async function HomepagePage() {
  const [categories, products, settings] = await Promise.all([
    getCategories(),
    getAllProducts(),
    getHomepageSettings(),
  ]);

  const bestsellerCount = products.filter((p) => p.isBestSeller).length;
  const newCount = products.filter((p) => p.isNew).length;

  // Fallback: if no banner values set yet, use top 3 featured
  const bannerValues = settings.collectionBannerValues.length > 0
    ? settings.collectionBannerValues
    : settings.featuredCategoryValues.slice(0, 3);

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
        <div className="border-b border-line pb-3">
          <h2 className="font-semibold text-ink">Danh mục nổi bật</h2>
          <p className="mt-0.5 text-xs text-muted">
            Chọn các danh mục hiển thị trên trang chủ — 3 danh mục đầu sẽ làm banner bộ sưu tập
          </p>
        </div>
        <div className="mt-4">
          <HomepageFeaturedCategories
            categories={categories}
            selected={settings.featuredCategoryValues}
          />
        </div>
      </section>

      {/* ── BANNER BỘ SƯU TẬP ── */}
      <section>
        <div className="border-b border-line pb-3">
          <h2 className="font-semibold text-ink">Banner bộ sưu tập</h2>
          <p className="mt-0.5 text-xs text-muted">
            Ảnh banner hiển thị trên trang chủ cho 3 danh mục đầu tiên — click để upload ảnh mới
          </p>
        </div>
        <div className="mt-4">
          <HomepageCollectionBanners
            categories={categories}
            selectedValues={bannerValues}
          />
        </div>
      </section>

      {/* ── SẢN PHẨM BÁN CHẠY ── */}
      <section>
        <div className="border-b border-line pb-3">
          <h2 className="font-semibold text-ink">Sản phẩm bán chạy</h2>
          <p className="mt-0.5 text-xs text-muted">
            Gắn nhãn &quot;Bán chạy&quot; trực tiếp trên từng sản phẩm để hiển thị ở mục này
          </p>
        </div>
        <div className="mt-4 flex items-start gap-4 rounded border border-line bg-surface p-4">
          <ShoppingBag size={20} className="mt-0.5 shrink-0 text-gold-dark" />
          <div>
            <p className="text-sm text-ink">
              Hiện có <span className="font-semibold">{bestsellerCount}</span> sản phẩm được gắn nhãn <strong>Bán chạy</strong>
              {" "}và <span className="font-semibold">{newCount}</span> sản phẩm gắn nhãn <strong>Mới</strong>.
            </p>
            <p className="mt-1 text-xs text-muted">
              Vào trang chỉnh sửa từng sản phẩm → bật hoặc tắt nhãn &quot;Bán chạy&quot; / &quot;Sản phẩm mới&quot;.
            </p>
            <Link
              href="/admin/products"
              className="mt-2 inline-block text-sm text-blue-600 hover:underline"
            >
              Đi đến quản lý sản phẩm →
            </Link>
          </div>
        </div>
      </section>

      {/* ── BỘ SƯU TẬP MỚI ── */}
      <section>
        <div className="border-b border-line pb-3">
          <h2 className="font-semibold text-ink">Bộ sưu tập mới</h2>
          <p className="mt-0.5 text-xs text-muted">
            Chọn danh mục để hiển thị sản phẩm mới nhất trong mục &quot;Bộ sưu tập mới&quot;
          </p>
        </div>
        <div className="mt-4">
          <HomepageNewCollection
            categories={categories}
            current={settings.newCollectionCategory}
            currentDisplayName={settings.newCollectionDisplayName}
          />
        </div>
      </section>
    </div>
  );
}
