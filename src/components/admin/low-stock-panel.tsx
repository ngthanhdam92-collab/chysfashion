"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, X } from "lucide-react";
import { updateVariantStock } from "@/lib/products-actions";
import { useRouter } from "next/navigation";

interface LowStockItem {
  productId: string;
  productName: string;
  slug: string;
  color: string;
  size: string;
  stock: number;
}

const VERY_LOW = 3;

export function LowStockPanel({ items: initialItems }: { items: LowStockItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function rowKey(item: LowStockItem) {
    return `${item.productId}__${item.color}__${item.size}`;
  }

  function startEdit(item: LowStockItem) {
    setEditingKey(rowKey(item));
    setEditValue(String(item.stock));
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue("");
  }

  function save(item: LowStockItem) {
    const newStock = Math.max(0, parseInt(editValue, 10) || 0);
    const key = rowKey(item);
    startTransition(async () => {
      const result = await updateVariantStock(item.productId, item.color, item.size, newStock);
      if (result?.error) return;

      // Optimistic update
      setItems((prev) =>
        prev
          .map((it) => (rowKey(it) === key ? { ...it, stock: newStock } : it))
          .filter((it) => it.stock <= 10) // remove from list if no longer low
          .sort((a, b) => a.stock - b.stock)
      );
      setEditingKey(null);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
      router.refresh();
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="font-serif text-lg text-ink">Cảnh báo tồn kho thấp</h2>
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
            {items.length} variant
          </span>
        </div>
        <Link href="/admin/products" className="text-xs text-gold-dark hover:underline">
          Quản lý sản phẩm
        </Link>
      </div>

      <div className="overflow-hidden rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[#f0eeea] bg-[#faf9f7] text-left text-[11px] uppercase tracking-label text-muted">
                <th className="px-5 py-3">Sản phẩm</th>
                <th className="px-5 py-3">Màu</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Tồn kho</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0eeea]">
              {items.map((item, i) => {
                const key = rowKey(item);
                const isEditing = editingKey === key;
                const isSaved = savedKey === key;
                const veryLow = item.stock <= VERY_LOW;

                return (
                  <tr key={`${key}-${i}`} className="transition-colors hover:bg-[#faf9f7]">
                    <td className="px-5 py-3 font-medium text-ink">{item.productName}</td>
                    <td className="px-5 py-3 text-muted">{item.color}</td>
                    <td className="px-5 py-3 text-muted">{item.size}</td>

                    {/* Stock cell — badge or input */}
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") save(item);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="w-20 border border-gold bg-white px-2 py-1 text-center font-mono text-sm focus:outline-none"
                        />
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.stock === 0
                            ? "bg-gray-100 text-gray-500"
                            : veryLow
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.stock === 0 ? "Hết hàng" : `Còn ${item.stock}`}
                        </span>
                      )}
                    </td>

                    {/* Action cell */}
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => save(item)}
                            disabled={pending}
                            className="flex items-center gap-1 rounded bg-ink px-2.5 py-1 text-xs font-medium text-paper disabled:opacity-50 hover:bg-ink/85"
                          >
                            <Check size={11} />
                            Lưu
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={pending}
                            className="flex items-center gap-1 rounded border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
                          >
                            <X size={11} />
                            Hủy
                          </button>
                        </div>
                      ) : isSaved ? (
                        <span className="text-xs font-medium text-emerald-600">✓ Đã lưu</span>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-gold-dark hover:underline"
                        >
                          Chỉnh sửa
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
