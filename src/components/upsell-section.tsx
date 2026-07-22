"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { formatVnd } from "@/lib/utils";

interface UpsellItem {
  product: Product;
  checked: boolean;
}

export function UpsellSection({
  currentProduct,
  upsellProducts,
}: {
  currentProduct: Product;
  upsellProducts: Product[];
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // State: which products are checked (current product always present but toggleable too)
  const [items, setItems] = useState<UpsellItem[]>([
    { product: currentProduct, checked: true },
    ...upsellProducts.map((p) => ({ product: p, checked: true })),
  ]);

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((it) => (it.product.id === id ? { ...it, checked: !it.checked } : it))
    );
  }

  const checkedItems = items.filter((it) => it.checked);
  const total = checkedItems.reduce((sum, it) => sum + it.product.price, 0);

  function handleAddAll() {
    for (const it of checkedItems) {
      const p = it.product;
      const firstColor = p.colors[0]?.name ?? "";
      const firstSize = p.sizes[0] ?? "";
      addItem(
        {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          color: firstColor,
          size: firstSize,
          image: p.images[0],
        },
        1
      );
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (upsellProducts.length === 0) return null;

  return (
    <div className="border border-line">
      {/* Header */}
      <div className="border-b border-line px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink">
          Mua kèm thường thấy
        </p>
      </div>

      {/* Product images row */}
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 pt-4 pb-3">
        {items.map((it, idx) => (
          <div key={it.product.id} className="flex shrink-0 items-center gap-1.5">
            <div
              className={`relative h-16 w-12 overflow-hidden border-2 transition-all ${
                it.checked ? "border-gold" : "border-line opacity-50"
              }`}
            >
              {it.product.images[0] ? (
                <Image
                  src={it.product.images[0]}
                  alt={it.product.name}
                  fill
                  unoptimized
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-cream" />
              )}
            </div>
            {idx < items.length - 1 && (
              <Plus size={12} className="shrink-0 text-muted" />
            )}
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="divide-y divide-line border-t border-line">
        {items.map((it) => {
          const p = it.product;
          const isCurrent = p.id === currentProduct.id;
          const discount =
            p.compareAtPrice && p.compareAtPrice > p.price
              ? Math.round((1 - p.price / p.compareAtPrice) * 100)
              : null;
          return (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-cream/50"
            >
              <input
                type="checkbox"
                checked={it.checked}
                onChange={() => toggleItem(p.id)}
                className="h-3.5 w-3.5 accent-[#c9a459]"
              />
              <div className="min-w-0 flex-1">
                {isCurrent ? (
                  <span className="line-clamp-1 text-[11px] text-ink">{p.name}</span>
                ) : (
                  <Link
                    href={`/san-pham/${p.slug}`}
                    className="line-clamp-1 text-[11px] text-ink hover:text-gold-dark hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.name}
                  </Link>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {discount && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    -{discount}%
                  </span>
                )}
                <span className="text-[11px] font-bold text-ink">{formatVnd(p.price)}</span>
              </div>
            </label>
          );
        })}
      </div>

      {/* Total + CTA */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <div>
          <p className="text-[10px] text-muted uppercase tracking-label">Tổng</p>
          <p className="text-sm font-bold text-ink">{formatVnd(total)}</p>
        </div>
        <button
          onClick={handleAddAll}
          disabled={checkedItems.length === 0}
          className="flex items-center gap-2 bg-ink px-4 py-2 text-[11px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85 disabled:opacity-40"
        >
          <ShoppingBag size={13} />
          {added
            ? "Đã thêm!"
            : checkedItems.length === items.length
            ? `Thêm ${items.length} sản phẩm`
            : `Thêm ${checkedItems.length} sản phẩm`}
        </button>
      </div>
    </div>
  );
}
