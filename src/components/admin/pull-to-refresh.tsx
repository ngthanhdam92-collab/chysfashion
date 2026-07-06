"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export function PullToRefresh() {
  const router = useRouter();
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullYRef = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 2) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current) return;
      if (window.scrollY > 2) {
        active.current = false;
        pullYRef.current = 0;
        setPullY(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        e.preventDefault(); // block browser native pull-to-refresh
        const clamped = Math.min(delta * 0.42, THRESHOLD);
        pullYRef.current = clamped;
        setPullY(clamped);
      } else {
        active.current = false;
        pullYRef.current = 0;
        setPullY(0);
      }
    }

    function onTouchEnd() {
      if (!active.current) return;
      active.current = false;
      if (pullYRef.current >= THRESHOLD * 0.85) {
        setRefreshing(true);
        pullYRef.current = 0;
        setPullY(0);
        router.refresh();
        setTimeout(() => setRefreshing(false), 1500);
      } else {
        pullYRef.current = 0;
        setPullY(0);
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [router]);

  if (pullY === 0 && !refreshing) return null;

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[150] flex items-center justify-center transition-all duration-150 ease-out"
      style={{ height: refreshing ? 52 : pullY + 8 }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface shadow-md">
        <RefreshCw
          size={16}
          className={`text-gold-dark ${refreshing ? "animate-spin" : "transition-transform"}`}
          style={
            refreshing
              ? undefined
              : {
                  transform: `rotate(${progress * 360}deg)`,
                  opacity: 0.3 + progress * 0.7,
                }
          }
        />
      </div>
    </div>
  );
}
