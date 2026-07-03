"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { useCart } from "@/context/cart-context";

interface Props {
  product: Product;
  selectedColor?: string;
  onColorChange?: (color: string) => void;
}

export function ProductPurchasePanel({ product, selectedColor, onColorChange }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [color, setColor] = useState(selectedColor ?? product.colors[0]?.name ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Sync color when parent changes it
  const activeColor = selectedColor ?? color;

  // Có phân loại hàng: giá và tồn kho tính theo tổ hợp Màu × Size đang chọn
  const hasVariants = product.variants.length > 0;
  const selectedVariant = hasVariants
    ? product.variants.find((v) => v.color === activeColor && v.size === size)
    : undefined;
  const price =
    selectedVariant && selectedVariant.price > 0 ? selectedVariant.price : product.price;
  const compareAtPrice =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const availableStock = hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  const outOfStock = availableStock === 0;

  function handleColorSelect(name: string) {
    setColor(name);
    onColorChange?.(name);
  }

  function handleAddToCart() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price,
        color: activeColor,
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
      <h1 className="text-2xl font-bold leading-snug text-ink">{product.name}</h1>

      {/* Stars */}
      <div className="mt-2 flex items-center gap-2">
        <StarRating rating={product.rating} />
        <span className="text-sm text-muted">({product.reviewCount} đánh giá)</span>
      </div>

      {/* Price */}
      <div className="mt-4">
        {compareAtPrice && compareAtPrice > price && (
          <p className="text-sm text-muted line-through">{formatVnd(compareAtPrice)}</p>
        )}
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-bold text-ink">{formatVnd(price)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              -{Math.round((1 - price / compareAtPrice) * 100)}%
            </span>
          )}
        </div>
      </div>

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="text-[12px] tracking-label uppercase text-ink">
            Màu sắc — <span className="normal-case font-medium text-ink">{activeColor}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const isActive = activeColor === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => handleColorSelect(c.name)}
                  title={c.name}
                  className={`h-8 w-14 rounded-full border-2 transition-all ${
                    isActive
                      ? "border-gold shadow-sm ring-2 ring-gold/30"
                      : "border-transparent ring-1 ring-line hover:ring-ink"
                  }`}
                  style={{ backgroundColor: c.hex || "#cccccc" }}
                />
              );
            })}
          </div>
        </div>
      )}

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
        <div className="mt-3 flex items-center gap-3">
          <div className="flex w-fit items-center border border-line">
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
              onClick={() => setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))}
              className="p-3 hover:bg-cream"
            >
              <Plus size={14} />
            </button>
          </div>
          {availableStock > 0 && availableStock <= 5 && (
            <span className="text-xs text-gold-dark">
              Chỉ còn {availableStock} sản phẩm
            </span>
          )}
        </div>
      </div>

      {outOfStock ? (
        <div className="mt-9">
          <div className="w-full border border-line bg-cream/60 px-6 py-3.5 text-center text-[12px] tracking-label uppercase text-muted">
            {hasVariants && product.stock > 0
              ? "Phân loại này tạm hết — vui lòng chọn màu/size khác"
              : "Hết hàng — sẽ sớm có lại"}
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <svg key={star} viewBox="0 0 20 20" className="h-4 w-4">
            <defs>
              <linearGradient id={`half-${star}`}>
                <stop offset="50%" stopColor="#FBBF24" />
                <stop offset="50%" stopColor="#E5E7EB" />
              </linearGradient>
            </defs>
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              fill={filled ? "#FBBF24" : half ? `url(#half-${star})` : "#E5E7EB"}
            />
          </svg>
        );
      })}
    </div>
  );
}
