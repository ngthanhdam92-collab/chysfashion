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
  const gallery = variantImgs ?? (product.images.length > 0 ? product.images : []);

  const hasVideo = !!product.videoUrl;
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
  const mainSrc = !isVideoSlide ? (gallery[activeIndex] ?? gallery[0] ?? null) : null;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* ===== GALLERY ===== */}
      <div>

        {/* ── Desktop layout: thumb column LEFT + main image ── */}
        <div className="hidden lg:flex lg:gap-2.5">
          {totalSlides > 1 && (
            <ThumbList
              gallery={gallery}
              hasVideo={hasVideo}
              activeIndex={activeIndex}
              isVideoSlide={isVideoSlide}
              productName={product.name}
              onSelect={setActiveIndex}
              className="flex w-[72px] shrink-0 flex-col gap-2"
            />
          )}
          <div className="relative min-w-0 flex-1">
            <MainMedia isVideoSlide={isVideoSlide} mainSrc={mainSrc} videoUrl={product.videoUrl} productName={product.name} productId={product.id} activeIndex={activeIndex} />
            <NavOverlay show={totalSlides > 1} prev={prev} next={next} index={activeIndex} total={totalSlides} />
          </div>
        </div>

        {/* ── Mobile layout: main image fills width, thumbs overlaid inside ── */}
        <div className="relative lg:hidden">
          <MainMedia isVideoSlide={isVideoSlide} mainSrc={mainSrc} videoUrl={product.videoUrl} productName={product.name} productId={product.id} activeIndex={activeIndex} />
          {totalSlides > 1 && (
            <div className="absolute left-2 top-2 z-10">
              <ThumbList
                gallery={gallery}
                hasVideo={hasVideo}
                activeIndex={activeIndex}
                isVideoSlide={isVideoSlide}
                productName={product.name}
                onSelect={setActiveIndex}
                className="flex w-[48px] flex-col gap-1.5"
              />
            </div>
          )}
          <NavOverlay show={totalSlides > 1} prev={prev} next={next} index={activeIndex} total={totalSlides} />
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

// ── Sub-components ──────────────────────────────────────────────────────────

interface ThumbListProps {
  gallery: string[];
  hasVideo: boolean;
  activeIndex: number;
  isVideoSlide: boolean;
  productName: string;
  onSelect: (i: number) => void;
  className?: string;
}

function ThumbList({ gallery, hasVideo, activeIndex, isVideoSlide, productName, onSelect, className }: ThumbListProps) {
  return (
    <div className={className}>
      {gallery.map((src, i) => (
        <button
          key={src}
          type="button"
          onClick={() => onSelect(i)}
          className={`relative aspect-[3/4] w-full shrink-0 overflow-hidden border-2 transition-colors ${
            activeIndex === i ? "border-gold" : "border-transparent hover:border-line"
          }`}
        >
          <Image src={src} alt={`${productName} ${i + 1}`} fill sizes="72px" className="object-cover" />
        </button>
      ))}
      {hasVideo && (
        <button
          type="button"
          onClick={() => onSelect(gallery.length)}
          className={`relative aspect-[3/4] w-full shrink-0 overflow-hidden border-2 transition-colors flex items-center justify-center bg-ink/10 ${
            isVideoSlide ? "border-gold" : "border-transparent hover:border-line"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-ink/50">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface MainMediaProps {
  isVideoSlide: boolean;
  mainSrc: string | null;
  videoUrl?: string;
  productName: string;
  productId: string;
  activeIndex: number;
}

function MainMedia({ isVideoSlide, mainSrc, videoUrl, productName, productId, activeIndex }: MainMediaProps) {
  if (isVideoSlide && videoUrl) {
    return (
      <video
        // key forces remount → autoPlay fires on every activation
        key={`video-${activeIndex}`}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        controls
        className="aspect-[3/4] w-full bg-ink/5 object-contain"
      />
    );
  }
  if (mainSrc) {
    return (
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
        <Image
          src={mainSrc}
          alt={productName}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover transition-opacity duration-200"
          priority
        />
      </div>
    );
  }
  return <ProductImagePlaceholder seed={productId} />;
}

interface NavOverlayProps {
  show: boolean;
  prev: () => void;
  next: () => void;
  index: number;
  total: number;
}

function NavOverlay({ show, prev, next, index, total }: NavOverlayProps) {
  if (!show) return null;
  return (
    <>
      {/* Counter */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
        <span className="rounded-full bg-ink/50 px-2.5 py-0.5 text-[11px] text-paper backdrop-blur-sm">
          {index + 1} / {total}
        </span>
      </div>
      {/* Arrows */}
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
    </>
  );
}
