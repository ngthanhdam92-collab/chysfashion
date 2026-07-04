"use client";

import { useState, useTransition } from "react";
import { saveNewCollectionCategory } from "@/lib/homepage-settings-actions";
import type { Category } from "@/lib/categories";

interface Props {
  categories: Category[];
  current: string | null;
}

export function HomepageNewCollection({ categories, current }: Props) {
  const [value, setValue] = useState(current ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveNewCollectionCategory(value || null);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Chọn danh mục — sản phẩm mới nhất của danh mục đó sẽ hiển thị trong mục này
      </p>

      {error && (
        <div className="mb-3 rounded border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

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

      <div className="mt-3 flex items-center gap-3">
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
