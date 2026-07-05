"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { CircleCheck, Trash2, Tag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatVnd } from "@/lib/utils";
import { createOrder } from "@/lib/orders";
import { validatePromoCode, type ValidateResult } from "@/lib/promotions-actions";
import { getShippingRules, calcShippingFee, type ShippingRule } from "@/lib/shipping";
import { CtaButton } from "./cta-button";
import { ProductImagePlaceholder } from "./product-image-placeholder";

/* ── Vietnamese address types ── */
interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward    { code: number; name: string; }

const SELECT_CLS =
  "mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none disabled:bg-surface disabled:text-muted";
const INPUT_CLS =
  "mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none";

export function CheckoutView() {
  const { lines, subtotal, clearCart, updateQuantity, removeLine } = useCart();
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── Form fields ── */
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [street, setStreet]     = useState("");
  const [note, setNote]         = useState("");

  /* ── Cascading address ── */
  const [provinces, setProvinces]   = useState<Province[]>([]);
  const [districts, setDistricts]   = useState<District[]>([]);
  const [wards, setWards]           = useState<Ward[]>([]);
  const [province, setProvince]     = useState<Province | null>(null);
  const [district, setDistrict]     = useState<District | null>(null);
  const [ward, setWard]             = useState<Ward | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards]         = useState(false);

  /* ── Promo code ── */
  const [promoInput, setPromoInput]   = useState("");
  const [promoApplied, setPromoApplied] = useState<(ValidateResult & { code: string }) | null>(null);
  const [promoError, setPromoError]   = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  /* ── Shipping rules from DB ── */
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([]);

  /* Load provinces once */
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((r) => r.json())
      .then(setProvinces)
      .catch(() => {});
  }, []);

  /* Load shipping rules once */
  useEffect(() => {
    getShippingRules().then(setShippingRules).catch(() => {});
  }, []);

  /* Load districts when province changes */
  useEffect(() => {
    if (!province) { setDistricts([]); setDistrict(null); setWards([]); setWard(null); return; }
    setLoadingDistricts(true);
    fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`)
      .then((r) => r.json())
      .then((data) => { setDistricts(data.districts ?? []); setDistrict(null); setWards([]); setWard(null); })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [province?.code]);

  /* Load wards when district changes */
  useEffect(() => {
    if (!district) { setWards([]); setWard(null); return; }
    setLoadingWards(true);
    fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
      .then((r) => r.json())
      .then((data) => { setWards(data.wards ?? []); setWard(null); })
      .catch(() => {})
      .finally(() => setLoadingWards(false));
  }, [district?.code]);

  /* ── Computed totals ── */
  const discount = promoApplied ? promoApplied.discount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const baseFee = calcShippingFee(discountedSubtotal, shippingRules);
  const shipping = (promoApplied?.freeShipping) ? 0 : baseFee;
  const total = discountedSubtotal + shipping;

  async function handleApplyPromo() {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    const productSlugs = lines.map((l) => l.slug);
    const result = await validatePromoCode(promoInput.trim(), subtotal, productSlugs);
    setPromoLoading(false);
    if ("error" in result) {
      setPromoError(result.error);
      setPromoApplied(null);
      return;
    }
    setPromoApplied({ ...result, code: promoInput.trim().toUpperCase() });
  }

  function removePromo() {
    setPromoApplied(null);
    setPromoInput("");
    setPromoError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!province || !district || !ward) { setError("Vui lòng chọn đầy đủ tỉnh/quận/phường."); return; }
    setSubmitting(true);
    setError(null);

    const fullAddress = [street, ward.name, district.name, province.name].filter(Boolean).join(", ");

    const result = await createOrder({
      fullName,
      phone,
      address: fullAddress,
      city: province.name,
      note,
      items: lines.map((l) => ({
        productId: l.productId,
        slug: l.slug,
        name: l.name,
        price: l.price,
        color: l.color,
        size: l.size,
        quantity: l.quantity,
      })),
      subtotal,
      shipping,
      discount,
      total,
      promoCode: promoApplied?.code,
    });

    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    setOrderCode(result.orderCode);
    clearCart();
  }

  /* ── Success screen ── */
  if (orderCode) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CircleCheck size={48} className="text-success" strokeWidth={1.5} />
        <h2 className="mt-5 font-serif text-2xl text-ink">Đặt hàng thành công!</h2>
        <p className="mt-2 max-w-md text-sm text-muted">
          Cảm ơn bạn đã mua sắm tại CHYS Fashion. Mã đơn hàng:{" "}
          <span className="font-medium text-ink">{orderCode}</span>.
          Chúng tôi sẽ liên hệ xác nhận qua số điện thoại bạn đã cung cấp.
        </p>
        <div className="mt-8">
          <CtaButton href="/san-pham" variant="primary">Tiếp tục mua sắm</CtaButton>
        </div>
      </div>
    );
  }

  /* ── Empty cart ── */
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-sm text-muted">Giỏ hàng trống, không có gì để thanh toán.</p>
        <div className="mt-6">
          <CtaButton href="/san-pham" variant="primary">Quay lại mua sắm</CtaButton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">

      {/* ── LEFT: Shipping form ── */}
      <div className="space-y-5">
        <h2 className="font-serif text-xl text-ink">Thông tin vận chuyển</h2>

        {/* Name + Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted">Họ tên *</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên của bạn"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Số điện thoại *</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-muted">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Nhập email của bạn"
            className={INPUT_CLS}
          />
        </div>

        {/* Street address */}
        <div>
          <label className="text-xs font-medium text-muted">Địa chỉ (số nhà, tên đường) *</label>
          <input
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="VD: 123 Đường Lê Lợi"
            className={INPUT_CLS}
          />
        </div>

        {/* Province → District → Ward */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">Tỉnh / Thành phố *</label>
            <select
              required
              value={province?.code ?? ""}
              onChange={(e) => {
                const p = provinces.find((x) => x.code === Number(e.target.value)) ?? null;
                setProvince(p);
              }}
              className={SELECT_CLS}
            >
              <option value="">-- Chọn tỉnh --</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Quận / Huyện *</label>
            <select
              required
              disabled={!province || loadingDistricts}
              value={district?.code ?? ""}
              onChange={(e) => {
                const d = districts.find((x) => x.code === Number(e.target.value)) ?? null;
                setDistrict(d);
              }}
              className={SELECT_CLS}
            >
              <option value="">{loadingDistricts ? "Đang tải..." : "-- Chọn quận --"}</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Phường / Xã *</label>
            <select
              required
              disabled={!district || loadingWards}
              value={ward?.code ?? ""}
              onChange={(e) => {
                const w = wards.find((x) => x.code === Number(e.target.value)) ?? null;
                setWard(w);
              }}
              className={SELECT_CLS}
            >
              <option value="">{loadingWards ? "Đang tải..." : "-- Chọn phường --"}</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium text-muted">Ghi chú (tuỳ chọn)</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Yêu cầu đặc biệt, hướng dẫn giao hàng..."
            className={INPUT_CLS}
          />
        </div>

        {/* Payment method */}
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-label text-ink">
            Phương thức thanh toán
          </h3>
          <label className="flex items-center gap-3 border border-ink bg-cream/30 px-4 py-3 cursor-pointer">
            <input type="radio" name="payment" defaultChecked readOnly />
            <span className="text-sm text-ink">Thanh toán khi nhận hàng (COD)</span>
          </label>
          <label className="mt-2 flex items-center gap-3 border border-line px-4 py-3 opacity-40 cursor-not-allowed">
            <input type="radio" name="payment" disabled />
            <span className="text-sm text-muted">VNPay / Momo — sắp ra mắt</span>
          </label>
        </div>
      </div>

      {/* ── RIGHT: Order summary ── */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-ink">Đơn hàng của bạn</h2>

        {/* Product lines */}
        <div className="divide-y divide-line border border-line bg-white">
          {lines.map((line) => (
            <div
              key={`${line.slug}-${line.color}-${line.size}`}
              className="flex gap-4 p-4"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-cream">
                {line.image ? (
                  <Image src={line.image} alt={line.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <ProductImagePlaceholder seed={line.slug} className="h-full w-full" />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-ink leading-snug">{line.name}</p>
                <p className="text-xs text-muted">{line.color} / {line.size}</p>

                {/* Qty controls */}
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-line">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.slug, line.color, line.size, line.quantity - 1)}
                      className="px-2.5 py-1 text-base leading-none text-ink hover:bg-cream"
                    >−</button>
                    <span className="min-w-[1.5rem] text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.slug, line.color, line.size, line.quantity + 1)}
                      className="px-2.5 py-1 text-base leading-none text-ink hover:bg-cream"
                    >+</button>
                  </div>
                  <span className="text-sm font-medium text-ink">{formatVnd(line.price * line.quantity)}</span>
                </div>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeLine(line.slug, line.color, line.size)}
                className="self-start text-muted hover:text-error"
                aria-label="Xóa"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {/* ── Promo code ── */}
        <div className="border border-line bg-white p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-label text-muted">Mã khuyến mại</p>
          {promoApplied ? (
            <div className="flex items-center justify-between rounded bg-green-50 border border-green-200 px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">{promoApplied.code}</span>
                <span className="text-sm text-green-600">— {promoApplied.label}</span>
              </div>
              <button type="button" onClick={removePromo}
                className="text-muted hover:text-error text-xs">Xóa</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyPromo())}
                placeholder="Nhập mã giảm giá"
                className="flex-1 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-4 py-2 bg-ink text-paper text-sm hover:bg-ink/85 disabled:opacity-50"
              >
                {promoLoading ? "..." : "Áp dụng"}
              </button>
            </div>
          )}
          {promoError && (
            <p className="mt-1.5 text-xs text-error">{promoError}</p>
          )}
        </div>

        {/* Totals */}
        <div className="border border-line bg-white p-4 space-y-2">
          <div className="flex justify-between text-sm text-muted">
            <span>Tạm tính</span>
            <span>{formatVnd(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Giảm giá ({promoApplied?.code})</span>
              <span>-{formatVnd(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted">
            <span>Vận chuyển</span>
            <span className={shipping === 0 ? "text-success font-medium" : ""}>
              {shipping === 0
                ? promoApplied?.freeShipping
                  ? "Miễn phí (mã KM)"
                  : "Miễn phí"
                : formatVnd(shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink">
            <span>Tổng cộng</span>
            <span>{formatVnd(total)}</span>
          </div>
        </div>

        {error && (
          <p className="rounded border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink px-6 py-4 text-[13px] font-medium tracking-label uppercase text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đặt hàng"}
        </button>

        <Link href="/gio-hang" className="block text-center text-xs text-muted hover:text-ink">
          ← Quay lại giỏ hàng
        </Link>
      </div>
    </form>
  );
}
