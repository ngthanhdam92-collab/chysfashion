"use client";

import { useEffect, useState } from "react";

export interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string | null;
  categoryLabel: string;
}

const KEY = "chys_recently_viewed";
const MAX = 10;

function load(): RecentProduct[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(items: RecentProduct[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useRecentlyViewed(currentId?: string) {
  const [items, setItems] = useState<RecentProduct[]>([]);

  // Load on mount (after hydration)
  useEffect(() => {
    setItems(load().filter((p) => p.id !== currentId));
  }, [currentId]);

  function addProduct(product: RecentProduct) {
    const existing = load().filter((p) => p.id !== product.id);
    const updated = [product, ...existing].slice(0, MAX);
    save(updated);
  }

  return { items, addProduct };
}
