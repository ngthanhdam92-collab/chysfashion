"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CircleCheck, Trash2, Tag, RotateCcw, Banknote, Truck } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatVnd } from "@/lib/utils";
import { createOrder } from "@/lib/orders";
import { validatePromoCode, type ValidateResult } from "@/lib/promotions-actions";
import { getShippingRules, calcShippingFee, type ShippingRule } from "@/lib/shipping";
import { buildVietQrUrl, type BankSettings } from "@/lib/bank-settings";
import { CtaButton } from "./cta-button";
import { ProductImagePlaceholder } from "./product-image-placeholder";
import { upsertAbandonedCart, recoverAbandonedCart } from "@/lib/abandoned-carts";
import { trackPurchase, trackInitiateCheckout } from "@/lib/pixel-events";

/* ── Vietnamese address types ── */
interface Province { code: number; name: string; }
interface District { code: number; name: string; }
interface Ward    { code: number; name: string; }

const CUSTOMER_KEY = "chys-customer";
const SESSION_KEY  = "chys-cart-session";
interface SavedCustomer {
  fullName: string; phone: string; email: string; street: string;
  provinceCode: number; districtCode: number; wardCode: number;
}

const SELECT_CLS =
  "mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none disabled:bg-surface disabled:text-muted";
const INPUT_CLS =
  "mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none";

