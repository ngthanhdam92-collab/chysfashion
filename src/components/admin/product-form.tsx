"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Check, Plus } from "lucide-react";
import { Product, ProductColor } from "@/lib/types";
import { Category } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Freesize"];

const PRESET_COLORS: ProductColor[] = [
  { name: "Đen", hex: "#171310" },
  { name: "Trắng", hex: "#ffffff" },
  { name: "Kem", hex: "#f1ebe0" },
  { name: "Be", hex: "#c9b79c" },
  { name: "Xám", hex: "#8a8479" },
  { name: "Nâu", hex: "#5c4224" },
  { name: "Xanh rêu", hex: "#3f5e3f" },
  { name: "Xanh navy", hex: "#1f2a44" },
  { name: "Xanh dương", hex: "#2563eb" },
  { name: "Đỏ", hex: "#c0392b" },
  { name: "Đỏ đô", hex: "#6d2f34" },
  { name: "Hồng", hex: "#e8a0bf" },
  { name: "Vàng", hex: "#d4a017" },
  { name: "Cam", hex: "#d97706" },
  { name: "Tím", hex: "#6b21a8" },
];

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

  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    product?.sizes ?? ["S", "M", "L", "XL"]
  );
  const [selectedColors, setSelectedColors] = useState<ProductColor[]>(
    product?.colors ?? [{ name: "Đen", hex: "#171310" }]
  );
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#a9843f");

  // Gộp bảng màu mặc định với các màu tùy chỉnh đã lưu trên sản phẩm (khi sửa)
  const paletteColors = [
    ...PRESET_COLORS,
    ...selectedColors.filter(
      (c) => !PRESET_COLORS.some((p) => p.name === c.name && p.hex === c.hex)
    ),
  ];

  function toggleSize(size: string) {
    setSelectedSizes((sizes) =>
      sizes.includes(size) ? sizes.filter((s) => s !== size) : [...sizes, size]
    );
  }

  function toggleColor(color: ProductColor) {
    setSelectedColors((colors) =>
      colors.some((c) => c.name === color.name && c.hex === color.hex)
        ? colors.filter((c) => !(c.name === color.name && c.hex === color.hex))
        : [...colors, color]
    );
  }

  function addCustomColor() {
    const name = customColorName.trim();
    if (!name) return;
    if (!selectedColors.some((c) => c.name === name)) {
      setSelectedColors((colors) => [...colors, { name, hex: customColorHex }]);
    }
    setCustomColorName("");
  }

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
          <label className="text-xs text-muted">
            Kích thước — bấm để chọn/bỏ chọn
          </label>
          <input type="hidden" name="sizes" value={selectedSizes.join("\n")} />
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_SIZES.map((size) => {
              const active = selectedSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`min-w-12 border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-white text-ink hover:border-ink"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {selectedSizes.length === 0 && (
            <p className="mt-1.5 text-xs text-error">Chọn ít nhất 1 kích thước.</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted">
            Màu sắc — bấm để chọn/bỏ chọn
          </label>
          <input
            type="hidden"
            name="colors"
            value={selectedColors.map((c) => `${c.name},${c.hex}`).join("\n")}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {paletteColors.map((color) => {
              const active = selectedColors.some(
                (c) => c.name === color.name && c.hex === color.hex
              );
              return (
                <button
                  key={`${color.name}-${color.hex}`}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`flex items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-gold bg-gold/10 text-ink"
                      : "border-line bg-white text-ink hover:border-ink"
                  }`}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-line"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                  {active && <Check size={13} className="text-gold-dark" />}
                </button>
              );
            })}
          </div>
          {selectedColors.length === 0 && (
            <p className="mt-1.5 text-xs text-error">Chọn ít nhất 1 màu.</p>
          )}
          <div className="mt-3 flex items-end gap-2">
            <div>
              <label className="text-xs text-muted" htmlFor="customColorName">
                Thêm màu khác (nếu cần)
              </label>
              <input
                id="customColorName"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                placeholder="Tên màu, ví dụ: Xanh mint"
                className="mt-1 w-48 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <input
              type="color"
              value={customColorHex}
              onChange={(e) => setCustomColorHex(e.target.value)}
              className="h-9 w-12 cursor-pointer border border-line bg-white"
              aria-label="Chọn mã màu"
            />
            <button
              type="button"
              onClick={addCustomColor}
              disabled={!customColorName.trim()}
              className="flex items-center gap-1.5 border border-ink px-3 py-2 text-sm text-ink hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              <Plus size={14} /> Thêm màu
            </button>
          </div>
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
