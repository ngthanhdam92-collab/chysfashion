"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { ShippingRule } from "@/lib/shipping";
import { saveShippingRules } from "@/lib/shipping-actions";
import { formatVnd } from "@/lib/utils";

interface EditableRule {
  key: number;
  label: string;
  minOrderValue: string;
  fee: string;
}

let _key = 0;
function nextKey() { return ++_key; }

function toEditable(r: ShippingRule): EditableRule {
  return {
    key: nextKey(),
    label: r.label,
    minOrderValue: String(r.minOrderValue),
    fee: String(r.fee),
  };
}

export function ShippingClient({ rules }: { rules: ShippingRule[] }) {
  const [rows, setRows] = useState<EditableRule[]>(
    rules.length > 0 ? rules.map(toEditable) : [
      { key: nextKey(), label: "Dưới 500,000đ", minOrderValue: "0", fee: "30000" },
      { key: nextKey(), label: "Từ 500,000đ trở lên", minOrderValue: "500000", fee: "0" },
    ]
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addRow() {
    setRows((r) => [...r, { key: nextKey(), label: "", minOrderValue: "0", fee: "0" }]);
  }

  function removeRow(key: number) {
    setRows((r) => r.filter((x) => x.key !== key));
  }

  function updateRow(key: number, field: keyof Omit<EditableRule, "key">, value: string) {
    setRows((r) => r.map((x) => x.key === key ? { ...x, [field]: value } : x));
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const rules = rows.map((r, i) => ({
        label: r.label,
        minOrderValue: Number(r.minOrderValue) || 0,
        fee: Number(r.fee) || 0,
        position: i,
      }));
      const result = await saveShippingRules(rules);
      if ("error" in result) { setError(result.error ?? null); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const INPUT = "w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <strong>Hướng dẫn:</strong> Thêm từng mức phí ship. Hệ thống sẽ áp dụng mức phí của
        ngưỡng giá trị tối thiểu cao nhất mà đơn hàng đạt được. Đặt phí = 0 để miễn phí ship.
      </div>

      {/* Rules table */}
      <div className="rounded border border-line bg-white">
        <div className="border-b border-line bg-surface px-4 py-3">
          <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 text-[11px] font-medium uppercase tracking-label text-muted">
            <span />
            <span>Tên mức</span>
            <span>Giá trị đơn tối thiểu (đ)</span>
            <span>Phí ship (đ)</span>
            <span />
          </div>
        </div>

        <div className="divide-y divide-line">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[auto_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3">
              <GripVertical size={16} className="text-stone cursor-grab" />
              <input
                value={row.label}
                onChange={(e) => updateRow(row.key, "label", e.target.value)}
                placeholder="VD: Đơn dưới 500k"
                className={INPUT}
              />
              <input
                type="number"
                min={0}
                value={row.minOrderValue}
                onChange={(e) => updateRow(row.key, "minOrderValue", e.target.value)}
                placeholder="0"
                className={INPUT}
              />
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  value={row.fee}
                  onChange={(e) => updateRow(row.key, "fee", e.target.value)}
                  placeholder="30000"
                  className={INPUT}
                />
                {Number(row.fee) === 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-green-600 font-medium">
                    Miễn phí
                  </span>
                )}
              </div>
              <button onClick={() => removeRow(row.key)}
                className="text-muted hover:text-error" aria-label="Xóa">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Chưa có mức phí nào. Thêm mức phí vận chuyển để bắt đầu.
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="rounded border border-line bg-surface p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">Xem trước</p>
          <div className="space-y-1.5">
            {[...rows]
              .sort((a, b) => Number(a.minOrderValue) - Number(b.minOrderValue))
              .map((r) => (
                <div key={r.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    Đơn từ {Number(r.minOrderValue) > 0 ? formatVnd(Number(r.minOrderValue)) : "0đ"}
                    {r.label ? ` — ${r.label}` : ""}
                  </span>
                  <span className={Number(r.fee) === 0 ? "font-medium text-green-600" : "font-medium text-ink"}>
                    {Number(r.fee) === 0 ? "Miễn phí" : formatVnd(Number(r.fee))}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button onClick={addRow}
          className="flex items-center gap-2 border border-line px-4 py-2 text-sm text-ink hover:bg-cream">
          <Plus size={15} /> Thêm mức phí
        </button>
        <button onClick={handleSave} disabled={isPending}
          className={`px-6 py-2 text-sm text-paper transition-colors disabled:opacity-50 ${
            saved ? "bg-green-600" : "bg-ink hover:bg-ink/85"
          }`}>
          {isPending ? "Đang lưu..." : saved ? "Đã lưu!" : "Lưu cấu hình"}
        </button>
      </div>
    </div>
  );
}
