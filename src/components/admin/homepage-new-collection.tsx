"use client";

import { useState, useTransition } from "react";
import { saveNewCollectionSettings } from "@/lib/homepage-settings-actions";
import type { Category } from "@/lib/categories";

interface Props {
  categories: Category[];
  current: string | null;
  currentDisplayName: string | null;
}

export function HomepageNewCollection({ categories, current, currentDisplayName }: Props) {
  const [value, setValue] = useState(current ?? "");
  const [displayName, setDisplayName] = useState(currentDisplayName ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveNewCollectionSettings(value || null, displayName || null);
      if (res && "error" in res) setError(res.error ?? "Lỗi không xác định");
      else setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">
          Tên hiển thị trên trang chủ
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setSaved(false); }}
          placeholder="VD: Bộ sưu tập mới, Hàng mới về, New Arrivals…"
          className="w-full max-w-sm border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-muted">
          Để trống sẽ dùng tên danh mục mặc định
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink">
          Danh mục sản phẩm
        </label>
        <select
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false); }}
          className="w-full max-w-sm border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
        >
          <option value="">-- Chưa chọn (ẩn mục này) --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-muted">
          Sản phẩm mới nhất của danh mục này sẽ hiển thị
        </p>
      </div>

      {error && (
        <div className="rounded border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-ink px-5 py-2 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {isPending ? "Đang lưu…" : "Lưu"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
