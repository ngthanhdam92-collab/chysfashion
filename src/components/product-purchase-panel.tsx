"use client";

import { useState } from "react";
import Image from "next/image";
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
      <p className="text-[12px] tracking-label uppercase text-muted">
        {product.categoryLabel}
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink">{product.name}</h1>

      <div className="mt-4 flex items-center gap-3">
        <span className="text-xl font-medium text-ink">{formatVnd(price)}</span>
        {compareAtPrice && compareAtPrice > price && (
          <span className="text-sm text-muted line-through">
            {formatVnd(compareAtPrice)}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted">
        ★ {product.rating.toFixed(1)} · {product.reviewCount} đánh giá
      </p>

      {product.colors.length > 0 && (
        <div className="mt-8">
          <p className="text-[12px] tracking-label uppercase text-ink">
            Phân loại — <span className="normal-case font-medium text-ink">{activeColor}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const thumb = c.images?.[0];
              const isActive = activeColor === c.name;
              return thumb ? (
                // Có ảnh biến thể → hiển thị thumbnail
                <button
                  key={c.name}
                  onClick={() => handleColorSelect(c.name)}
                  aria-label={c.name}
                  title={c.name}
                  className={`relative h-14 w-14 overflow-hidden border-2 transition-all ${
                    isActive ? "border-gold" : "border-line hover:border-ink"
                  }`}
                >
                  <Image src={thumb} alt={c.name} fill sizes="56px" className="object-cover" />
                </button>
              ) : (
                // Không có ảnh → hiển thị text button
                <button
                  key={c.name}
                  onClick={() => handleColorSelect(c.name)}
                  className={`border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink hover:border-ink"
                  }`}
                >
                  {c.name}
                </button>
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
