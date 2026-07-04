import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, Gem } from "lucide-react";
import { CtaButton } from "@/components/cta-button";
import { ProductCard } from "@/components/product-card";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { HeroBannerSlider } from "@/components/hero-banner-slider";
import { getAllProducts } from "@/lib/products";
import { getActiveBanners } from "@/lib/banners";

const USPS = [
  { icon: Truck, title: "Miễn phí vận chuyển", desc: "Cho đơn hàng từ 500.000đ" },
  { icon: RotateCcw, title: "Đổi trả 30 ngày", desc: "Đơn giản, không rườm rà" },
  { icon: ShieldCheck, title: "Chất lượng đảm bảo", desc: "Chất liệu tuyển chọn cao cấp" },
  { icon: Gem, title: "Thiết kế độc quyền", desc: "Giới hạn số lượng mỗi bộ sưu tập" },
];

const CATEGORY_TILES = [
  { label: "Thời trang Nam", href: "/san-pham?gender=nam", seed: "cat-nam" },
  { label: "Thời trang Nữ", href: "/san-pham?gender=nu", seed: "cat-nu" },
  { label: "Phụ kiện", href: "/san-pham?category=phu-kien", seed: "cat-pk" },
];

export default async function HomePage() {
  const [products, activeBanners] = await Promise.all([
    getAllProducts(),
    getActiveBanners(),
  ]);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);
  return (
    <div>
      {/* Hero */}
      {activeBanners.length > 0 ? (
        <HeroBannerSlider banners={activeBanners} />
      ) : (
        <section className="relative flex min-h-[78vh] items-center overflow-hidden bg-gradient-to-br from-white via-white to-cream">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-[12px] tracking-label uppercase text-gold-dark">
                Bộ sưu tập Thu Đông 2026
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl lg:text-6xl">
                Tối giản.
                <br />
                Tinh tế. Bền vững.
              </h1>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink/70">
                CHYS Fashion mang đến những thiết kế tối giản, chất liệu cao cấp
                được tuyển chọn kỹ lưỡng — dành cho những ai theo đuổi phong
                cách sống tinh tế mỗi ngày.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <CtaButton href="/san-pham" variant="primary">
                  Khám phá bộ sưu tập
                </CtaButton>
                <CtaButton href="/ve-chung-toi" variant="outline">
                  Câu chuyện thương hiệu
                </CtaButton>
              </div>
            </div>
            <div className="hidden lg:block">
              <ProductImagePlaceholder seed="hero" className="shadow-xl" />
            </div>
          </div>
        </section>
      )}

      {/* USP bar */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {USPS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center">
              <Icon size={26} strokeWidth={1.5} className="text-gold-dark" />
              <p className="text-sm font-medium text-ink">{title}</p>
              <p className="text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">
            Danh mục nổi bật
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CATEGORY_TILES.map((tile) => (
            <Link key={tile.label} href={tile.href} className="group block">
              <div className="relative overflow-hidden">
                <ProductImagePlaceholder
                  seed={tile.seed}
                  className="transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/50 via-transparent to-transparent p-5">
                  <span className="text-[13px] tracking-label uppercase text-paper">
                    {tile.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="bg-cream/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-2xl text-ink sm:text-3xl">
              Sản phẩm bán chạy
            </h2>
            <Link
              href="/san-pham"
              className="text-[12px] tracking-label uppercase text-ink hover:text-gold-dark"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-serif text-2xl text-ink sm:text-3xl">
            Bộ sưu tập mới
          </h2>
          <Link
            href="/san-pham?filter=moi"
            className="text-[12px] tracking-label uppercase text-ink hover:text-gold-dark"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Brand story */}
      <section className="bg-cream/50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <ProductImagePlaceholder seed="story" className="order-2 lg:order-1" />
          <div className="order-1 flex flex-col justify-center lg:order-2">
            <p className="text-[12px] tracking-label uppercase text-gold-dark">
              Câu chuyện thương hiệu
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-ink sm:text-4xl">
              Được tạo nên bởi sự tận tâm với từng đường kim mũi chỉ
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
              CHYS Fashion ra đời từ niềm tin rằng thời trang cao cấp không
              cần phô trương — mà nằm ở chất liệu thật, đường may tỉ mỉ và
              thiết kế vượt thời gian. Mỗi sản phẩm đều được chọn lọc kỹ lưỡng
              để đồng hành cùng bạn trong nhiều năm tới.
            </p>
            <div className="mt-8">
              <CtaButton href="/ve-chung-toi" variant="primary">
                Tìm hiểu thêm
              </CtaButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
