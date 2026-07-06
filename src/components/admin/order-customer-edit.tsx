"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { updateOrderFull } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";

interface Props {
  orderId: string;
  initialFullName: string;
  initialPhone: string;
  initialAddress: string;
  initialCity: string;
  initialNote: string;
  initialShipping: number;
  initialDiscount: number;
  subtotal: number;
}

const INPUT = "mt-1 w-full border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-gold focus:outline-none";

export function OrderCustomerEdit({
  orderId,
  initialFullName,
  initialPhone,
  initialAddress,
  initialCity,
  initialNote,
  initialShipping,
  initialDiscount,
  subtotal,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Saved (displayed) values
  const [saved, setSaved] = useState({
    fullName: initialFullName,
    phone: initialPhone,
    address: initialAddress,
    city: initialCity,
    note: initialNote,
    shipping: initialShipping,
    discount: initialDiscount,
  });

  // Draft (editing) values
  const [draft, setDraft] = useState(saved);

  const total = Math.max(0, subtotal - draft.discount + draft.shipping);

  function handleEdit() {
    setDraft(saved);
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderFull(orderId, draft);
      if ("error" in result) { setError(result.error ?? null); return; }
      setSaved(draft);
      setEditing(false);
    });
  }

  function set<K extends keyof typeof draft>(key: K, val: typeof draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  /* ── View mode ── */
  if (!editing) {
    return (
      <>
        <div>
          <dt className="text-xs text-muted">Họ tên</dt>
          <dd className="text-ink">{saved.fullName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Số điện thoại</dt>
          <dd className="text-ink">{saved.phone}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Địa chỉ</dt>
          <dd className="text-ink">{saved.address}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Tỉnh / Thành phố</dt>
          <dd className="text-ink">{saved.city}</dd>
        </div>
        {saved.note && (
          <div>
            <dt className="text-xs text-muted">Ghi chú</dt>
            <dd className="text-ink">{saved.note}</dd>
          </div>
        )}
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
        >
          <Pencil size={12} /> Chỉnh sửa thông tin
        </button>
      </>
    );
  }

  /* ── Edit mode ── */
  return (
    <>
      <div>
        <label className="text-xs text-muted">Họ tên</label>
        <input value={draft.fullName} onChange={(e) => set("fullName", e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className="text-xs text-muted">Số điện thoại</label>
        <input type="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className="text-xs text-muted">Địa chỉ</label>
        <textarea rows={2} value={draft.address} onChange={(e) => set("address", e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className="text-xs text-muted">Tỉnh / Thành phố</label>
        <input value={draft.city} onChange={(e) => set("city", e.target.value)} className={INPUT} />
      </div>
      <div>
        <label className="text-xs text-muted">Ghi chú</label>
        <textarea rows={2} value={draft.note} onChange={(e) => set("note", e.target.value)} className={INPUT} placeholder="Không có" />
      </div>

      {/* Financial adjustments */}
      <div className="border-t border-line pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-label text-muted">Điều chỉnh phí</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted">Phí vận chuyển (đ)</label>
            <input
              type="number"
              min={0}
              value={draft.shipping}
              onChange={(e) => set("shipping", Number(e.target.value))}
              className={INPUT}
            />
          </div>
          <div>
            <label className="text-xs text-muted">Giảm giá (đ)</label>
            <input
              type="number"
              min={0}
              value={draft.discount}
              onChange={(e) => set("discount", Number(e.target.value))}
              className={INPUT}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          Tổng mới: <span className="font-semibold text-ink">{formatVnd(total)}</span>
          <span className="ml-1 text-muted">(tạm tính {formatVnd(subtotal)} - giảm {formatVnd(draft.discount)} + ship {formatVnd(draft.shipping)})</span>
        </p>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-xs text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          <Check size={12} /> {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-ink hover:bg-cream"
        >
          <X size={12} /> Hủy
        </button>
      </div>
    </>
  );
}
