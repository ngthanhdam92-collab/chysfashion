"use client";

import { useState, useTransition, useRef } from "react";
import { Pencil, Trash2, Check, X, Camera, Loader2 } from "lucide-react";
import { Category } from "@/lib/categories";
import { updateCategory, deleteCategory, updateCategoryImage, updateCategoryGender } from "@/lib/categories-actions";

export function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [imageUrl, setImageUrl] = useState(category.imageUrl ?? "");
  const [gender, setGender] = useState<"nam" | "nu" | "unisex">(category.gender);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setError("Không thể xóa — có thể đang có sản phẩm dùng danh mục này.");
        setConfirmingDelete(false);
      }
    });
  }

  function handleGenderChange(newGender: "nam" | "nu" | "unisex") {
    setGender(newGender);
    startTransition(async () => {
      const result = await updateCategoryGender(category.id, newGender);
      if (result && "error" in result) setError(result.error);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop();
      const fd = new FormData();
      fd.set("file", file);
      fd.set("path", `categories/${category.id}-${Date.now()}.${ext}`);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      const result = await updateCategoryImage(category.id, json.url);
      if (result && "error" in result) throw new Error(result.error);
      setImageUrl(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <tr className="border-b border-line last:border-0">
      {/* Ảnh đại diện */}
      <td className="px-4 py-3 w-16">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface transition-colors hover:border-gold"
          title="Click để đổi ảnh"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-muted" />
          ) : imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={category.label}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={14} className="text-white" />
              </div>
            </>
          ) : (
            <Camera size={16} className="text-muted group-hover:text-gold-dark" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </td>

      {/* Tên danh mục */}
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

      {/* Value */}
      <td className="px-4 py-3 text-muted">{category.value}</td>

      {/* Giới tính */}
      <td className="px-4 py-3">
        <select
          value={gender}
          onChange={(e) => handleGenderChange(e.target.value as "nam" | "nu" | "unisex")}
          disabled={isPending}
          className="border border-line bg-white px-2 py-1 text-xs text-ink focus:border-gold focus:outline-none disabled:opacity-50"
        >
          <option value="unisex">Unisex</option>
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
        </select>
      </td>

      {/* Thao tác */}
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
                onClick={() => { setEditing(false); setLabel(category.label); }}
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
