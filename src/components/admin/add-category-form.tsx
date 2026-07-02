"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { createCategory } from "@/lib/categories-actions";

export function AddCategoryForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await createCategory(formData);
    setSubmitting(false);
    if (result && "error" in result) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs text-muted" htmlFor="label">
          Tên danh mục mới
        </label>
        <input
          id="label"
          name="label"
          required
          placeholder="Ví dụ: Đồ bơi"
          className="mt-1 w-56 border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-ink px-4 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
      >
        <Plus size={15} /> {submitting ? "Đang thêm..." : "Thêm danh mục"}
      </button>
      {error && <p className="w-full text-sm text-error">{error}</p>}
    </form>
  );
}
