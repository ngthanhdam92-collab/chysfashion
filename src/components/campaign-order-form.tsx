"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { createOrder } from "@/lib/orders";
import { calcShippingFee, type ShippingRule } from "@/lib/shipping";
import { trackPurchase } from "@/lib/pixel-events";
import {
  parseSizeChartData,
  recommendSizeFromData,
  DEFAULT_SIZE_CHART,
  DEFAULT_COLUMNS,
  type SizeChartData,
} from "@/lib/size-chart";

interface Props {
  products: Product[];
  shippingRules: ShippingRule[];
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

function InlineSizeGuide({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(60);
  const [result, setResult] = useState<string | null>(null);
  const [calculated, setCalculated] = useState(false);

  const product = products.find((p) => p.sizes.length > 0);
  if (!product) return null;

  let chartData: SizeChartData;
  if (product.sizeChart && Object.keys(product.sizeChart).length > 0) {
    chartData = parseSizeChartData(product.sizeChart);
  } else {
    const rows: Record<string, Record<string, number>> = {};
    for (const s of product.sizes) {
      if (DEFAULT_SIZE_CHART[s]) rows[s] = DEFAULT_SIZE_CHART[s] as unknown as Record<string, number>;
    }
    chartData = { columns: DEFAULT_COLUMNS, rows };
  }
  const { columns, rows } = chartData;
  const chartSizes = product.sizes.filter((s) => rows[s]);
  if (chartSizes.length === 0) return null;

  const heightMinCol = columns.find((c) => c.key === "heightMin");
  const heightMaxCol = columns.find((c) => c.key === "heightMax");
  const weightMinCol = columns.find((c) => c.key === "weightMin");
  const weightMaxCol = columns.find((c) => c.key === "weightMax");
  const canRecommend = !!heightMinCol && !!heightMaxCol;

  type DisplayRow = { label: string; unit?: string; render: (s: string) => string };
  const displayRows: DisplayRow[] = [];
  const usedKeys = new Set<string>();

  if (heightMinCol && heightMaxCol) {
    displayRows.push({
      label: "Chiều cao", unit: "cm",
      render: (s) => {
        const r = rows[s]; if (!r) return "—";
        return r.heightMin && r.heightMax ? `${r.heightMin}–${r.heightMax}` : "—";
      },
    });
    usedKeys.add("heightMin"); usedKeys.add("heightMax");
  }
  if (weightMinCol && weightMaxCol) {
    displayRows.push({
      label: "Cân nặng", unit: "kg",
      render: (s) => {
        const r = rows[s]; if (!r) return "—";
        return r.weightMin && r.weightMax ? `${r.weightMin}–${r.weightMax}` : "—";
      },
    });
    usedKeys.add("weightMin"); usedKeys.add("weightMax");
  }
  for (const col of columns) {
    if (usedKeys.has(col.key)) continue;
    displayRows.push({
      label: col.label, unit: col.unit,
      render: (s) => {
        const val = rows[s]?.[col.key];
        return val !== undefined && val !== 0 ? String(val) : "—";
      },
    });
  }

  function calculate() {
    const r = recommendSizeFromData(height, weight, product!.sizes, chartData);
    setResult(r); setCalculated(true);
  }

  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-blue-600 px-4 py-3"
      >
        <span className="text-sm font-bold uppercase tracking-wide text-white">
          Hướng dẫn chọn size
        </span>
        <svg
          className={`h-4 w-4 text-white transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="bg-gray-50 px-4 py-4 space-y-4">
          {canRecommend && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Tính size cho tôi</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Chiều cao</label>
                  <div className="flex items-center border border-gray-300 bg-white">
                    <input
                      type="number" value={height} min={140} max={210}
                      onChange={(e) => { setHeight(Number(e.target.value)); setCalculated(false); }}
                      className="min-w-0 flex-1 px-3 py-2 text-sm focus:outline-none"
                    />
                    <span className="border-l border-gray-300 px-2 py-2 text-xs text-gray-400">cm</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Cân nặng</label>
                  <div className="flex items-center border border-gray-300 bg-white">
                    <input
                      type="number" value={weight} min={30} max={150}
                      onChange={(e) => { setWeight(Number(e.target.value)); setCalculated(false); }}
                      className="min-w-0 flex-1 px-3 py-2 text-sm focus:outline-none"
                    />
                    <span className="border-l border-gray-300 px-2 py-2 text-xs text-gray-400">kg</span>
                  </div>
                </div>
              </div>
              <button
                type="button" onClick={calculate}
                className="mt-2 bg-blue-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-blue-700"
              >
                Tính toán
              </button>
              {calculated && (
                <div className={`mt-2 px-3 py-2.5 text-sm border ${result ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-500"}`}>
                  {result
                    ? <>Gợi ý size phù hợp: <span className="text-base font-black">{result}</span></>
                    : "Không xác định được size phù hợp."}
                </div>
              )}
            </div>
          )}

          {chartSizes.length > 0 && displayRows.length > 0 && (
            <div className="overflow-x-auto">
              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Thông số sản phẩm (cm / kg)</p>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-2 py-2 text-left font-semibold text-gray-600">Thông số</th>
                    {chartSizes.map((s) => (
                      <th key={s} className={`px-2 py-2 text-center font-bold ${result === s ? "bg-blue-600 text-white" : "text-gray-800"}`}>
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map(({ label, unit, render }, i) => (
                    <tr key={label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-2 py-1.5 text-gray-500">{label}{unit ? ` (${unit})` : ""}</td>
                      {chartSizes.map((s) => (
                        <td key={s} className={`px-2 py-1.5 text-center ${result === s ? "font-bold text-blue-600" : "text-gray-700"}`}>
                          {render(s)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1.5 text-[10px] italic text-gray-400">*Thông số khi trải phẳng, có thể chênh lệch so với số đo cơ thể.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CampaignOrderForm({ products, shippingRules }: Props) {
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
  const shipping = calcShippingFee(subtotal, shippingRules);
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
    trackPurchase({ value: total, orderId: result.orderCode });
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
      <InlineSizeGuide products={products} />

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
                {/* Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
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
                        unoptimized
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

                {/* Price + code */}
                <div className="px-2 py-1.5">
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

                {/* Select button */}
                <div className="px-2 pb-2">
                  <button
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={`w-full py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                      checked
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {checked ? "✕ Bỏ chọn" : "＋ Chọn sản phẩm"}
                  </button>
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
        <div className="mx-2 mb-4 overflow-hidden border-2 border-red-500">
          {/* Header */}
          <div className="bg-red-600 px-4 py-2.5">
            <p className="text-sm font-bold uppercase tracking-wide text-white">
              🛒 Thông tin đơn hàng
            </p>
          </div>

          {/* Items */}
          <div className="divide-y divide-gray-100 bg-white">
            {items.map((item) => (
              <div key={item.productId} className="px-4 py-3">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {item.color && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Size {item.size}
                      </span>
                    )}
                    <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      SL: {item.quantity}
                    </span>
                  </div>
                  <span className="shrink-0 text-base font-black text-red-600">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Shipping */}
          <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5">
            <span className="text-sm text-gray-600">🚚 Phí vận chuyển</span>
            <span className="text-sm font-semibold text-gray-700">
              {shipping === 0 ? "Miễn phí" : fmt(shipping)}
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-red-600 px-4 py-3">
            <span className="text-base font-bold text-white">Tổng cộng</span>
            <span className="text-xl font-black text-white">{fmt(total)}</span>
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
