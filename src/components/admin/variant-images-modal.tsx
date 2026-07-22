"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus, ImageIcon } from "lucide-react";
import { ProductColor } from "@/lib/types";
import { updateVariantImages } from "@/lib/products-actions";

interface Props {
  productId: string;
  productName: string;
  colors: ProductColor[];
  onClose: () => void;
}

export function VariantImagesModal({ productId, productName, colors, onClose }: Props) {
  const [images, setImages] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const c of colors) {
      map[c.name] = c.images ?? [];
    }
    return map;
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleUpload(colorName: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(colorName);
    setError(null);
    setSaved(false);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fd = new FormData();
      fd.set("file", file);
      fd.set("path", `variants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(`Không thể tải ảnh: ${json.error ?? `HTTP ${res.status}`}`);
        continue;
      }
      urls.push(json.url);
    }
    if (urls.length > 0) {
      setImages((prev) => ({
        ...prev,
        [colorName]: [...(prev[colorName] ?? []), ...urls],
      }));
    }
    setUploading(null);
  }

  function removeImage(colorName: string, url: string) {
    setImages((prev) => ({
      ...prev,
      [colorName]: (prev[colorName] ?? []).filter((u) => u !== url),
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateVariantImages(productId, images);
    if (result && "error" in result) {
      setError(result.error ?? "Lỗi không xác định");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-sm font-medium text-ink">Ảnh biến thể</p>
            <p className="mt-0.5 text-xs text-muted">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-error"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-line">
          {colors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
              <ImageIcon size={32} strokeWidth={1} />
              <p className="text-sm">Sản phẩm chưa có phân loại màu sắc</p>
            </div>
          ) : (
            colors.map((color) => (
              <div key={color.name} className="px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  {color.hex && color.hex !== "#000000" && (
                    <span
                      className="h-4 w-4 rounded-full border border-line"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                  <span className="text-sm font-medium text-ink">{color.name}</span>
                  <span className="text-xs text-muted">
                    ({(images[color.name] ?? []).length} ảnh)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(images[color.name] ?? []).map((url) => (
                    <div key={url} className="group relative h-20 w-20 shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden border border-line">
                        <Image src={url} alt="" fill unoptimized sizes="80px" className="object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(color.name, url)}
                        className="absolute -right-1 -top-1 rounded-full bg-error p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  <label
                    className={`flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-white text-muted transition-colors hover:border-gold hover:text-gold-dark ${
                      uploading === color.name ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <Plus size={20} strokeWidth={1.5} />
                    <span className="text-[10px]">
                      {uploading === color.name ? "Đang tải..." : "Thêm ảnh"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUpload(color.name, e.target.files)}
                    />
                  </label>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <div>
            {error && <p className="text-xs text-error">{error}</p>}
            {saved && <p className="text-xs text-green-600">Đã lưu thành công!</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-line px-4 py-2 text-sm text-muted hover:border-ink hover:text-ink"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || colors.length === 0}
              className="bg-ink px-5 py-2 text-sm text-paper hover:bg-ink/85 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu ảnh biến thể"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
