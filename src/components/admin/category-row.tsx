"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Category } from "@/lib/categories";
import { updateCategory, deleteCategory } from "@/lib/categories-actions";

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const formData = new FormData();
    formData.set("label", label);
    startTransition(async () => {
      const result = await updateCategory(category.id, formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result && "error" in result) {
        setError(
          "Không thể xóa — có thể đang có sản phẩm dùng danh mục này."
        );
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
            autoFocus
          />
        ) : (
          <span className="text-ink">{category.label}</span>
        )}
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </td>
      <td className="px-4 py-3 text-muted">{category.value}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          {editing ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="p-1.5 text-success hover:opacity-70"
                aria-label="Lưu"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setLabel(category.label);
                }}
                className="p-1.5 text-muted hover:text-ink"
                aria-label="Hủy"
              >
                <X size={16} />
              </button>
            </>
          ) : confirmingDelete ? (
            <span className="inline-flex items-center gap-2 text-xs">
              Xóa?
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="font-medium text-error hover:underline"
              >
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-muted hover:underline"
              >
                Hủy
              </button>
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="p-1.5 text-muted hover:text-gold-dark"
                aria-label={`Sửa ${category.label}`}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="p-1.5 text-muted hover:text-error"
                aria-label={`Xóa ${category.label}`}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
