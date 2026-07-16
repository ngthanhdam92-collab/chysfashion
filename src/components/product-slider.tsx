"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  desktopCols?: 4 | 6;
  viewMoreHref?: string;
}

export function ProductSlider({ products, desktopCols = 6, viewMoreHref }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  function update() {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    update();
    const el = scrollRef.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function slide(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector(".slider-card") as HTMLElement;
    const amount = (card?.offsetWidth ?? 168) + 16;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  }

  // 2 cards visible on mobile; desktopCols on larger breakpoints
  const cardClass =
    desktopCols === 4
      ? "w-[calc(50%-8px)] sm:w-[calc(25%-12px)]"
      : "w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(16.667%-14px)]";

  return (
    <div className="relative">
      {canLeft && (
        <button
          type="button"
          onClick={() => slide("left")}
          aria-label="Trước"
          className="absolute -left-3 top-1/3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-md sm:flex"
        >
          <ChevronLeft size={16} strokeWidth={2} />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => slide("right")}
          aria-label="Tiếp"
          className="absolute -right-3 top-1/3 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-md sm:flex"
        >
          <ChevronRight size={16} strokeWidth={2} />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <div key={product.id} className={`slider-card shrink-0 ${cardClass}`}>
            <ProductCard product={product} />
          </div>
        ))}
        {viewMoreHref && (
          <div className={`slider-card shrink-0 ${cardClass}`}>
            <Link
              href={viewMoreHref}
              className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 border border-line bg-white transition-colors hover:border-gold/50 hover:bg-cream/40"
            >
              <ArrowRight size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-600 underline underline-offset-2">
                Xem thêm
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
