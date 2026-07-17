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
  const [street, setStreet] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");

  // Cascading address
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [districts, setDistricts] = useState<{ code: number; name: string }[]>([]);
  const [districtCode, setDistrictCode] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [wards, setWards] = useState<{ code: number; name: string }[]>([]);
  const [wardName, setWardName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  function onProvinceChange(code: string, name: string) {
    setProvinceCode(code);
    setProvinceName(name);
    setDistricts([]);
    setDistrictCode("");
    setDistrictName("");
    setWards([]);
    setWardName("");
    if (!code) return;
    fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts ?? []))
      .catch(() => {});
  }

  function onDistrictChange(code: string, name: string) {
    setDistrictCode(code);
    setDistrictName(name);
    setWards([]);
    setWardName("");
    if (!code) return;
    fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
      .then((r) => r.json())
      .then((d) => setWards(d.wards ?? []))
      .catch(() => {});
  }

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
    if (!provinceName) { setError("Vui lòng chọn tỉnh/thành phố"); return; }
    if (!districtName) { setError("Vui lòng chọn quận/huyện"); return; }
    if (!wardName) { setError("Vui lòng chọn phường/xã"); return; }
    setSubmitting(true);
    setError(null);

    const fullAddress = [street, wardName, districtName].filter(Boolean).join(", ");
    const result = await createOrder({
      fullName,
      phone,
      address: fullAddress,
      city: provinceName,
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
      {/* ── Product grid with inline options ── */}
      <div className="px-2 pt-3 pb-2">
        <div className="mb-2 border-2 border-dashed border-red-500 py-1 text-center text-sm font-bold uppercase text-red-600">
          SẢN PHẨM CỦA SHOP
        </div>
        <div className="grid grid-cols-2 items-start gap-2">
          {products.map((p) => {
            const sel = selections[p.id];
            const checked = !!sel;
            const code = p.variants[0]?.sku || "";
            return (
              <div
                key={p.id}
                className={`border-2 bg-white transition-colors ${checked ? "border-red-500" : "border-gray-200"}`}
              >
                {/* Image — click to toggle */}
                <div
                  className="relative aspect-square w-full cursor-pointer overflow-hidden bg-gray-100"
                  onClick={() => toggleProduct(p)}
                >
                  {(() => {
                    const colorImg = sel?.color
                      ? p.colors.find((c) => c.name === sel.color)?.images?.[0]
                      : undefined;
                    const src = colorImg ?? p.images[0];
                    return src ? (
                      <Image
                        key={src}
                        src={src}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 448px) 50vw, 220px"
                      />
                    ) : null;
                  })()}
                  {checked && (
                    <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500">
                      <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-white stroke-[2.5]">
                        <polyline points="1,5 4,8 11,1" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Price + code — also clickable */}
                <div
                  className="cursor-pointer px-2 py-1.5"
                  onClick={() => toggleProduct(p)}
                >
                  <div className="flex flex-wrap items-baseline gap-1">
                    <span className="text-base font-black text-red-600">
                      {p.price.toLocaleString("vi-VN")}
                    </span>
                    {p.compareAtPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {p.compareAtPrice.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>
                  {code && (
                    <p className="text-xs text-gray-700">
                      MÃ SP: <span className="font-bold text-red-500">{code}</span>
                    </p>
                  )}
                </div>

                {/* Inline options — visible when selected */}
                {checked && sel && (
                  <div className="space-y-2 border-t border-red-100 bg-red-50 px-2 pb-2 pt-2">
                    {p.colors.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Màu</p>
                        <div className="flex flex-wrap gap-1">
                          {p.colors.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => update(p.id, "color", c.name)}
                              className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                                sel.color === c.name
                                  ? "border-red-500 bg-red-500 text-white"
                                  : "border-gray-300 bg-white text-gray-700"
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {p.sizes.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Size</p>
                        <div className="flex flex-wrap gap-1">
                          {p.sizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => update(p.id, "size", s)}
                              className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                                sel.size === s
                                  ? "border-red-500 bg-red-500 text-white"
                                  : "border-gray-300 bg-white text-gray-700"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-semibold uppercase text-gray-500">SL</p>
                      <button
                        type="button"
                        onClick={() => changeQty(p.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-sm text-gray-700"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{sel.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(p.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-sm text-gray-700"
                      >
                        +
                      </button>
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
        <div className="mx-2 mb-4 border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs font-bold uppercase text-gray-700">Thông tin đơn hàng</p>
          </div>
          <div className="divide-y divide-gray-100 px-3">
            {items.map((item) => (
              <div key={item.productId} className="py-2">
                <p className="text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {[item.color, item.size].filter(Boolean).join(" · ")} · SL: {item.quantity}
                  </span>
                  <span className="text-sm font-bold text-red-600">{fmt(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 px-3 py-2 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Phí vận chuyển</span>
              <span>{shipping === 0 ? "Miễn phí" : fmt(shipping)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-red-600">
              <span>Tổng cộng</span>
              <span>{fmt(total)}</span>
            </div>
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
          <select
            value={provinceCode}
            onChange={(e) => {
              const opt = e.target.options[e.target.selectedIndex];
              onProvinceChange(e.target.value, opt.text);
            }}
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none"
          >
            <option value="">Chọn tỉnh / thành phố *</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <select
            value={districtCode}
            disabled={!provinceCode}
            onChange={(e) => {
              const opt = e.target.options[e.target.selectedIndex];
              onDistrictChange(e.target.value, opt.text);
            }}
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Chọn quận / huyện *</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
          <select
            value={wardName}
            disabled={!districtCode}
            onChange={(e) => setWardName(e.target.value)}
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Chọn phường / xã *</option>
            {wards.map((w) => (
              <option key={w.code} value={w.name}>{w.name}</option>
            ))}
          </select>
          <input
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Số nhà, tên đường *"
            className="w-full border border-gray-300 px-3 py-3 text-sm focus:border-red-400 focus:outline-none"
          />
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
