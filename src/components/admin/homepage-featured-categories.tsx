"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
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

  function moveUp(value: string) {
    setChecked((prev) => {
      const idx = prev.indexOf(value);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    setSaved(false);
  }

  function moveDown(value: string) {
    setChecked((prev) => {
      const idx = prev.indexOf(value);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
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

  // Checked items first (in user-defined order), then unchecked
  const checkedCats = checked
    .map((v) => categories.find((c) => c.value === v))
    .filter(Boolean) as Category[];
  const uncheckedCats = categories.filter((c) => !checked.includes(c.value));

  return (
    <div>
      <p className="mb-3 text-xs text-muted">
        Tick danh mục muốn hiển thị, dùng nút ↑↓ để sắp xếp thứ tự hiển thị trên trang chủ
      </p>

      {error && (
        <div className="mb-3 rounded border border-error/30 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </div>
      )}

      <div className="divide-y divide-line border border-line bg-white">
        {/* Checked items — user-controlled order */}
        {checkedCats.map((cat, idx) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 bg-gold/5 px-4 py-3"
          >
            <input
              type="checkbox"
              checked
              onChange={() => toggle(cat.value)}
              className="h-4 w-4 accent-gold-dark"
            />
            <span className="text-sm text-ink">{cat.label}</span>
            <span className="ml-auto text-xs font-medium text-gold-dark">
              Vị trí {idx + 1}
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => moveUp(cat.value)}
                disabled={idx === 0}
                className="p-0.5 text-muted hover:text-ink disabled:opacity-20"
                aria-label="Lên"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(cat.value)}
                disabled={idx === checkedCats.length - 1}
                className="p-0.5 text-muted hover:text-ink disabled:opacity-20"
                aria-label="Xuống"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        ))}

        {/* Unchecked items */}
        {uncheckedCats.map((cat) => (
          <label
            key={cat.id}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-cream"
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() => toggle(cat.value)}
              className="h-4 w-4 accent-gold-dark"
            />
            <span className="text-sm text-ink">{cat.label}</span>
          </label>
        ))}
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
