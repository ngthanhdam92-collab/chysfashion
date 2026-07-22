"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import type { CategoryTile } from "@/lib/category-tiles";
import type { Category } from "@/lib/categories";

interface CategoryTileFormProps {
  tile?: CategoryTile;
  categories?: Category[];
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

const STATIC_HREFS = [
  { label: "Tất cả sản phẩm", value: "/san-pham" },
  { label: "Thời trang Nam", value: "/san-pham?gender=nam" },
  { label: "Thời trang Nữ", value: "/san-pham?gender=nu" },
  { label: "Hàng mới về", value: "/san-pham?filter=moi" },
];

const CUSTOM = "__custom__";

function detectSelect(href: string, categories: Category[]): string {
  if (STATIC_HREFS.some((s) => s.value === href)) return href;
  if (categories.some((c) => `/san-pham?category=${c.value}` === href)) return href;
  return CUSTOM;
}

export function CategoryTileForm({ tile, categories = [], action }: CategoryTileFormProps) {
  const initialHref = tile?.href ?? "/san-pham";
  const [href, setHref] = useState(initialHref);
  const [selectVal, setSelectVal] = useState(() => detectSelect(initialHref, categories));
  const [imageUrl, setImageUrl] = useState(tile?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(tile?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectVal(val);
    if (val !== CUSTOM) setHref(val);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const fd = new FormData();
    fd.set("file", file);
    fd.set("path", `tiles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok || json.error) {
      setError(`Không thể tải ảnh: ${json.error ?? `HTTP ${res.status}`}`);
    } else {
      setImageUrl(json.url);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    fd.set("imageUrl", imageUrl);
    fd.set("href", href);
    fd.set("isActive", isActive ? "true" : "false");
    const result = await action(fd);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Ảnh */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Ảnh danh mục
        </label>
        {imageUrl ? (
          <div className="relative">
            <div className="relative aspect-[3/4] w-40 overflow-hidden rounded border border-line bg-cream">
              <Image src={imageUrl} alt="preview" fill unoptimized className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper hover:bg-ink"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-line bg-surface py-8 transition-colors hover:border-gold hover:bg-cream/50">
            {uploading ? (
              <span className="text-xs text-muted">Đang tải…</span>
            ) : (
              <>
                <Upload size={20} className="text-muted" />
                <span className="px-2 text-center text-xs text-muted">Chọn ảnh</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="hidden" />
          </label>
        )}
        <p className="mt-1 text-xs text-stone">Khuyến nghị tỉ lệ 3:4 (dọc)</p>
      </div>

      {/* Tên */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Tên hiển thị <span className="text-error">*</span>
        </label>
        <input
          name="label"
          defaultValue={tile?.label ?? ""}
          required
          placeholder="VD: Thời trang Nam"
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
        />
      </div>

      {/* Liên kết */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Liên kết khi bấm
        </label>
        <select
          value={selectVal}
          onChange={handleSelectChange}
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
        >
          <optgroup label="Trang cửa hàng">
            {STATIC_HREFS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </optgroup>
          {categories.length > 0 && (
            <optgroup label="Danh mục">
              {categories.map((c) => (
                <option key={c.id} value={`/san-pham?category=${c.value}`}>{c.label}</option>
              ))}
            </optgroup>
          )}
          <optgroup label="Khác">
            <option value={CUSTOM}>— Nhập URL tùy chỉnh —</option>
          </optgroup>
        </select>
        {selectVal === CUSTOM && (
          <input
            type="text"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="/san-pham?..."
            className="mt-2 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
          />
        )}
      </div>

      {/* Vị trí & Trạng thái */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
            Vị trí
          </label>
          <input
            name="position"
            type="number"
            min={0}
            defaultValue={tile?.position ?? 0}
            className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-stone">Số nhỏ hiển thị trước</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
            Trạng thái
          </label>
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-emerald-100 text-emerald-700" : "bg-line text-muted"
            }`}
          >
            <span className={`h-3 w-3 rounded-full ${isActive ? "bg-emerald-500" : "bg-stone"}`} />
            {isActive ? "Hiển thị" : "Ẩn"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="bg-ink px-6 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {submitting ? "Đang lưu…" : tile ? "Cập nhật" : "Tạo ô danh mục"}
        </button>
        <a href="/admin/homepage" className="text-sm text-muted hover:text-ink">Hủy</a>
      </div>
    </form>
  );
}
