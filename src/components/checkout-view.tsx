"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatVnd } from "@/lib/utils";
import { CtaButton } from "./cta-button";

export function CheckoutView() {
  const { lines, subtotal, clearCart } = useCart();
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    note: "",
  });

  const shipping = subtotal >= 500000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shipping;

  function handleChange(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = `CHYS${Date.now().toString().slice(-8)}`;
    setOrderCode(code);
    clearCart();
  }

  if (orderCode) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CircleCheck size={48} className="text-success" strokeWidth={1.5} />
        <h2 className="mt-5 font-serif text-2xl text-ink">
          Đặt hàng thành công!
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Cảm ơn bạn đã mua sắm tại CHYS Fashion. Mã đơn hàng của bạn là{" "}
          <span className="font-medium text-ink">{orderCode}</span>. Chúng
          tôi sẽ liên hệ để xác nhận đơn hàng qua số điện thoại bạn đã cung
          cấp.
        </p>
        <div className="mt-8">
          <CtaButton href="/san-pham" variant="primary">
            Tiếp tục mua sắm
          </CtaButton>
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-sm text-muted">
          Giỏ hàng trống, không có gì để thanh toán.
        </p>
        <div className="mt-6">
          <CtaButton href="/san-pham" variant="primary">
            Quay lại mua sắm
          </CtaButton>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-10 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        <div>
          <h2 className="text-[12px] tracking-label uppercase text-ink">
            Thông tin giao hàng
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted" htmlFor="fullName">
                Họ và tên *
              </label>
              <input
                id="fullName"
                required
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="mt-1 w-full border border-line bg-surface px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted" htmlFor="phone">
                Số điện thoại *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="mt-1 w-full border border-line bg-surface px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted" htmlFor="city">
                Tỉnh / Thành phố *
              </label>
              <input
                id="city"
                required
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="mt-1 w-full border border-line bg-surface px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted" htmlFor="address">
                Địa chỉ cụ thể *
              </label>
              <input
                id="address"
                required
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="mt-1 w-full border border-line bg-surface px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted" htmlFor="note">
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                id="note"
                rows={3}
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                className="mt-1 w-full border border-line bg-surface px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[12px] tracking-label uppercase text-ink">
            Phương thức thanh toán
          </h2>
          <div className="mt-4 space-y-2">
            <label className="flex items-center gap-3 border border-ink bg-cream/50 px-4 py-3">
              <input type="radio" name="payment" defaultChecked readOnly />
              <span className="text-sm text-ink">
                Thanh toán khi nhận hàng (COD)
              </span>
            </label>
            <label className="flex items-center gap-3 border border-line px-4 py-3 opacity-50">
              <input type="radio" name="payment" disabled />
              <span className="text-sm text-muted">
                VNPay / Momo — sắp ra mắt
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="h-fit border border-line bg-surface p-6">
        <h2 className="text-[12px] tracking-label uppercase text-ink">
          Đơn hàng của bạn
        </h2>
        <div className="mt-4 space-y-3">
          {lines.map((line) => (
            <div
              key={`${line.slug}-${line.color}-${line.size}`}
              className="flex justify-between text-sm"
            >
              <span className="text-muted">
                {line.name} ({line.color}/{line.size}) x{line.quantity}
              </span>
              <span className="text-ink">{formatVnd(line.price * line.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm text-muted">
          <span>Tạm tính</span>
          <span>{formatVnd(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-muted">
          <span>Vận chuyển</span>
          <span>{shipping === 0 ? "Miễn phí" : formatVnd(shipping)}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm font-medium text-ink">
          <span>Tổng cộng</span>
          <span>{formatVnd(total)}</span>
        </div>
        <button
          type="submit"
          className="mt-6 w-full bg-ink px-6 py-3.5 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85"
        >
          Đặt hàng
        </button>
        <Link
          href="/gio-hang"
          className="mt-3 block text-center text-xs text-muted hover:text-ink"
        >
          Quay lại giỏ hàng
        </Link>
      </div>
    </form>
  );
}
