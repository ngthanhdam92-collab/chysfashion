"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";

export function ProductDetailView({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.name ?? ""
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // Pick images for the selected color; fall back to main product images
  const colorObj = product.colors.find((c) => c.name === selectedColor);
  const variantImgs =
    colorObj?.images && colorObj.images.length > 0
      ? colorObj.images
      : null;
  const gallery = variantImgs ?? (product.images.length > 0 ? product.images : null);

  // Reset thumb index when color changes
  function handleColorChange(color: string) {
    setSelectedColor(color);
    setActiveIndex(0);
  }

  const mainSrc = gallery?.[activeIndex] ?? gallery?.[0] ?? null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* ===== GALLERY ===== */}
      <div>
        {/* Main image */}
        {mainSrc ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
            <Image
              src={mainSrc}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-opacity duration-200"
              priority
            />
          </div>
        ) : (
          <ProductImagePlaceholder seed={product.id} />
        )}

        {/* Thumbnail strip */}
        {gallery && gallery.length > 1 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {gallery.slice(0, 8).map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-[3/4] overflow-hidden bg-cream border-2 transition-colors ${
                  activeIndex === i ? "border-gold" : "border-transparent"
                }`}
              >
                <Image
                  src={src}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Video */}
        {product.videoUrl && (
          <video
            src={product.videoUrl}
            controls
            playsInline
            className="mt-3 w-full bg-ink/5"
          />
        )}
      </div>

      {/* ===== PURCHASE PANEL ===== */}
      <div>
        <ProductPurchasePanel
          product={product}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
        />
      </div>
    </div>
  );
}
