"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatVnd } from "@/lib/utils";
import { useRecentlyViewed, type RecentProduct } from "@/hooks/use-recently-viewed";

interface Props {
  current: RecentProduct;
}

export function RecentlyViewedSection({ current }: Props) {
  const { items, addProduct } = useRecentlyViewed(current.id);

  // Track visit on mount
  useEffect(() => {
    addProduct(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id]);

  if (items.length === 0) return null;

  const display = items.slice(0, 6);

  return (
    <section className="mt-14 border-t border-line pt-10">
      <h2 className="mb-6 text-[12px] font-semibold uppercase tracking-label text-ink">
        Sản phẩm đã xem gần đây
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {display.map((product) => {
          const discount =
            product.compareAtPrice && product.compareAtPrice > product.price
              ? Math.round((1 - product.price / product.compareAtPrice) * 100)
              : null;

          return (
            <Link
              key={product.id}
              href={`/san-pham/${product.slug}`}
              className="group flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-line" />
                )}
                {discount && (
                  <span className="absolute left-2 top-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="mt-2 flex flex-col gap-0.5">
                <p className="line-clamp-2 text-[12px] leading-snug text-ink group-hover:text-gold-dark">
                  {product.name}
                </p>
                <p className="text-xs text-muted">{product.categoryLabel}</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-ink">{formatVnd(product.price)}</span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-[11px] text-muted line-through">
                      {formatVnd(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
