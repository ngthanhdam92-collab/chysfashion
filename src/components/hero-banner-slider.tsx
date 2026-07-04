"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroBanner } from "@/components/hero-banner";
import type { Banner } from "@/lib/banners";

const SLIDE_INTERVAL = 5000;
const FADE_DURATION = 400;

export function HeroBannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [displayed, setDisplayed] = useState(banners[0]);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (index === current) return;
      setVisible(false);
      setTimeout(() => {
        setDisplayed(banners[index]);
        setCurrent(index);
        setVisible(true);
      }, FADE_DURATION);
    },
    [current, banners]
  );

  const next = useCallback(
    () => goTo((current + 1) % banners.length),
    [current, banners.length, goTo]
  );

  const prev = useCallback(
    () => goTo((current - 1 + banners.length) % banners.length),
    [current, banners.length, goTo]
  );

  // Auto-advance
  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(next, SLIDE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, next]);

  if (banners.length === 0) return null;
  if (banners.length === 1) return <HeroBanner banner={banners[0]} />;

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (timerRef.current) clearInterval(timerRef.current);
      }}
      onMouseLeave={() => {
        if (banners.length > 1) {
          timerRef.current = setInterval(next, SLIDE_INTERVAL);
        }
      }}
    >
      {/* Slide content */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_DURATION}ms ease-in-out`,
        }}
      >
        <HeroBanner banner={displayed} />
      </div>

      {/* Dots — desktop: absolute bottom trên ảnh / mobile: tự nằm trong text section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 hidden justify-center gap-2 sm:flex">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Banner ${i + 1}`}
            className={`pointer-events-auto h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 bg-paper"
                : "w-2 bg-paper/50 hover:bg-paper/70"
            }`}
          />
        ))}
      </div>

      {/* Dots mobile — bên dưới text section */}
      <div className="flex justify-center gap-2 bg-ink py-3 sm:hidden">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Banner ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 bg-paper"
                : "w-2 bg-paper/40 hover:bg-paper/60"
            }`}
          />
        ))}
      </div>

      {/* Prev/Next arrows (desktop only) */}
      <button
        type="button"
        onClick={prev}
        aria-label="Banner trước"
        className="absolute left-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-paper backdrop-blur-sm transition-colors hover:bg-ink/70 sm:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Banner tiếp"
        className="absolute right-4 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/50 text-paper backdrop-blur-sm transition-colors hover:bg-ink/70 sm:flex"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
