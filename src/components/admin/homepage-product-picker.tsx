"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { updateProductFlag } from "@/lib/products-actions";
import type { Product } from "@/lib/types";

interface HomepageProductPickerProps {
  products: Product[];
  flag: "is_bestseller" | "is_new";
  label: string;
  limit?: number;
}

export function HomepageProductPicker({ products, flag, label, limit = 8 }: HomepageProductPickerProps) {
  const [states, setStates] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const p of products) {
      m[p.id] = flag === "is_bestseller" ? p.isBestSeller : p.isNew;
    }
    return m;
  });
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = Object.values(states).filter(Boolean).length;
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    const next = !states[id];
    setStates((s) => ({ ...s, [id]: next }));
    startTransition(async () => {
      const res = await updateProductFlag(id, flag, next);
      if (res?.error) {
        setError(res.error);
        setStates((s) => ({ ...s, [id]: !next }));
      }
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted">
          Đang hiển thị <span className="font-semibold text-ink">{selected}</span> sản phẩm
          {selected > limit && (
            <span className="ml-1.5 text-amber-600">(khuyến nghị tối đa {limit})</span>
          )}
        </p>
        {isPending && <span className="text-xs text-muted">Đang lưu…</span>}
      </div>

      {error && (
        <div className="mb-3 rounded border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm…"
          className="w-full border border-line bg-white py-2 pl-8 pr-3 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
        />
      </div>

      {/* Product list */}
      <div className="max-h-80 divide-y divide-line overflow-y-auto border border-line">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Không tìm thấy sản phẩm</p>
        ) : (
          filtered.map((p) => {
            const cover = p.images[0];
            const checked = states[p.id] ?? false;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-cream ${
                  checked ? "bg-gold/5" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-10 w-8 shrink-0 overflow-hidden bg-line">
                  {cover ? (
                    <Image src={cover} alt={p.name} fill sizes="32px" className="object-cover" />
                  ) : null}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{p.name}</p>
                  <p className="text-xs text-stone">{p.categoryLabel}</p>
                </div>

                {/* Toggle */}
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 accent-gold-dark"
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
