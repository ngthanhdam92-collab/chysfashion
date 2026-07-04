"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronRight, ShoppingBag } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import type { Story } from "@/lib/stories";

const STORY_DURATION = 5000;
const TICK = 50;

interface Props {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialIndex, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const story = stories[current];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= stories.length) {
        onClose();
        return;
      }
      setCurrent(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [stories.length, onClose]
  );

  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) goTo(current + 1);
    }, TICK);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, goTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, goTo, onClose]);

  if (!story) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative mx-auto flex h-[90vh] w-full max-w-[400px] flex-col overflow-hidden rounded-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {stories.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30"
            >
              <div
                className="h-full rounded-full bg-white"
                style={{
                  width:
                    i < current ? "100%" : i === current ? `${progress}%` : "0%",
                  transition: i === current ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">
              C
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {story.customerName || "Khách hàng CHYS"}
              </p>
              <p className="text-[10px] text-white/60">
                {current + 1}/{stories.length}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Story image */}
        <div className="relative flex-1 bg-gray-900">
          <Image
            src={story.imageUrl}
            alt={story.customerName || "Story"}
            fill
            className="object-cover"
            sizes="400px"
            priority
          />
          {/* Gradient overlay for product cards */}
          {story.productLinks.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
          )}
        </div>

        {/* Product link cards */}
        {story.productLinks.length > 0 && (
          <div className="absolute inset-x-4 bottom-6 space-y-2">
            {story.productLinks.map((link) => (
              <Link
                key={link.productId}
                href={`/san-pham/${link.productSlug}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2.5 backdrop-blur-sm transition-colors hover:bg-white"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink">
                  <ShoppingBag size={15} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {link.productName}
                  </p>
                  <p className="text-[11px] text-muted">{formatVnd(link.price)}</p>
                </div>
                <ChevronRight size={15} className="shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        )}

        {/* Tap zones: left = prev, right = next */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 cursor-pointer"
          onClick={() => goTo(current - 1)}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 cursor-pointer"
          onClick={() => goTo(current + 1)}
        />
      </div>
    </div>
  );
}
