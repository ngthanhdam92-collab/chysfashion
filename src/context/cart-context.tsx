"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { CartLine } from "@/lib/types";

const STORAGE_KEY = "chys-cart";

interface CartContextValue {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeLine: (slug: string, color: string, size: string) => void;
  updateQuantity: (
    slug: string,
    color: string,
    size: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  subtotal: number;
  totalCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(slug: string, color: string, size: string) {
  return `${slug}__${color}__${size}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // One-time sync from localStorage on mount; must run after hydration
      // to avoid SSR/client markup mismatch since localStorage is unavailable on the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupted local storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem: CartContextValue["addItem"] = (line, quantity = 1) => {
    setLines((prev) => {
      const key = lineKey(line.slug, line.color, line.size);
      const existing = prev.find(
        (l) => lineKey(l.slug, l.color, l.size) === key
      );
      if (existing) {
        return prev.map((l) =>
          lineKey(l.slug, l.color, l.size) === key
            ? { ...l, quantity: l.quantity + quantity }
            : l
        );
      }
      return [...prev, { ...line, quantity }];
    });
  };

  const removeLine: CartContextValue["removeLine"] = (slug, color, size) => {
    const key = lineKey(slug, color, size);
    setLines((prev) => prev.filter((l) => lineKey(l.slug, l.color, l.size) !== key));
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (
    slug,
    color,
    size,
    quantity
  ) => {
    const key = lineKey(slug, color, size);
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l.slug, l.color, l.size) !== key)
        : prev.map((l) =>
            lineKey(l.slug, l.color, l.size) === key ? { ...l, quantity } : l
          )
    );
  };

  const clearCart = () => setLines([]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );
  const totalCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{ lines, addItem, removeLine, updateQuantity, clearCart, subtotal, totalCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
