"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Banner } from "@/lib/banners";

interface BannerFormProps {
  banner?: Banner;
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export function BannerForm({ banner, action }: BannerFormProps) {
  const [imageUrl, setImageUrl] = useState<string>(banner?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

      {/* Tiêu đề */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Tiêu đề <span className="text-error">*</span>
        </label>
        <input
          name="title"
          defaultValue={banner?.title ?? ""}
          required
          placeholder="VD: Bộ sưu tập Thu Đông 2026"
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
        />
      </div>

      {/* Phụ đề */}
      <div>
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
          Phụ đề
        </label>
        <textarea
          name="subtitle"
          defaultValue={banner?.subtitle ?? ""}
          rows={2}
          placeholder="VD: Tối giản. Tinh tế. Bền vững."
          className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
        />
      </div>

      {/* Link & Label */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
            Đường dẫn nút
          </label>
          <input
            name="linkUrl"
            defaultValue={banner?.linkUrl ?? "/san-pham"}
            placeholder="/san-pham"
            className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-widest text-ink">
            Tên nút
          </label>
          <input
            name="linkLabel"
            defaultValue={banner?.linkLabel ?? "Khám phá ngay"}
            placeholder="Khám phá ngay"
            className="w-full border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
          />
        </div>
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
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-line text-muted"
            }`}
          >
            <span
              className={`h-3 w-3 rounded-full ${isActive ? "bg-emerald-500" : "bg-stone"}`}
            />
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
        <a
          href="/admin/banners"
          className="text-sm text-muted hover:text-ink"
        >
          Hủy
        </a>
      </div>
    </form>
  );
}
