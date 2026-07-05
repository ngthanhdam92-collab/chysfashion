"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { updateOrderCustomerInfo } from "@/lib/orders";

interface Props {
  orderId: string;
  initialPhone: string;
  initialAddress: string;
}

export function OrderCustomerEdit({ orderId, initialPhone, initialAddress }: Props) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [savedPhone, setSavedPhone] = useState(initialPhone);
  const [savedAddress, setSavedAddress] = useState(initialAddress);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleEdit() {
    setPhone(savedPhone);
    setAddress(savedAddress);
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateOrderCustomerInfo(orderId, { phone, address });
      if ("error" in result) { setError(result.error ?? null); return; }
      setSavedPhone(phone);
      setSavedAddress(address);
      setEditing(false);
    });
  }

  const INPUT = "mt-1 w-full border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-gold focus:outline-none";

  if (!editing) {
    return (
      <>
        <div>
          <dt className="text-xs text-muted">Số điện thoại</dt>
          <dd className="text-ink">{savedPhone}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Địa chỉ</dt>
          <dd className="text-ink">{savedAddress}</dd>
        </div>
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
        >
          <Pencil size={12} /> Chỉnh sửa SĐT / Địa chỉ
        </button>
      </>
    );
  }

  return (
    <>
      <div>
        <label className="text-xs text-muted">Số điện thoại</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={INPUT}
        />
      </div>
      <div>
        <label className="text-xs text-muted">Địa chỉ</label>
        <textarea
          rows={3}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={INPUT}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 bg-ink px-3 py-1.5 text-xs text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          <Check size={12} /> {isPending ? "Đang lưu..." : "Lưu"}
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
