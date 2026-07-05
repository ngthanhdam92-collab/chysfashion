import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import { CountdownTimer } from "./countdown-timer";
import { ProductImagePlaceholder } from "./product-image-placeholder";
import type { Product } from "@/lib/types";
import type { FlashSaleWithProducts } from "@/lib/flash-sales";

interface Props {
  sale: FlashSaleWithProducts;
  products: Product[];
}

export function FlashSaleSection({ sale, products }: Props) {
  const saleProducts = products
    .filter((p) => sale.productIds.includes(p.id))
    .slice(0, 6);

  if (saleProducts.length === 0) return null;

  return (
    <section className="bg-red-50 border-y border-red-200">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-1.5">
              <Flame size={16} className="text-white" fill="white" />
              <span className="text-[12px] font-black uppercase tracking-widest text-white">
                Flash Sale
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-ink">{sale.name}</p>
              <p className="text-xs text-muted">
                Giảm <span className="font-semibold text-red-600">{sale.discountPercent}%</span> tất cả sản phẩm trong danh sách
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">Kết thúc sau</span>
            <CountdownTimer endTime={sale.endTime} size="lg" />
          </div>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {saleProducts.map((product) => {
            const flashPrice = Math.round(product.price * (1 - sale.discountPercent / 100));
            const cover = product.images[0];
            return (
              <Link
                key={product.id}
                href={`/san-pham/${product.slug}`}
                className="group relative flex flex-col overflow-hidden rounded border border-red-200 bg-white transition-shadow hover:shadow-md"
              >
                {/* Badge */}
                <div className="absolute left-2 top-2 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -{sale.discountPercent}%
                </div>

                {/* Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ProductImagePlaceholder seed={product.id} className="h-full w-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-0.5 p-2.5">
                  <p className="line-clamp-2 text-[11px] leading-snug text-ink group-hover:text-red-600">
                    {product.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                    <span className="text-sm font-bold text-red-600">{formatVnd(flashPrice)}</span>
                    <span className="text-[11px] text-muted line-through">{formatVnd(product.price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {sale.productIds.length > 6 && (
          <div className="mt-5 text-center">
            <Link
              href="/san-pham"
              className="inline-block border border-red-600 px-8 py-2.5 text-[11px] font-medium uppercase tracking-label text-red-600 transition-colors hover:bg-red-600 hover:text-white"
            >
              Xem tất cả sản phẩm flash sale
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
