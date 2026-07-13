"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/context/wishlist-context";
import { formatVnd } from "@/lib/utils";
import { CtaButton } from "./cta-button";
import { ProductImagePlaceholder } from "./product-image-placeholder";

export function WishlistView() {
  const { items, removeItem } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Heart size={52} className="mb-4 text-muted/30" strokeWidth={1.25} />
        <h2 className="font-serif text-xl text-ink">Chưa có sản phẩm yêu thích</h2>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Nhấn biểu tượng trái tim trên sản phẩm để lưu vào danh sách của bạn.
        </p>
        <div className="mt-6">
          <CtaButton href="/san-pham" variant="primary">Khám phá sản phẩm</CtaButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-6 text-sm text-muted">{items.length} sản phẩm yêu thích</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.slug} className="group">
            {/* Image */}
            <div className="relative overflow-hidden">
              <Link href={`/san-pham/${item.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ProductImagePlaceholder seed={item.productId} className="h-full w-full" />
                  )}
                </div>
              </Link>

              {/* Remove from wishlist */}
              <button
                type="button"
                onClick={() => removeItem(item.slug)}
                aria-label="Xóa khỏi yêu thích"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition-colors hover:bg-white"
              >
                <Heart size={15} className="fill-red-500" />
              </button>
            </div>

            {/* Info */}
            <div className="mt-2 space-y-1">
              <Link href={`/san-pham/${item.slug}`} className="block">
                <h3 className="line-clamp-2 text-sm text-ink transition-colors group-hover:text-gold-dark">
                  {item.name}
                </h3>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-ink">{formatVnd(item.price)}</span>
                {item.compareAtPrice && item.compareAtPrice > item.price && (
                  <span className="text-xs text-muted line-through">
                    {formatVnd(item.compareAtPrice)}
                  </span>
                )}
              </div>
              <Link
                href={`/san-pham/${item.slug}`}
                className="mt-2 flex w-full items-center justify-center gap-2 border border-ink py-2 text-[11px] tracking-label uppercase text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                <ShoppingBag size={13} />
                Xem & Mua
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
