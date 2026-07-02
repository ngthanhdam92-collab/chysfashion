"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { useCart } from "@/context/cart-context";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [color, setColor] = useState(product.colors[0].name);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        color,
        size,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    handleAddToCart();
    router.push("/gio-hang");
  }

  return (
    <div>
      <p className="text-[12px] tracking-label uppercase text-muted">
        {product.categoryLabel}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink">{product.name}</h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-xl font-medium text-ink">
          {formatVnd(product.price)}
        </span>
        {product.compareAtPrice && (
          <span className="text-sm text-muted line-through">
            {formatVnd(product.compareAtPrice)}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted">
        ★ {product.rating.toFixed(1)} · {product.reviewCount} đánh giá
      </p>

      <div className="mt-8">
        <p className="text-[12px] tracking-label uppercase text-ink">
          Màu sắc — <span className="normal-case text-muted">{color}</span>
        </p>
        <div className="mt-3 flex gap-3">
          {product.colors.map((c) => (
            <button
              key={c.name}
              onClick={() => setColor(c.name)}
              aria-label={c.name}
              className={`h-9 w-9 rounded-full border-2 transition-all ${
                color === c.name ? "border-gold" : "border-transparent"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[12px] tracking-label uppercase text-ink">
          Kích thước
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`min-w-11 border px-3 py-2 text-sm transition-colors ${
                size === s
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-[12px] tracking-label uppercase text-ink">
          Số lượng
        </p>
        <div className="mt-3 flex w-fit items-center border border-line">
          <button
            aria-label="Giảm số lượng"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 hover:bg-cream"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            aria-label="Tăng số lượng"
            onClick={() => setQuantity((q) => q + 1)}
            className="p-3 hover:bg-cream"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleAddToCart}
          className="flex flex-1 items-center justify-center gap-2 border border-ink px-6 py-3.5 text-[12px] tracking-label uppercase text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {added ? (
            <>
              <Check size={16} /> Đã thêm vào giỏ
            </>
          ) : (
            "Thêm vào giỏ hàng"
          )}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 bg-ink px-6 py-3.5 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85"
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}
