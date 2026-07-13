"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

const STORAGE_KEY = "chys-wishlist";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
}

interface WishlistContextValue {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  removeItem: (slug: string) => void;
  isInWishlist: (slug: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function toggleItem(item: WishlistItem) {
    setItems((prev) =>
      prev.some((i) => i.slug === item.slug)
        ? prev.filter((i) => i.slug !== item.slug)
        : [...prev, item]
    );
  }

  function removeItem(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  function isInWishlist(slug: string) {
    return items.some((i) => i.slug === slug);
  }

  const count = useMemo(() => items.length, [items]);

  return (
    <WishlistContext.Provider value={{ items, toggleItem, removeItem, isInWishlist, count }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