export function CheckoutView({ bankSettings }: { bankSettings?: BankSettings }) {
  const { lines, subtotal, clearCart, updateQuantity, removeLine } = useCart();
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false); // synchronous guard against double-submit
  const sessionIdRef  = useRef<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("cod");
  // Pre-generate order code so QR can show immediately when bank transfer is selected
  const pendingOrderCode = useRef(`CHYS${Date.now().toString().slice(-8)}`);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  /* ── Saved customer ── */
  const [savedCustomer, setSavedCustomer] = useState<SavedCustomer | null>(null);
  const pendingDistrictCode = useRef<number | null>(null);
  const pendingWardCode     = useRef<number | null>(null);

  /* ── Form fields ── */
  const [fullName, setFullName] = useState("");
  const [phone, setPhone]       = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
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

  /* Load saved customer info from localStorage */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      if (!raw) return;
      const data: SavedCustomer = JSON.parse(raw);
      setFullName(data.fullName ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setStreet(data.street ?? "");
      pendingDistrictCode.current = data.districtCode ?? null;
      pendingWardCode.current     = data.wardCode ?? null;
      setSavedCustomer(data);
    } catch {}
  }, []);

  /* After provinces load, restore saved province */
  useEffect(() => {
    if (!savedCustomer || provinces.length === 0) return;
    const p = provinces.find((x) => x.code === savedCustomer.provinceCode);
    if (p) setProvince(p);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces]);

  /* After districts load, restore saved district */
  useEffect(() => {
    if (pendingDistrictCode.current === null || districts.length === 0) return;
    const d = districts.find((x) => x.code === pendingDistrictCode.current);
    if (d) { setDistrict(d); pendingDistrictCode.current = null; }
  }, [districts]);

  /* After wards load, restore saved ward */
  useEffect(() => {
    if (pendingWardCode.current === null || wards.length === 0) return;
    const w = wards.find((x) => x.code === pendingWardCode.current);
    if (w) { setWard(w); pendingWardCode.current = null; }
  }, [wards]);

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

  /* ── Abandoned cart tracking ── */
  // On mount: create/restore session ID and snapshot the cart immediately
  useEffect(() => {
    if (lines.length === 0) return;
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) { sid = crypto.randomUUID(); localStorage.setItem(SESSION_KEY, sid); }
    sessionIdRef.current = sid;
    upsertAbandonedCart({ sessionId: sid, items: lines, subtotal }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When contact info or cart value changes: debounced update (1.5 s)
  useEffect(() => {
    if (!sessionIdRef.current || lines.length === 0) return;
    const t = setTimeout(() => {
      upsertAbandonedCart({
        sessionId: sessionIdRef.current,
        items: lines,
        subtotal,
        fullName: fullName || undefined,
        phone: phone || undefined,
        email: email || undefined,
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, phone, email, subtotal]);

  /* ── Poll for payment when bank transfer selected — auto-submit when paid ── */
  useEffect(() => {
    if (paymentMethod !== "bank_transfer") return;
    if (orderCode) return; // already placed
    let stopped = false;
    async function poll() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/check-pending-payment?code=${pendingOrderCode.current}`);
        const data = await res.json();
        if (data.found && submitBtnRef.current) {
          submitBtnRef.current.click();
          return;
        }
      } catch {}
      if (!stopped) setTimeout(poll, 3000);
    }
    const t = setTimeout(poll, 3000);
    return () => { stopped = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, orderCode]);

  /* ── Computed totals ── */
  const discount = promoApplied ? promoApplied.discount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const baseFee = calcShippingFee(discountedSubtotal, shippingRules);
  const shipping = (promoApplied?.freeShipping) ? 0 : baseFee;
  const total = discountedSubtotal + shipping;

  function validatePhone(p: string): string | null {
    if (!p) return "Vui lòng nhập số điện thoại.";
    if (!/^0[35789]\d{8}$/.test(p))
      return "Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng Việt Nam (VD: 0912345678).";
    return null;
  }

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
    if (submittingRef.current) return; // block concurrent submits
    const pErr = validatePhone(phone);
    if (pErr) { setPhoneError(pErr); return; }
    if (!province || !district || !ward) { setError("Vui lòng chọn đầy đủ tỉnh/quận/phường."); return; }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    trackInitiateCheckout({ value: subtotal });

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
      paymentMethod,
      orderCode: paymentMethod === "bank_transfer" ? pendingOrderCode.current : undefined,
    });

    submittingRef.current = false;
    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }

    // Mark cart as recovered so it disappears from admin abandoned list
    if (sessionIdRef.current) {
      recoverAbandonedCart(sessionIdRef.current, result.orderCode).catch(() => {});
    }

    // Save customer info for next visit
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({
        fullName, phone, email, street,
        provinceCode: province!.code,
        districtCode: district!.code,
        wardCode: ward!.code,
      } satisfies SavedCustomer));
    } catch {}

    setOrderCode(result.orderCode);
    clearCart();
    // Đổi URL để Facebook Custom Conversion bắt được (không reload trang)
    window.history.replaceState({}, "", `/dat-hang-thanh-cong?code=${result.orderCode}`);
  }

  /* ── Success screen ── */
  if (orderCode) {
    const isBankTransfer = paymentMethod === "bank_transfer";
    const successQrUrl =
      isBankTransfer && bankSettings?.accountNumber
        ? buildVietQrUrl(bankSettings, total, orderCode)
        : null;

    return (
      <SuccessScreen
        orderCode={orderCode}
        total={total}
        isBankTransfer={isBankTransfer}
        successQrUrl={successQrUrl}
        bankSettings={bankSettings}
      />
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

        {savedCustomer && (
          <div className="flex items-center justify-between rounded border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
            <span className="flex items-center gap-1.5">
              <RotateCcw size={13} />
              Đã điền thông tin từ lần mua trước
            </span>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(CUSTOMER_KEY);
                setSavedCustomer(null);
                setFullName(""); setPhone(""); setEmail(""); setStreet("");
                setProvince(null); setDistrict(null); setWard(null);
              }}
              className="ml-3 underline hover:no-underline"
            >
              Xóa
            </button>
          </div>
        )}

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
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(digits);
                if (phoneError) setPhoneError(validatePhone(digits));
              }}
              onBlur={() => setPhoneError(validatePhone(phone))}
              placeholder="VD: 0912345678"
              className={`${INPUT_CLS} ${phoneError ? "border-error" : ""}`}
            />
            {phoneError && (
              <p className="mt-1 text-xs text-error">{phoneError}</p>
            )}
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
          <label
            className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${
              paymentMethod === "cod"
                ? "border-ink bg-cream/30"
                : "border-line hover:border-ink/40"
            }`}
          >
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
              className="accent-gold"
            />
            <Truck size={16} className="shrink-0 text-muted" />
            <span className="text-sm text-ink">Thanh toán khi nhận hàng (COD)</span>
          </label>

          {bankSettings?.enabled && bankSettings.accountNumber && (
            <label
              className={`mt-2 flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors ${
                paymentMethod === "bank_transfer"
                  ? "border-ink bg-cream/30"
                  : "border-line hover:border-ink/40"
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")}
                className="mt-0.5 accent-gold"
              />
              <Banknote size={16} className="mt-0.5 shrink-0 text-muted" />
              <span className="text-sm text-ink">Chuyển khoản ngân hàng</span>
            </label>
          )}

          {/* QR + bank info when bank transfer is selected */}
          {paymentMethod === "bank_transfer" && bankSettings?.accountNumber && (
            <div className="mt-3 rounded border border-gold/30 bg-amber-50 p-4">
              <p className="mb-3 text-center text-xs font-semibold text-amber-800">
                Quét mã QR để chuyển khoản
              </p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={buildVietQrUrl(bankSettings, total, pendingOrderCode.current)}
                  alt="VietQR"
                  className="h-52 w-52 object-contain"
                />
              </div>
              <div className="mt-3 space-y-0.5 text-center text-xs text-amber-700">
                <p>{bankSettings.bankCode} · <span className="font-mono font-medium">{bankSettings.accountNumber}</span></p>
                <p className="font-medium">{bankSettings.accountName}</p>
                <p className="mt-1 text-sm font-semibold text-amber-900">{formatVnd(total)}</p>
                <p className="pt-1">
                  Nội dung: <span className="font-semibold">{pendingOrderCode.current}</span>
                </p>
              </div>
              <p className="mt-2 text-center text-[11px] text-amber-500">
                Nhấn &quot;Đặt hàng&quot; để xác nhận đơn, mã đơn hàng đã có trong QR.
              </p>
            </div>
          )}
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
          ref={submitBtnRef}
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

/* ── Success screen with payment polling ── */
function SuccessScreen({
  orderCode,
  total,
  isBankTransfer,
  successQrUrl,
  bankSettings,
}: {
  orderCode: string;
  total: number;
  isBankTransfer: boolean;
  successQrUrl: string | null;
  bankSettings?: BankSettings;
}) {
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // Fire Purchase pixel event once when success screen mounts
  useEffect(() => {
    trackPurchase({ value: total, orderId: orderCode });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isBankTransfer) return;
    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(`/api/check-payment?code=${orderCode}`);
        const data = await res.json();
        if (data.paid) { setPaymentConfirmed(true); return; }
      } catch {}
      if (!stopped) setTimeout(poll, 3000);
    }
    poll();
    // Stop polling after 20 minutes
    const timeout = setTimeout(() => { stopped = true; }, 20 * 60 * 1000);
    return () => { stopped = true; clearTimeout(timeout); };
  }, [orderCode, isBankTransfer]);

  return (
    <div className="flex flex-col items-center py-16 text-center">

      {/* Payment confirmed banner */}
      {paymentConfirmed ? (
        <div className="mb-6 w-full max-w-md rounded border border-green-300 bg-green-50 px-6 py-4">
          <CircleCheck size={36} className="mx-auto text-green-600" strokeWidth={1.5} />
          <p className="mt-2 text-base font-semibold text-green-800">Thanh toán thành công!</p>
          <p className="mt-1 text-sm text-green-700">Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
        </div>
      ) : (
        <CircleCheck size={48} className="text-success" strokeWidth={1.5} />
      )}

      <h2 className="mt-4 font-serif text-2xl text-ink">Đặt hàng thành công!</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Cảm ơn bạn đã mua sắm tại CHYS Fashion. Chúng tôi sẽ liên hệ xác nhận qua số điện thoại bạn đã cung cấp.
      </p>

      {/* Order code box */}
      <div className="mt-6 rounded border border-line bg-surface px-8 py-4">
        <p className="text-xs text-muted">Mã đơn hàng của bạn</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-widest text-ink">{orderCode}</p>
        <p className="mt-1 text-xs text-muted">Lưu mã này để tra cứu trạng thái đơn hàng</p>
      </div>

      {/* Bank transfer QR — hide after payment confirmed */}
      {successQrUrl && !paymentConfirmed && (
        <div className="mt-6 flex flex-col items-center rounded border border-gold/40 bg-amber-50 px-8 py-5">
          <p className="mb-1 text-sm font-semibold text-amber-800">Quét mã QR để chuyển khoản</p>
          <p className="mb-3 text-xs text-amber-700">
            Nội dung: <span className="font-semibold">{orderCode}</span>
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={successQrUrl} alt="VietQR" className="h-56 w-56 object-contain" />
          <p className="mt-3 text-center text-xs text-amber-700">
            {bankSettings!.bankCode} · {bankSettings!.accountNumber}
            <br />
            <span className="font-medium">{bankSettings!.accountName}</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-amber-800">{formatVnd(total)}</p>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Đang chờ xác nhận thanh toán...
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <CtaButton href={`/tra-cuu-don-hang?code=${orderCode}`} variant="primary">
          Theo dõi đơn hàng
        </CtaButton>
        <CtaButton href="/san-pham" variant="outline">
          Tiếp tục mua sắm
        </CtaButton>
      </div>
    </div>
  );
}
