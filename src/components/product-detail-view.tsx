"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/lib/types";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";

export function ProductDetailView({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.name ?? ""
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const colorObj = product.colors.find((c) => c.name === selectedColor);
  const variantImgs =
    colorObj?.images && colorObj.images.length > 0 ? colorObj.images : null;
  const baseGallery = variantImgs ?? (product.images.length > 0 ? product.images : null);

  // Append video as a sentinel so it shows as a thumb
  const hasVideo = !!product.videoUrl;
  const gallery = baseGallery ?? [];
  const totalSlides = gallery.length + (hasVideo ? 1 : 0);

  function handleColorChange(color: string) {
    setSelectedColor(color);
    setActiveIndex(0);
  }

  function prev() {
    setActiveIndex((i) => (i > 0 ? i - 1 : totalSlides - 1));
  }
  function next() {
    setActiveIndex((i) => (i < totalSlides - 1 ? i + 1 : 0));
  }

  const isVideoSlide = hasVideo && activeIndex === gallery.length;
  const mainSrc = !isVideoSlide ? gallery[activeIndex] ?? gallery[0] ?? null : null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* ===== GALLERY ===== */}
      <div className="flex gap-2.5">

        {/* ── Thumbnail column (left) ── */}
        {totalSlides > 1 && (
          <div className="flex w-[64px] shrink-0 flex-col gap-2 sm:w-[72px]">
            {gallery.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative aspect-[3/4] w-full overflow-hidden border-2 transition-colors ${
                  activeIndex === i ? "border-gold" : "border-transparent hover:border-line"
                }`}
              >
                <Image
                  src={src}
                  alt={`${product.name} ${i + 1}`}
                  fill
                  sizes="72px"
                  className="object-cover"
                />
              </button>
            ))}
            {hasVideo && (
              <button
                type="button"
                onClick={() => setActiveIndex(gallery.length)}
                className={`relative aspect-[3/4] w-full overflow-hidden border-2 transition-colors flex items-center justify-center bg-ink/5 ${
                  isVideoSlide ? "border-gold" : "border-transparent hover:border-line"
                }`}
              >
                <span className="text-[9px] tracking-label uppercase text-muted text-center leading-tight">
                  Video
                </span>
              </button>
            )}
          </div>
        )}

        {/* ── Main image / video ── */}
        <div className="relative min-w-0 flex-1">
          {isVideoSlide ? (
            <video
              src={product.videoUrl!}
              controls
              playsInline
              className="aspect-[3/4] w-full bg-ink/5 object-contain"
            />
          ) : mainSrc ? (
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
              <Image
                src={mainSrc}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="object-cover transition-opacity duration-200"
                priority
              />
            </div>
          ) : (
            <ProductImagePlaceholder seed={product.id} />
          )}

          {/* ← → navigation arrows */}
          {totalSlides > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Ảnh trước"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition-colors hover:bg-ink/80"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Ảnh tiếp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-paper backdrop-blur-sm transition-colors hover:bg-ink/80"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Slide counter */}
          {totalSlides > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <span className="rounded-full bg-ink/50 px-2.5 py-0.5 text-[11px] text-paper backdrop-blur-sm">
                {activeIndex + 1} / {totalSlides}
              </span>
            </div>
          )}
        </div>
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
