"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { createOrder } from "@/lib/orders";

interface Props {
  products: Product[];
}

interface SelectedItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
}

type Selections = Record<string, SelectedItem | undefined>;

function fmt(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function CampaignOrderForm({ products }: Props) {
  const [selections, setSelections] = useState<Selections>({});
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  function toggleProduct(p: Product) {
    setSelections((prev) => {
      if (prev[p.id]) {
        const next = { ...prev };
        delete next[p.id];
        return next;
      }
      return {
        ...prev,
        [p.id]: {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          price: p.price,
          color: p.colors[0]?.name ?? "",
          size: p.sizes[0] ?? "",
          quantity: 1,
        },
      };
    });
  }

  function update(productId: string, field: keyof SelectedItem, value: string | number) {
    setSelections((prev) => ({
      ...prev,
      [productId]: { ...prev[productId]!, [field]: value },
    }));
  }

  function changeQty(productId: string, delta: number) {
    const sel = selections[productId];
    if (!sel) return;
    const next = Math.max(1, sel.quantity + delta);
    update(productId, "quantity", next);
  }

  const items = Object.values(selections).filter(Boolean) as SelectedItem[];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shipping;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) { setError("Vui lòng chọn ít nhất 1 sản phẩm"); return; }
    setSubmitting(true);
    setError(null);

    const result = await createOrder({
      fullName,
      phone,
      address,
      city,
      note,
      items,
      subtotal,
      shipping,
      discount: 0,
      total,
      paymentMethod,
    });

    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    setSuccess(result.orderCode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (success) {
    return (
      <div className="px-4 py-10 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-4 text-lg font-bold text-gray-900">Đặt hàng thành công!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Mã đơn hàng: <span className="font-bold text-red-600">{success}</span>
        </p>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Chúng tôi sẽ liên hệ xác nhận đơn qua số điện thoại trong 30 phút.
          Cảm ơn bạn đã mua hàng tại CHYS Fashion!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} id="order-form">
      {/* ── Product selection ── */}
      <div className="px-3 py-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-800">
          Chọn sản phẩm
        </h3>
        <div className="space-y-3">
          {products.map((p) => {
            const sel = selections[p.id];
            const checked = !!sel;
            return (
              <div
                key={p.id}
                className={`border-2 transition-colors ${checked ? "border-red-500" : "border-gray-200"}`}
              >
                {/* Row: checkbox + image + name/price */}
                <div
                  className="flex cursor-pointer items-center gap-3 p-3"
                  onClick={() => toggleProduct(p)}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                      checked ? "border-red-500 bg-red-500" : "border-gray-300 bg-white"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-white stroke-2">
                        <polyline points="1,5 4,8 11,1" />
                      </svg>
                    )}
                  </div>
                  {p.images[0] && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="56px" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium text-gray-900">{p.name}</p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-red-600">{fmt(p.price)}</span>
                      {p.compareAtPrice && (
                        <span className="text-xs text-gray-400 line-through">{fmt(p.compareAtPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded options */}
                {checked && sel && (
                  <div className="space-y-3 border-t border-gray-100 px-3 pb-3 pt-3">
                    {/* Color */}
                    {p.colors.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs text-gray-500">Màu sắc</p>
                        <div className="flex flex-wrap gap-2">
                          {p.colors.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => update(p.id, "color", c.name)}
                              className={`rounded border px-3 py-1 text-xs transition-colors ${
                                sel.color === c.name
                                  ? "border-red-500 bg-red-50 font-semibold text-red-600"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400"
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Size */}
                    {p.sizes.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs text-gray-500">Size</p>
                        <div className="flex flex-wrap gap-2">
                          {p.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => update(p.id, "size", s)}
                              className={`rounded border px-3 py-1 text-xs transition-colors ${
                                sel.size === s
                                  ? "border-red-500 bg-red-50 font-semibold text-red-600"
                                  : "border-gray-300 text-gray-600 hover:border-gray-400"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-500">Số lượng</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeQty(p.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 hover:border-red-400"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{sel.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(p.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-700 hover:border-red-400"
                        >
                          +
                        </button>
                      </div>
                      <span className="ml-auto text-sm font-bold text-red-600">
                        = {fmt(sel.price * sel.quantity)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Order summary ── */}
      {items.length > 0 && (
        <div className="mx-3 mb-4 bg-gray-50 px-4 py-3 text-sm">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between py-0.5 text-gray-700">
              <span className="line-clamp-1 flex-1 pr-2">{item.name} × {item.quantity}</span>
              <span className="shrink-0 font-medium">{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-gray-500">
            <span>Phí vận chuyển</span>
            <span>{shipping === 0 ? "Miễn phí" : fmt(shipping)}</span>
          </div>
          <div className="mt-1 flex justify-between font-bold text-red-600">
            <span>Tổng cộng</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
      )}

      {/* ── Shipping info ── */}
      <div className="px-3 pb-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-800">
          Thông tin giao hàng
        </h3>
        <div className="space-y-2">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên *"
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none"
          />
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số điện thoại *"
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none"
          />
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Số nhà, tên đường, phường/xã *"
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none"
          />
          <select
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none"
          >
            <option value="">Chọn tỉnh / thành phố *</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.name}>{p.name}</option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú (tuỳ chọn)"
            rows={2}
            className="w-full border border-gray-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
          />
        </div>
      </div>

      {/* ── Payment method ── */}
      <div className="px-3 pb-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-800">
          Thanh toán
        </h3>
        <div className="space-y-2">
          {(["cod", "bank_transfer"] as const).map((method) => (
            <label
              key={method}
              className={`flex cursor-pointer items-start gap-3 rounded border p-3 transition-colors ${
                paymentMethod === method ? "border-red-500 bg-red-50" : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="mt-0.5 accent-red-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {method === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Chuyển khoản ngân hàng"}
                </p>
                <p className="text-xs text-gray-500">
                  {method === "cod"
                    ? "Trả tiền mặt khi nhận hàng"
                    : "Nhân viên sẽ liên hệ gửi thông tin tài khoản"}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-3 mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* ── Submit ── */}
      <div className="px-3 pb-8">
        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="w-full bg-red-600 py-4 text-base font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting
            ? "Đang xử lý..."
            : items.length === 0
            ? "Chọn sản phẩm để đặt hàng"
            : `ĐẶT HÀNG NGAY — ${fmt(total)}`}
        </button>
      </div>
    </form>
  );
}
