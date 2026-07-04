import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, Gem } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { HomepageCategorySection } from "@/components/homepage-category-section";
import { getAllProducts } from "@/lib/products";
import { getActiveBanners } from "@/lib/banners";
import { getCategories } from "@/lib/categories";
import { getHomepageSettings } from "@/lib/homepage-settings";
import { getActiveStories } from "@/lib/stories";
import { CtaButton } from "@/components/cta-button";

const USPS = [
  { icon: Truck, title: "Miễn phí vận chuyển", desc: "Cho đơn hàng từ 500.000đ" },
  { icon: RotateCcw, title: "Đổi trả 30 ngày", desc: "Đơn giản, không rườm rà" },
  { icon: ShieldCheck, title: "Chất lượng đảm bảo", desc: "Chất liệu tuyển chọn cao cấp" },
  { icon: Gem, title: "Thiết kế độc quyền", desc: "Giới hạn số lượng mỗi bộ sưu tập" },
];

const COLLECTION_GRADIENTS = [
  "from-slate-800 to-slate-600",
  "from-stone-700 to-amber-700",
  "from-emerald-800 to-teal-600",
];

export default async function HomePage() {
  const [products, activeBanners, allCategories, settings, stories] = await Promise.all([
    getAllProducts(),
    getActiveBanners(),
    getCategories(),
    getHomepageSettings(),
    getActiveStories(),
  ]);

  const featuredCategories = settings.featuredCategoryValues
    .map((v) => allCategories.find((c) => c.value === v))
    .filter(Boolean) as typeof allCategories;

  const collectionBanners = featuredCategories.slice(0, 3);

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);

  const newCollectionCat = settings.newCollectionCategory;
  const newArrivals = newCollectionCat
    ? products.filter((p) => p.category === newCollectionCat).slice(0, 6)
    : products.filter((p) => p.isNew).slice(0, 6);

  const newCollectionLabel = newCollectionCat
    ? allCategories.find((c) => c.value === newCollectionCat)?.label ?? "Bộ sưu tập mới"
    : "Bộ sưu tập mới";

  return (
    <div>
      {/* ── 1. HERO BANNER ── */}
      {activeBanners.length > 0 ? (
        <HeroBannerSlider banners={activeBanners} />
      ) : (
        <section className="relative flex min-h-[72vh] items-center overflow-hidden bg-gradient-to-br from-white via-white to-cream">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-[11px] tracking-label uppercase text-gold-dark">
                Bộ sưu tập Thu Đông 2026
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
                Tối giản.<br />Tinh tế. Bền vững.
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
                CHYS Fashion mang đến những thiết kế tối giản, chất liệu cao cấp
                được tuyển chọn kỹ lưỡng — dành cho những ai theo đuổi phong cách sống tinh tế mỗi ngày.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <CtaButton href="/san-pham" variant="primary">Khám phá bộ sưu tập</CtaButton>
                <CtaButton href="/ve-chung-toi" variant="outline">Câu chuyện thương hiệu</CtaButton>
              </div>
            </div>
            <div className="hidden lg:block">
              <ProductImagePlaceholder seed="hero" className="shadow-xl" />
            </div>
          </div>
        </section>
      )}

      {/* ── 2. STORY CIRCLES + NAM/NỮ TOGGLE + CATEGORY CARDS ── */}
      {allCategories.length > 0 && (
        <div className="mx-auto max-w-7xl">
          <HomepageCategorySection
            categories={allCategories}
            stories={stories}
            featuredOrder={settings.featuredCategoryValues}
          />
        </div>
      )}

      {/* ── 3. COLLECTION BANNERS ── */}
      {collectionBanners.length > 0 && (
        <div>
          {collectionBanners.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/san-pham?category=${cat.value}`}
              className={`group relative flex items-center overflow-hidden bg-gradient-to-r ${COLLECTION_GRADIENTS[i]}`}
            >
              <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-8 sm:px-8 sm:py-10">
                <div>
                  <p className="text-[10px] tracking-label uppercase text-white/60">
                    Bộ sưu tập
                  </p>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-white sm:text-3xl">
                    {cat.label}
                  </h3>
                </div>
                <span className="shrink-0 border border-white/70 px-5 py-2.5 text-[11px] tracking-label uppercase text-white transition-colors group-hover:bg-white group-hover:text-ink">
                  MUA NGAY
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── 4. USP BAR ── */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {USPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <Icon size={24} strokeWidth={1.5} className="text-gold-dark" />
              <p className="text-sm font-medium text-ink">{title}</p>
              <p className="text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. SẢN PHẨM BÁN CHẠY — 6 cột ── */}
      {bestSellers.length > 0 && (
        <section className="bg-cream/50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-serif text-2xl text-ink sm:text-3xl">Sản phẩm bán chạy</h2>
              <Link
                href="/san-pham"
                className="text-[11px] tracking-label uppercase text-ink hover:text-gold-dark"
              >
                Xem thêm →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. CAM KẾT KHÁCH HÀNG ── */}
      <section className="bg-ink">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] tracking-label uppercase text-gold">
            Cam kết của chúng tôi
          </p>
          <h2 className="mt-3 font-serif text-2xl text-paper sm:text-3xl lg:text-4xl">
            Trải nghiệm mua sắm 100% hài lòng
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-paper/60">
            Hoàn tiền hoặc đổi hàng trong vòng 30 ngày — không cần lý do. Chất lượng sản phẩm
            được kiểm định nghiêm ngặt trước khi đến tay bạn.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/chinh-sach-doi-tra"
              className="border border-paper/50 px-7 py-3 text-[11px] tracking-label uppercase text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink"
            >
              Chính sách đổi trả
            </Link>
            <Link
              href="/san-pham"
              className="border border-gold bg-gold px-7 py-3 text-[11px] tracking-label uppercase text-paper transition-colors hover:bg-gold/90"
            >
              Mua sắm ngay
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. BỘ SƯU TẬP MỚI — 6 cột ── */}
      {newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-2xl text-ink sm:text-3xl">{newCollectionLabel}</h2>
            <Link
              href={newCollectionCat ? `/san-pham?category=${newCollectionCat}` : "/san-pham"}
              className="text-[11px] tracking-label uppercase text-ink hover:text-gold-dark"
            >
              Xem thêm →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
