"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Banner } from "@/lib/banners";
import type { Category } from "@/lib/categories";
import type { Product } from "@/lib/types";

interface BannerFormProps {
  banner?: Banner;
  categories?: Category[];
  products?: Product[];
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

const STATIC_LINKS = [
  { label: "Tất cả sản phẩm", value: "/san-pham" },
  { label: "Hàng mới về", value: "/san-pham?filter=moi" },
  { label: "Thời trang Nam", value: "/san-pham?gender=nam" },
  { label: "Thời trang Nữ", value: "/san-pham?gender=nu" },
];

const CUSTOM_VALUE = "__custom__";

function detectSelectValue(url: string, categories: Category[], products: Product[]): string {
  if (!url) return STATIC_LINKS[0].value;
  if (STATIC_LINKS.some((s) => s.value === url)) return url;
  if (categories.some((c) => `/san-pham?category=${c.value}` === url)) return url;
  if (products.some((p) => `/san-pham/${p.slug}` === url)) return url;
  return CUSTOM_VALUE;
}

export function BannerForm({ banner, categories = [], products = [], action }: BannerFormProps) {
  const [imageUrl, setImageUrl] = useState<string>(banner?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const initialUrl = banner?.linkUrl ?? "/san-pham";
  const [linkUrl, setLinkUrl] = useState(initialUrl);
  const [selectValue, setSelectValue] = useState(() =>
    detectSelectValue(initialUrl, categories, products)
  );

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectValue(val);
    if (val !== CUSTOM_VALUE) setLinkUrl(val);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(path, file);
    if (uploadError) {
      setError(`Không thể tải ảnh: ${uploadError.message}`);
    } else {
      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
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
    fd.set("isActive", isActive ? "true" : "false");
    fd.set("linkUrl", linkUrl);
    const result = await action(fd);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Ảnh banner */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Ảnh banner
        </label>
        {imageUrl ? (
          <div className="relative">
            <div className="relative aspect-[16/6] w-full overflow-hidden rounded border border-line bg-cream">
              <Image src={imageUrl} alt="Banner preview" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/70 text-paper hover:bg-ink"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-line bg-surface px-6 py-10 transition-colors hover:border-gold hover:bg-cream/50">
            {uploading ? (
              <span className="text-sm text-muted">Đang tải lên…</span>
            ) : (
              <>
                <Upload size={24} className="text-muted" />
                <span className="text-sm text-muted">Nhấn để chọn ảnh banner</span>
                <span className="text-xs text-stone">JPG, PNG, WebP — khuyến nghị 1440×540px</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Tiêu đề (dùng để quản lý nội bộ) */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Tên banner (nội bộ) <span className="text-error">*</span>
        </label>
        <input
          name="title"
          defaultValue={banner?.title ?? ""}
          required
          placeholder="VD: Banner hè 2026 - Nam"
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
        />
        <p className="mt-1 text-xs text-stone">Chỉ hiển thị trong trang quản lý, không hiện ra ngoài web</p>
      </div>

      {/* Liên kết danh mục / sản phẩm */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Liên kết khi bấm vào banner
        </label>
        <select
          value={selectValue}
          onChange={handleSelectChange}
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
        >
          <optgroup label="Trang cửa hàng">
            {STATIC_LINKS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </optgroup>

          {categories.length > 0 && (
            <optgroup label="Danh mục">
              {categories.map((c) => (
                <option key={c.id} value={`/san-pham?category=${c.value}`}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          )}

          {products.length > 0 && (
            <optgroup label="Sản phẩm cụ thể">
              {products.map((p) => (
                <option key={p.id} value={`/san-pham/${p.slug}`}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="Khác">
            <option value={CUSTOM_VALUE}>— Nhập URL tùy chỉnh —</option>
          </optgroup>
        </select>

        {selectValue === CUSTOM_VALUE && (
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/san-pham?gender=nam"
            className="mt-2 w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
          />
        )}

        <p className="mt-1.5 text-xs text-stone">
          URL đang chọn: <span className="font-mono text-ink">{linkUrl}</span>
        </p>
      </div>

      {/* Vị trí & Trạng thái */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
            Vị trí (thứ tự)
          </label>
          <input
            name="position"
            type="number"
            min={0}
            defaultValue={banner?.position ?? 0}
            className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-gold focus:outline-none"
          />
          <p className="mt-1 text-xs text-stone">Số nhỏ hơn hiển thị trước</p>
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
            {isActive ? "Đang hiển thị" : "Đã ẩn"}
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 border-t border-line pt-5">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="bg-ink px-6 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {submitting ? "Đang lưu…" : banner ? "Cập nhật banner" : "Tạo banner"}
        </button>
        <a href="/admin/banners" className="text-sm text-muted hover:text-ink">
          Hủy
        </a>
      </div>
    </form>
  );
}
