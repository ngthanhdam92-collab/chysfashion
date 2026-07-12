"use client";

import { useState, useTransition, useMemo } from "react";
import { X, Plus, Minus, Search, CheckCircle2 } from "lucide-react";
import { Product } from "@/lib/types";
import { MovementType } from "@/lib/stock-movements";
import { createStockMovement } from "@/lib/stock-movements-actions";

const TYPES: {
  value: MovementType;
  label: string;
  sub: string;
  delta: "positive" | "negative" | "signed" | "none";
  color: string;
}[] = [
  { value: "nhap_hang",    label: "Nhập hàng",          sub: "Tăng tồn kho",              delta: "positive", color: "border-emerald-400 bg-emerald-50 text-emerald-800" },
  { value: "doi_tra_nhap", label: "Đổi trả (nhập kho)", sub: "Khách trả, còn dùng được",  delta: "positive", color: "border-blue-400 bg-blue-50 text-blue-800"           },
  { value: "xuat_hong",    label: "Xuất hỏng / mất",    sub: "Giảm tồn kho",              delta: "negative", color: "border-red-400 bg-red-50 text-red-800"               },
  { value: "doi_tra_hong", label: "Đổi trả (hỏng)",     sub: "Ghi nhận, không đổi tồn",  delta: "none",     color: "border-gray-300 bg-gray-50 text-gray-700"             },
  { value: "dieu_chinh",   label: "Điều chỉnh",         sub: "Sửa tồn thủ công (± số)",  delta: "signed",   color: "border-amber-400 bg-amber-50 text-amber-800"          },
];

// Flat variant record for searching
interface VariantRow {
  productId: string;
  productName: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  hasVariants: boolean;
}

