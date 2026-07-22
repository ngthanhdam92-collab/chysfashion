"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/context/cart-context";
import { formatVnd } from "@/lib/utils";
import { getShippingRules, calcShippingFee, type ShippingRule } from "@/lib/shipping";
import Image from "next/image";
import { ProductImagePlaceholder } from "./product-image-placeholder";
import { CtaButton } from "./cta-button";

export function CartView() {
  const { lines, updateQuantity, removeLine, subtotal } = useCart();
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);

  useEffect(() => {
    getShippingRules().then(setShippingRules);
  }, []);

  const shipping = calcShippingFee(subtotal, shippingRules);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted">Giỏ hàng của bạn đang trống.</p>
        <div className="mt-6">
          <CtaButton href="/san-pham" variant="primary">
            Tiếp tục mua sắm
          </CtaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="divide-y divide-line border-y border-line">
          {lines.map((line) => (
            <div
              key={`${line.slug}-${line.color}-${line.size}`}
              className="flex gap-4 py-5"
            >
              <Link href={`/san-pham/${line.slug}`} className="w-24 shrink-0">
                {line.image ? (
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
                    <Image
                      src={line.image}
                      alt={line.name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <ProductImagePlaceholder seed={line.productId} />
                )}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link
                      href={`/san-pham/${line.slug}`}
                      className="text-sm font-medium text-ink hover:text-gold-dark"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {line.color} · {line.size}
                    </p>
                  </div>
                  <button
                    onClick={() => removeLine(line.slug, line.color, line.size)}
                    aria-label="Xóa sản phẩm"
                    className="h-fit p-1 text-muted hover:text-error"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-line">
                    <button
                      aria-label="Giảm số lượng"
                      onClick={() =>
                        updateQuantity(line.slug, line.color, line.size, line.quantity - 1)
                      }
                      className="p-2 hover:bg-cream"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <button
                      aria-label="Tăng số lượng"
                      onClick={() =>
                        updateQuantity(line.slug, line.color, line.size, line.quantity + 1)
                      }
                      className="p-2 hover:bg-cream"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {formatVnd(line.price * line.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-fit border border-line bg-surface p-6">
        <h2 className="text-[12px] tracking-label uppercase text-ink">
          Tóm tắt đơn hàng
        </h2>
        <div className="mt-4 flex justify-between text-sm text-muted">
          <span>Tạm tính</span>
          <span>{formatVnd(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted">
          <span>Vận chuyển</span>
          <span className={shipping === 0 ? "font-medium text-green-600" : ""}>
            {shipping === 0 ? "Miễn phí" : formatVnd(shipping)}
          </span>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-medium text-ink">
          <span>Tổng cộng</span>
          <span>{formatVnd(subtotal + shipping)}</span>
        </div>
        <Link
          href="/thanh-toan"
          className="mt-6 block w-full bg-ink px-6 py-3.5 text-center text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85"
        >
          Tiến hành thanh toán
        </Link>
      </div>
    </div>
  );
}
