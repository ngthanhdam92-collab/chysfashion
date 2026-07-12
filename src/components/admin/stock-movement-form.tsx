"use client";

import { useState, useTransition } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Product } from "@/lib/types";
import { MovementType, MOVEMENT_LABELS } from "@/lib/stock-movements";
import { createStockMovement } from "@/lib/stock-movements-actions";

const TYPES: { value: MovementType; label: string; delta: "positive" | "negative" | "signed" | "none" }[] = [
  { value: "nhap_hang",    label: "Nhập hàng",           delta: "positive" },
  { value: "doi_tra_nhap", label: "Đổi trả (nhập kho)",  delta: "positive" },
  { value: "xuat_hong",    label: "Xuất hỏng / mất",     delta: "negative" },
  { value: "doi_tra_hong", label: "Đổi trả (hỏng)",      delta: "none"     },
  { value: "dieu_chinh",   label: "Điều chỉnh thủ công", delta: "signed"   },
];

interface Props {
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function StockMovementForm({ products, onSuccess, onCancel }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [color, setColor]   = useState("");
  const [size, setSize]     = useState("");
  const [type, setType]     = useState<MovementType>("nhap_hang");
  const [qty, setQty]       = useState("1");
  const [note, setNote]     = useState("");

  const selectedProduct = products.find((p) => p.id === productId);
  const searchLower = productSearch.trim().toLowerCase();
  const productResults = searchLower
    ? products.filter((p) => p.name.toLowerCase().includes(searchLower)).slice(0, 8)
    : [];

  const availableColors = selectedProduct?.colors.map((c) => c.name) ?? [];
  const availableSizes  = selectedProduct?.sizes ?? [];
  const hasVariants = availableColors.length > 0 && availableSizes.length > 0;

  const currentType = TYPES.find((t) => t.value === type)!;
  const showQty = currentType.delta !== "none";

  function selectProduct(p: Product) {
    setProductId(p.id);
    setProductSearch(p.name);
    setColor(p.colors[0]?.name ?? "");
    setSize(p.sizes[0] ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) { setError("Vui lòng chọn sản phẩm"); return; }

    const quantity = currentType.delta === "signed"
      ? parseInt(qty, 10) || 0          // signed, user enters ± value
      : Math.abs(parseInt(qty, 10)) || 0;

    if (currentType.delta !== "none" && quantity === 0) {
      setError("Số lượng phải khác 0"); return;
    }

    setError("");
    startTransition(async () => {
      const result = await createStockMovement({
        productId,
        productName: selectedProduct!.name,
        color: hasVariants ? color : "",
        size:  hasVariants ? size  : "",
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
      {/* Product search */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink">Sản phẩm *</label>
        <div className="relative">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => { setProductSearch(e.target.value); setProductId(""); }}
            placeholder="Tìm tên sản phẩm..."
            className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
          {productResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 border border-t-0 border-line bg-white shadow-lg">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream"
                >
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="text-xs text-muted">— {p.categoryLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Color + Size (only if product has variants) */}
      {selectedProduct && hasVariants && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Màu sắc</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            >
              {availableColors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            >
              {availableSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Movement type */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink">Loại phiếu *</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded border px-3 py-2 text-left text-xs font-medium transition-colors ${
                type === t.value
                  ? "border-gold bg-gold/10 text-ink"
                  : "border-line bg-white text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      {showQty && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink">
            {currentType.delta === "signed" ? "Số lượng điều chỉnh (dương = thêm, âm = bớt)" : "Số lượng *"}
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

          {/* Show current stock for reference */}
          {selectedProduct && (
            <p className="mt-1.5 text-xs text-muted">
              Tồn kho hiện tại:{" "}
              {hasVariants && color && size
                ? (() => {
                    const v = selectedProduct.variants.find(
                      (vv) => vv.color === color && vv.size === size
                    );
                    return v ? <strong>{v.stock}</strong> : <strong>{selectedProduct.stock}</strong>;
                  })()
                : <strong>{selectedProduct.stock}</strong>}
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
          placeholder="Lý do, mã đơn đổi trả, nhà cung cấp..."
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
    </form>
  );
}
