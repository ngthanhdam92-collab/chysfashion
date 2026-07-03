"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { ProductImagePlaceholder } from "@/components/product-image-placeholder";
import { ProductPurchasePanel } from "@/components/product-purchase-panel";

export function ProductDetailView({ product, suggestedProducts }: { product: Product; suggestedProducts?: Product[] }) {
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.name ?? ""
  );
  // Start at index 0 = video (if exists), else first image
  const [activeIndex, setActiveIndex] = useState(0);

  // When a color is selected and has variant images, override the main display
  // with that color's variant image (clicking a thumbnail clears this override)
  const [colorOverrideSrc, setColorOverrideSrc] = useState<string | null>(
    () => product.colors[0]?.images?.[0] ?? null
  );

  // Gallery luôn là ảnh sản phẩm (bìa + chi tiết)
  // Ảnh biến thể màu chỉ dùng trong bộ chọn màu ở purchase panel
  const gallery = product.images;

  const hasVideo = !!product.videoUrl;

  // Slide order: [video (index 0), image0 (index 1), image1 (index 2), ...]
  // If no video: [image0 (index 0), image1 (index 1), ...]
  const totalSlides = (hasVideo ? 1 : 0) + gallery.length;
  // Color override suppresses video: if a color variant image is active, show it instead
  const isVideoSlide = !colorOverrideSrc && hasVideo && activeIndex === 0;
  // imageIndex in gallery array: when video is first, images start at index 1
  const galleryIndex = hasVideo ? activeIndex - 1 : activeIndex;
  const galleryMainSrc = !isVideoSlide ? (gallery[galleryIndex] ?? gallery[0] ?? null) : null;
  // Color variant overrides gallery image (cleared when user manually picks a thumbnail)
  const mainSrc = !isVideoSlide ? (colorOverrideSrc ?? galleryMainSrc) : null;

  function handleColorChange(color: string) {
    setSelectedColor(color);
    const colorObj = product.colors.find((c) => c.name === color);
    setColorOverrideSrc(colorObj?.images?.[0] ?? null);
  }

  function handleThumbSelect(index: number) {
    setColorOverrideSrc(null); // user manually navigates gallery → clear color override
    setActiveIndex(index);
  }

  function prev() {
    setColorOverrideSrc(null);
    setActiveIndex((i) => (i > 0 ? i - 1 : totalSlides - 1));
  }
  function next() {
    setColorOverrideSrc(null);
    setActiveIndex((i) => (i < totalSlides - 1 ? i + 1 : 0));
  }

  const thumbProps = {
    gallery,
    hasVideo,
    videoUrl: product.videoUrl ?? "",
    activeIndex: colorOverrideSrc ? -1 : activeIndex, // no thumb highlighted when override active
    isVideoSlide,
    productName: product.name,
    onSelect: handleThumbSelect,
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
      {/* ===== GALLERY ===== */}
      <div>

        {/* ── Desktop: thumb column LEFT + main image ── */}
        <div className="hidden lg:flex lg:gap-2.5">
          {totalSlides > 1 && (
            <ThumbList {...thumbProps} className="flex w-[72px] shrink-0 flex-col gap-2" />
          )}
          <div className="relative min-w-0 flex-1">
            <MainMedia isVideoSlide={isVideoSlide} mainSrc={mainSrc} videoUrl={product.videoUrl} productName={product.name} productId={product.id} activeIndex={activeIndex} />
            <NavOverlay show={totalSlides > 1} prev={prev} next={next} index={activeIndex} total={totalSlides} />
          </div>
        </div>

        {/* ── Mobile: full-width image, thumbs overlaid inside top-left ── */}
        <div className="relative lg:hidden">
          <MainMedia isVideoSlide={isVideoSlide} mainSrc={mainSrc} videoUrl={product.videoUrl} productName={product.name} productId={product.id} activeIndex={activeIndex} />
          {totalSlides > 1 && (
            <div className="absolute left-2 top-2 z-10">
              <ThumbList {...thumbProps} className="flex w-[48px] flex-col gap-1.5" />
            </div>
          )}
          <NavOverlay show={totalSlides > 1} prev={prev} next={next} index={activeIndex} total={totalSlides} />
        </div>
      </div>

      {/* ===== PURCHASE PANEL + SUGGESTIONS ===== */}
      <div className="space-y-8">
        <ProductPurchasePanel
          product={product}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
        />
        {suggestedProducts && suggestedProducts.length > 0 && (
          <RelatedSuggestions products={suggestedProducts} />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface ThumbListProps {
  gallery: string[];
  hasVideo: boolean;
  videoUrl: string;
  activeIndex: number;
  isVideoSlide: boolean;
  productName: string;
  onSelect: (i: number) => void;
  className?: string;
}

function ThumbList({ gallery, hasVideo, videoUrl, activeIndex, isVideoSlide, productName, onSelect, className }: ThumbListProps) {
  return (
    <div className={className}>
      {/* Video thumbnail FIRST */}
      {hasVideo && (
        <button
          type="button"
          onClick={() => onSelect(0)}
          className={`relative aspect-[3/4] w-full shrink-0 overflow-hidden border-2 transition-colors ${
            isVideoSlide ? "border-gold" : "border-transparent hover:border-line"
          }`}
        >
          {/* Show first frame of video via preload="metadata" */}
          <video
            src={videoUrl}
            preload="metadata"
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-ink/20">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-paper/80">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-ink">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Image thumbnails */}
      {gallery.map((src, i) => {
        // When video is first, image i lives at slide index i+1
        const slideIndex = hasVideo ? i + 1 : i;
        return (
          <button
            key={src}
            type="button"
            onClick={() => onSelect(slideIndex)}
            className={`relative aspect-[3/4] w-full shrink-0 overflow-hidden border-2 transition-colors ${
              activeIndex === slideIndex ? "border-gold" : "border-transparent hover:border-line"
            }`}
          >
            <Image src={src} alt={`${productName} ${i + 1}`} fill sizes="72px" className="object-cover" />
          </button>
        );
      })}
    </div>
  );
}

interface MainMediaProps {
  isVideoSlide: boolean;
  mainSrc: string | null;
  videoUrl?: string | null;
  productName: string;
  productId: string;
  activeIndex: number;
}

function MainMedia({ isVideoSlide, mainSrc, videoUrl, productName, productId, activeIndex }: MainMediaProps) {
  if (isVideoSlide && videoUrl) {
    return (
      <video
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
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
        <span className="rounded-full bg-ink/50 px-2.5 py-0.5 text-[11px] text-paper backdrop-blur-sm">
          {index + 1} / {total}
        </span>
      </div>
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

// ── Related Suggestions ─────────────────────────────────────────────────────

function RelatedSuggestions({ products }: { products: Product[] }) {
  const list = products.slice(0, 4);
  return (
    <div className="border border-line">
      <div className="border-b border-line px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink">
          Gợi ý xem thêm
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-line">
        {list.map((p) => {
          const cover = p.images[0];
          const discount =
            p.compareAtPrice && p.compareAtPrice > p.price
              ? Math.round((1 - p.price / p.compareAtPrice) * 100)
              : null;
          return (
            <Link
              key={p.id}
              href={`/san-pham/${p.slug}`}
              className="group flex gap-3 p-3 transition-colors hover:bg-cream"
            >
              <div className="relative h-16 w-12 shrink-0 overflow-hidden bg-cream">
                {cover ? (
                  <Image src={cover} alt={p.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-line" />
                )}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-[11px] leading-snug text-ink group-hover:text-gold-dark">
                  {p.name}
                </p>
                <p className="mt-1 text-[11px] font-bold text-ink">{formatVnd(p.price)}</p>
                {discount && (
                  <span className="mt-0.5 inline-block rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    -{discount}%
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
