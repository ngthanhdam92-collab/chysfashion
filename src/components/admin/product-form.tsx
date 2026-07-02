"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Product } from "@/lib/types";
import { Category } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export function ProductForm({ product, categories, action }: ProductFormProps) {
  const [keptImages, setKeptImages] = useState<string[]>(product?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const supabase = createClient();

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(path, file);

      if (uploadError) {
        setError(`Không thể tải ảnh "${file.name}": ${uploadError.message}`);
        continue;
      }

      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      setKeptImages((imgs) => [...imgs, data.publicUrl]);
    }

    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    const result = await action(formData);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  const colorsText = (product?.colors ?? [])
    .map((c) => `${c.name},${c.hex}`)
    .join("\n");
  const sizesText = (product?.sizes ?? []).join("\n");
  const detailsText = (product?.details ?? []).join("\n");

  return (
    <form action={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="name">
            Tên sản phẩm *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="slug">
            Đường dẫn (slug) — để trống sẽ tự tạo từ tên
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={product?.slug}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="gender">
            Giới tính *
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={product?.gender ?? "unisex"}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          >
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="category">
            Danh mục *
          </label>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-error">
              Chưa có danh mục nào — vào mục Danh mục để thêm trước.
            </p>
          )}
          <select
            id="category"
            name="category"
            defaultValue={product?.category}
            onChange={(e) => {
              const label = categories.find((c) => c.value === e.target.value)?.label ?? "";
              const input = document.getElementById("categoryLabel") as HTMLInputElement | null;
              if (input) input.value = label;
            }}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            id="categoryLabel"
            name="categoryLabel"
            type="hidden"
            defaultValue={product?.categoryLabel ?? categories[0]?.label ?? ""}
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="price">
            Giá bán (đ) *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            required
            defaultValue={product?.price}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="compareAtPrice">
            Giá gốc trước giảm (đ) — tuỳ chọn
          </label>
          <input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            min={0}
            defaultValue={product?.compareAtPrice}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="rating">
            Điểm đánh giá (0-5)
          </label>
          <input
            id="rating"
            name="rating"
            type="number"
            step="0.1"
            min={0}
            max={5}
            defaultValue={product?.rating ?? 5}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="reviewCount">
            Số lượt đánh giá
          </label>
          <input
            id="reviewCount"
            name="reviewCount"
            type="number"
            min={0}
            defaultValue={product?.reviewCount ?? 0}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="sizes">
            Kích thước (mỗi dòng 1 size, ví dụ: S / M / L / XL)
          </label>
          <textarea
            id="sizes"
            name="sizes"
            rows={4}
            defaultValue={sizesText || "S\nM\nL\nXL"}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="colors">
            Màu sắc (mỗi dòng: Tên màu,#mãhex — ví dụ: Đen,#171310)
          </label>
          <textarea
            id="colors"
            name="colors"
            rows={4}
            defaultValue={colorsText || "Đen,#171310"}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="description">
            Mô tả sản phẩm
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="details">
            Chi tiết chất liệu (mỗi dòng 1 gạch đầu dòng)
          </label>
          <textarea
            id="details"
            name="details"
            rows={4}
            defaultValue={detailsText}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} />
          Hàng mới về
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="isBestSeller"
            defaultChecked={product?.isBestSeller}
          />
          Bán chạy
        </label>
      </div>

      <div>
        <label className="text-xs text-muted">Ảnh sản phẩm</label>
        <div className="mt-2 flex flex-wrap gap-3">
          {keptImages.map((url) => (
            <div key={url} className="relative h-24 w-20 overflow-hidden border border-line">
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <input type="hidden" name="keptImages" value={url} />
              <button
                type="button"
                onClick={() => setKeptImages((imgs) => imgs.filter((u) => u !== url))}
                className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-paper"
                aria-label="Xóa ảnh"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={handleFileChange}
          className="mt-3 block text-sm"
        />
        {uploading && <p className="mt-2 text-xs text-muted">Đang tải ảnh lên...</p>}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="bg-ink px-6 py-3 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
      >
        {submitting ? "Đang lưu..." : "Lưu sản phẩm"}
      </button>
    </form>
  );
}
