"use client";

import { useState, useTransition } from "react";
import { saveFeaturedCategories } from "@/lib/homepage-settings-actions";
import type { Category } from "@/lib/categories";

interface Props {
  categories: Category[];
  selected: string[];
}

export function HomepageFeaturedCategories({ categories, selected }: Props) {
  const [checked, setChecked] = useState<string[]>(selected);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(value: string) {
    setChecked((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveFeaturedCategories(checked);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Tick các danh mục muốn hiển thị — thứ tự hiển thị theo thứ tự tích bên dưới
      </p>

      {error && (
        <div className="mb-3 rounded border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="divide-y divide-line border border-line bg-white">
        {categories.map((cat) => {
          const isChecked = checked.includes(cat.value);
          return (
            <label
              key={cat.id}
              className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-cream ${
                isChecked ? "bg-gold/5" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(cat.value)}
                className="h-4 w-4 accent-gold-dark"
              />
              <span className="text-sm text-ink">{cat.label}</span>
              {isChecked && (
                <span className="ml-auto text-xs text-muted">
                  Vị trí {checked.indexOf(cat.value) + 1}
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-ink px-5 py-2 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {isPending ? "Đang lưu…" : "Lưu danh mục nổi bật"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Đã lưu ✓</span>}
      </div>
    </div>
  );
}
