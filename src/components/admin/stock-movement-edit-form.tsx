"use client";

import { useState, useTransition } from "react";
import { X, Minus, Plus } from "lucide-react";
import { StockMovement, MovementType } from "@/lib/stock-movements";
import { updateStockMovement } from "@/lib/stock-movements-actions";

const TYPES: {
  value: MovementType;
  label: string;
  delta: "positive" | "negative" | "signed" | "none";
  color: string;
}[] = [
  { value: "nhap_hang",    label: "Nhập hàng",          delta: "positive", color: "border-emerald-400 bg-emerald-50 text-emerald-800" },
  { value: "doi_tra_nhap", label: "Đổi trả (nhập kho)", delta: "positive", color: "border-blue-400 bg-blue-50 text-blue-800"           },
  { value: "xuat_hong",    label: "Xuất hỏng / mất",    delta: "negative", color: "border-red-400 bg-red-50 text-red-800"               },
  { value: "doi_tra_hong", label: "Đổi trả (hỏng)",     delta: "none",     color: "border-gray-300 bg-gray-50 text-gray-700"             },
  { value: "dieu_chinh",   label: "Điều chỉnh",         delta: "signed",   color: "border-amber-400 bg-amber-50 text-amber-800"          },
];

interface Props {
  movement: StockMovement;
  onClose: () => void;
  onSaved: () => void;
}

export function StockMovementEditForm({ movement, onClose, onSaved }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [type, setType] = useState<MovementType>(movement.type);
  const [qty, setQty] = useState(String(Math.abs(movement.quantity) || 1));
  const [note, setNote] = useState(movement.note ?? "");

  const currentType = TYPES.find((t) => t.value === type)!;
  const showQty = currentType.delta !== "none";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const result = await updateStockMovement(movement.id, { type, quantity, note });
      if (result?.error) { setError(result.error); return; }
      onSaved();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product info — read only */}
      <div className="rounded bg-cream px-4 py-2.5 text-sm">
        <span className="font-medium text-ink">{movement.productName}</span>
        {(movement.color || movement.size) && (
          <span className="ml-2 text-muted">
            {[movement.color, movement.size].filter(Boolean).join(" / ")}
          </span>
        )}
        {movement.sku && (
          <span className="ml-2 font-mono text-xs text-muted">SKU: {movement.sku}</span>
        )}
      </div>

      {/* Type */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-ink">Loại phiếu *</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded border-2 px-3 py-2 text-left text-xs transition-colors ${
                type === t.value
                  ? t.color + " border-current"
                  : "border-line bg-white text-muted hover:border-ink/40 hover:text-ink"
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
          className="bg-ink px-5 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
        >
          <X size={14} /> Hủy
        </button>
      </div>
    </form>
  );
}
