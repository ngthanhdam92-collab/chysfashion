"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { ProductImagePlaceholder } from "./product-image-placeholder";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const wished = isInWishlist(product.slug);
  const cover = product.images[0];
  const hoverImage = product.images[1] ?? null; // second image for hover preview

  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name ?? "");
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? "");
  const [added, setAdded] = useState(false);
  const [colorUserSelected, setColorUserSelected] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasVariants = product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.color === selectedColor && v.size === selectedSize)
    : undefined;
  const price =
    selectedVariant?.price && selectedVariant.price > 0
      ? selectedVariant.price
      : product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;

  // Default cover = images[0]. Only switches to variant image after user explicitly picks a color.
  const colorObj = colorUserSelected ? product.colors.find((c) => c.name === selectedColor) : null;
  const activeCover = colorObj?.images?.[0] ?? cover;
  // When a color is manually selected, use that color's second image as hover preview
  const activeHoverImage = colorUserSelected
    ? (colorObj?.images?.[1] ?? hoverImage)
    : hoverImage;

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price,
      compareAtPrice: compareAtPrice ?? null,
      image: activeCover || null,
    });
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem(
      { productId: product.id, slug: product.slug, name: product.name, price, color: selectedColor, size: selectedSize, image: activeCover || undefined },
      1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  const showHover = hovered && !!activeHoverImage;

  return (
    <div className="group">
      {/* ── IMAGE AREA ── */}
      <div className="relative overflow-hidden group/img">
        <Link href={`/san-pham/${product.slug}`} className="block">
          {activeCover ? (
            <div
              className="relative aspect-[3/4] w-full overflow-hidden bg-cream"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onTouchStart={() => setHovered(true)}
              onTouchEnd={() => setHovered(false)}
            >
              {/* Primary image */}
              <Image
                src={activeCover}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 50vw"
                className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                  showHover ? "opacity-0" : "opacity-100"
                }`}
              />
              {/* Hover preview image — renders only when a second image exists */}
              {activeHoverImage && (
                <Image
                  src={activeHoverImage}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 17vw, (min-width: 640px) 33vw, 50vw"
                  className={`object-cover transition-opacity duration-500 ease-out ${
                    showHover ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </div>
          ) : (
            <ProductImagePlaceholder
              seed={product.id}
              label={product.categoryLabel}
              className="transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="bg-ink px-2.5 py-1 text-[10px] tracking-label uppercase text-paper">Mới</span>
          )}
          {product.compareAtPrice && (
            <span className="bg-gold px-2.5 py-1 text-[10px] tracking-label uppercase text-paper">Sale</span>
          )}
        </div>

        {/* Wishlist toggle */}
        <button
          type="button"
          onClick={handleWishlistToggle}
          aria-label={wished ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart size={15} className={wished ? "fill-red-500 text-red-500" : "text-ink"} />
        </button>

        {/* Out of stock */}
        {product.stock === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/70 py-2 text-center text-[11px] tracking-label uppercase text-paper">
            Hết hàng
          </div>
        )}

        {/* ── QUICK-ADD PANEL — desktop hover only ── */}
        {product.stock > 0 && product.sizes.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 hidden bg-white/92 px-3 pb-3 pt-2.5 backdrop-blur-sm transition-transform duration-300 [@media(hover:hover)]:block [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover/img:translate-y-0">
            <p className="mb-2.5 text-center text-[10px] tracking-label uppercase text-muted">
              Thêm nhanh vào giỏ hàng +
            </p>
            <div className="mb-2 flex flex-wrap justify-center gap-1.5">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(s); }}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    selectedSize === s
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full py-2 text-[11px] tracking-label uppercase transition-colors ${
                added ? "bg-green-600 text-white" : "bg-ink text-paper hover:bg-ink/85"
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

      {/* ── COLOR SWATCHES ── */}
      {product.colors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {product.colors.map((c) => {
            const isActive = selectedColor === c.name;
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                onClick={() => { setSelectedColor(c.name); setColorUserSelected(true); }}
                className={`h-5 w-5 rounded-full border-2 transition-colors ${
                  isActive ? "border-gold" : "border-transparent ring-1 ring-line"
                }`}
                style={{ backgroundColor: c.hex || "#cccccc" }}
              />
            );
          })}
        </div>
      )}

      {/* ── CARD INFO ── */}
      <Link href={`/san-pham/${product.slug}`} className="mt-2 block space-y-1">
        <h3 className="text-sm text-ink transition-colors group-hover:text-gold-dark">{product.name}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-ink">{formatVnd(price)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <>
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                -{Math.round((1 - price / compareAtPrice) * 100)}%
              </span>
              <span className="text-xs text-muted line-through">{formatVnd(compareAtPrice)}</span>
            </>
          )}
        </div>
      </Link>
    </div>
  );
}
