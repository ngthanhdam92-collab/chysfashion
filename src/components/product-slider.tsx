"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

interface Props {
  products: Product[];
  desktopCols?: 4 | 6;
}

export function ProductSlider({ products, desktopCols = 6 }: Props) {
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
    return () => el?.removeEventListener("scroll", update);
  }, []);

  function slide(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardW = el.querySelector("div")?.offsetWidth ?? 160;
    el.scrollBy({ left: dir === "right" ? cardW + 16 : -(cardW + 16), behavior: "smooth" });
  }

  const gridClass =
    desktopCols === 4
      ? "sm:grid-cols-4"
      : "sm:grid-cols-3 lg:grid-cols-6";

  return (
    <>
      {/* ── MOBILE: carousel with arrows ── */}
      <div className="relative sm:hidden">
        {canLeft && (
          <button
            type="button"
            onClick={() => slide("left")}
            aria-label="Trước"
            className="absolute -left-2 top-1/3 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-md"
          >
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
        )}
        {canRight && (
          <button
            type="button"
            onClick={() => slide("right")}
            aria-label="Tiếp"
            className="absolute -right-2 top-1/3 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white shadow-md"
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((product) => (
            <div key={product.id} className="w-[168px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* ── DESKTOP: regular grid ── */}
      <div className={`hidden sm:grid sm:gap-x-4 sm:gap-y-8 ${gridClass}`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