interface Props {
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function StockMovementForm({ products, onSuccess, onCancel }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Step 1: variant selection
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VariantRow | null>(null);

  // Step 2: movement details
  const [type, setType] = useState<MovementType>("nhap_hang");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  // Build flat variant list from all products
  const allVariants = useMemo<VariantRow[]>(() => {
    const rows: VariantRow[] = [];
    for (const p of products) {
      if (p.variants.length > 0) {
        for (const v of p.variants) {
          rows.push({
            productId: p.id,
            productName: p.name,
            color: v.color,
            size: v.size,
            sku: v.sku ?? "",
            stock: v.stock,
            hasVariants: true,
          });
        }
      } else {
        rows.push({
          productId: p.id,
          productName: p.name,
          color: "",
          size: "",
          sku: "",
          stock: p.stock,
          hasVariants: false,
        });
      }
    }
    return rows;
  }, [products]);

  // Filter variants by query
  const results = useMemo<VariantRow[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allVariants
      .filter(
        (v) =>
          v.productName.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.size.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, allVariants]);

  const currentType = TYPES.find((t) => t.value === type)!;
  const showQty = currentType.delta !== "none";

  function pickVariant(v: VariantRow) {
    setSelected(v);
    setQuery("");
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) { setError("Vui lòng chọn sản phẩm / phân loại"); return; }

    const quantity =
      currentType.delta === "signed"
        ? parseInt(qty, 10) || 0
        : Math.abs(parseInt(qty, 10)) || 0;

    if (currentType.delta !== "none" && quantity === 0) {
      setError("Số lượng phải khác 0");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await createStockMovement({
        productId: selected.productId,
        productName: selected.productName,
        color: selected.color,
        size: selected.size,
        sku: selected.sku,
        type,
        quantity,
        note,
      });
      if (result?.error) { setError(result.error); return; }
      onSuccess();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Step 1: search variant ── */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink">
          Tìm sản phẩm / phân loại *
        </label>

        {selected ? (
          /* Selected variant card */
          <div className="flex items-start justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium text-ink">{selected.productName}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
                  {selected.color && <span>Màu: <strong className="text-ink">{selected.color}</strong></span>}
                  {selected.size  && <span>Size: <strong className="text-ink">{selected.size}</strong></span>}
                  {selected.sku   && <span>SKU: <strong className="text-ink">{selected.sku}</strong></span>}
                  <span>Tồn hiện tại: <strong className="text-ink">{selected.stock}</strong></span>
                </div>
              </div>
            </div>
            <button type="button" onClick={clearSelection} className="shrink-0 text-muted hover:text-error">
              <X size={14} />
            </button>
          </div>
        ) : (
          /* Search input + dropdown */
          <div className="relative">
            <div className="flex items-center gap-2 border border-line bg-white px-3 py-2 focus-within:border-gold">
              <Search size={14} className="shrink-0 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập tên, SKU, màu, size... (VD: H01, đen, M)"
                autoFocus
                className="w-full bg-transparent text-sm focus:outline-none"
              />
            </div>

            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 max-h-64 overflow-y-auto border border-t-0 border-line bg-white shadow-lg">
                {results.map((v, i) => (
                  <button
                    key={`${v.productId}-${v.color}-${v.size}-${i}`}
                    type="button"
                    onClick={() => pickVariant(v)}
                    className="flex w-full items-center justify-between gap-3 border-b border-[#f0eeea] px-4 py-2.5 text-left hover:bg-cream"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{v.productName}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                        {v.color && <span>Màu: {v.color}</span>}
                        {v.size  && <span>Size: {v.size}</span>}
                        {v.sku   && <span>SKU: <span className="font-mono font-semibold text-ink">{v.sku}</span></span>}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      v.stock === 0 ? "bg-gray-100 text-gray-500" :
                      v.stock <= 3  ? "bg-red-100 text-red-700" :
                      v.stock <= 10 ? "bg-amber-100 text-amber-700" :
                                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      Tồn: {v.stock}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.length === 0 && (
              <p className="mt-1.5 text-xs text-muted">Không tìm thấy phân loại nào.</p>
            )}
            {!query.trim() && (
              <p className="mt-1.5 text-xs text-muted">Gõ để tìm theo tên sản phẩm, SKU, màu hoặc size.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: type + qty + note (only when variant selected) ── */}
      {selected && (
        <>
          {/* Movement type */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-ink">Loại phiếu *</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded border-2 px-3 py-2 text-left transition-colors ${
                    type === t.value ? t.color + " border-current" : "border-line bg-white text-muted hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="mt-0.5 text-[10px] opacity-75">{t.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          {showQty && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink">
                {currentType.delta === "signed"
                  ? "Số lượng điều chỉnh (dương = thêm, âm = bớt)"
                  : "Số lượng *"}
              </label>
              <div className="flex items-center gap-2">
                {currentType.delta !== "signed" && (
                  <button
                    type="button"
                    onClick={() => setQty((v) => String(Math.max(1, (parseInt(v) || 1) - 1)))}
                    className="border border-line p-2 hover:bg-cream"
                  >
                    <Minus size={14} />
                  </button>
                )}
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  min={currentType.delta === "signed" ? undefined : 1}
                  className="w-24 border border-line bg-white px-3 py-2 text-center font-mono text-sm focus:border-gold focus:outline-none"
                />
                {currentType.delta !== "signed" && (
                  <button
                    type="button"
                    onClick={() => setQty((v) => String((parseInt(v) || 0) + 1))}
                    className="border border-line p-2 hover:bg-cream"
                  >
                    <Plus size={14} />
                  </button>
                )}
                <span className="text-xs text-muted">sản phẩm</span>
              </div>

              {/* After-action preview */}
              {currentType.delta !== "none" && parseInt(qty) > 0 && (
                <p className="mt-1.5 text-xs text-muted">
                  Tồn sau khi lưu:{" "}
                  <strong className={
                    currentType.delta === "negative"
                      ? "text-red-600"
                      : currentType.delta === "signed" && parseInt(qty) < 0
                      ? "text-red-600"
                      : "text-emerald-600"
                  }>
                    {Math.max(0,
                      currentType.delta === "positive" ? selected.stock + (parseInt(qty) || 0)
                      : currentType.delta === "negative" ? selected.stock - (parseInt(qty) || 0)
                      : selected.stock + (parseInt(qty) || 0)
                    )}
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhà cung cấp, mã đơn đổi trả, lý do hỏng..."
              className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-ink px-5 py-2.5 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
            >
              {pending ? "Đang lưu..." : "Lưu phiếu"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
            >
              <X size={14} /> Hủy
            </button>
          </div>
        </>
      )}

      {!selected && (
        <div className="flex justify-end">
          <button type="button" onClick={onCancel} className="text-sm text-muted hover:text-ink">
            Hủy
          </button>
        </div>
      )}
    </form>
  );
}
