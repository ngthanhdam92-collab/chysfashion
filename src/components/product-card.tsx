"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { ProductImagePlaceholder } from "./product-image-placeholder";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const cover = product.images[0];

  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [added, setAdded] = useState(false);

  // Price per selected variant
  const hasVariants = product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.color === selectedColor && v.size === selectedSize)
    : undefined;
  const price =
    selectedVariant?.price && selectedVariant.price > 0
      ? selectedVariant.price
      : product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;

  // Cover image: use selected color's first variant image if available
  const colorObj = product.colors.find((c) => c.name === selectedColor);
  const activeCover = colorObj?.images?.[0] ?? cover;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price,
        color: selectedColor,
        size: selectedSize,
      },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const canQuickAdd = product.stock > 0;

  return (
    <div className="group">
      {/* ── IMAGE AREA ── */}
      <div className="relative overflow-hidden group/img">
        {/* Image — click → product page */}
        <Link href={`/san-pham/${product.slug}`} className="block">
          {activeCover ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
              <Image
                src={activeCover}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>
          ) : (
            <ProductImagePlaceholder
              seed={product.id}
              label={product.categoryLabel}
              className="transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )}
        </Link>

        {/* Badges — float above image, pointer-events-none so link still works */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="bg-ink px-2.5 py-1 text-[10px] tracking-label uppercase text-paper">
              Mới
            </span>
          )}
          {product.compareAtPrice && (
            <span className="bg-gold px-2.5 py-1 text-[10px] tracking-label uppercase text-paper">
              Sale
            </span>
          )}
        </div>

        {/* Out of stock — static banner */}
        {product.stock === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/70 py-2 text-center text-[11px] tracking-label uppercase text-paper">
            Hết hàng
          </div>
        )}

        {/* ── QUICK-ADD PANEL ── always visible on mobile, slides up on desktop hover */}
        {canQuickAdd && (
          <div className="absolute inset-x-0 bottom-0 bg-white/92 px-2 pb-2 pt-2 backdrop-blur-sm transition-transform duration-300 [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover/img:translate-y-0 sm:px-3 sm:pb-3 sm:pt-2.5">
            <p className="mb-2 hidden text-center text-[10px] tracking-label uppercase text-muted sm:mb-2.5 [@media(hover:hover)]:block">
              Thêm nhanh vào giỏ hàng +
            </p>

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mb-1.5 flex flex-wrap justify-center gap-1 sm:mb-2 sm:gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(s);
                    }}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors sm:px-3 sm:py-1 sm:text-xs ${
                      selectedSize === s
                        ? "border-ink bg-ink text-paper"
                        : "border-line text-ink hover:border-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Colors — only when multiple options */}
            {product.colors.length > 1 && (
              <div className="mb-1.5 flex flex-wrap justify-center gap-1 sm:mb-2 sm:gap-1.5">
                {product.colors.map((c) => {
                  const img = c.images?.[0];
                  const isActive = selectedColor === c.name;
                  return img ? (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColor(c.name);
                      }}
                      className={`relative h-6 w-6 overflow-hidden rounded-full border-2 transition-colors ${
                        isActive ? "border-gold" : "border-transparent ring-1 ring-line"
                      }`}
                    >
                      <Image src={img} alt={c.name} fill sizes="24px" className="object-cover" />
                    </button>
                  ) : (
                    <button
                      key={c.name}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColor(c.name);
                      }}
                      className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                        isActive
                          ? "border-ink bg-ink text-paper"
                          : "border-line text-ink hover:border-ink"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add to cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full py-1.5 text-[10px] tracking-label uppercase transition-colors sm:py-2 sm:text-[11px] ${
                added
                  ? "bg-green-600 text-white"
                  : "bg-ink text-paper hover:bg-ink/85"
              }`}
            >
              {added ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Check size={12} /> Đã thêm vào giỏ
                </span>
              ) : (
                "Thêm vào giỏ hàng"
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── COLOR DOTS (always visible below image) ── */}
      {product.colors.some((c) => c.images && c.images.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.colors.map((c) => {
            const img = c.images?.[0];
            if (!img) return null;
            const isActive = selectedColor === c.name;
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                onClick={() => setSelectedColor(c.name)}
                className={`relative h-6 w-6 overflow-hidden rounded-full border-2 transition-colors ${
                  isActive ? "border-gold" : "border-transparent ring-1 ring-line"
                }`}
              >
                <Image src={img} alt={c.name} fill sizes="24px" className="object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── CARD INFO ── */}
      <Link href={`/san-pham/${product.slug}`} className="mt-2 block space-y-1">
        <p className="text-[11px] tracking-label uppercase text-muted">
          {product.categoryLabel}
        </p>
        <h3 className="text-sm text-ink transition-colors group-hover:text-gold-dark">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{formatVnd(price)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-xs text-muted line-through">
              {formatVnd(compareAtPrice)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
