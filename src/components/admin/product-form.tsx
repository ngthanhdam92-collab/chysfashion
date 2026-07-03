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

interface VariantValue {
  price: string;
  stock: string;
  sku: string;
}

function variantKey(color: string, size: string) {
  return `${color}__${size}`;
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

  // ===== Phân loại hàng (giá/kho/SKU riêng theo Màu × Size) =====
  const [variantsEnabled, setVariantsEnabled] = useState(
    (product?.variants?.length ?? 0) > 0
  );
  const [variantData, setVariantData] = useState<Record<string, VariantValue>>(() => {
    const initial: Record<string, VariantValue> = {};
    for (const v of product?.variants ?? []) {
      initial[variantKey(v.color, v.size)] = {
        price: v.price ? String(v.price) : "",
        stock: String(v.stock ?? 0),
        sku: v.sku ?? "",
      };
    }
    return initial;
  });
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkSku, setBulkSku] = useState("");

  const variantCombos = variantsEnabled
    ? selectedColors.flatMap((color) =>
        selectedSizes.map((size) => ({ color: color.name, size }))
      )
    : [];

  function getVariant(color: string, size: string): VariantValue {
    return variantData[variantKey(color, size)] ?? { price: "", stock: "0", sku: "" };
  }

  function setVariantField(color: string, size: string, field: keyof VariantValue, value: string) {
    const key = variantKey(color, size);
    setVariantData((data) => ({
      ...data,
      [key]: { ...getVariant(color, size), ...data[key], [field]: value },
    }));
  }

  function applyBulk() {
    setVariantData((data) => {
      const next = { ...data };
      for (const combo of variantCombos) {
        const key = variantKey(combo.color, combo.size);
        const current = next[key] ?? { price: "", stock: "0", sku: "" };
        next[key] = {
          price: bulkPrice !== "" ? bulkPrice : current.price,
          stock: bulkStock !== "" ? bulkStock : current.stock,
          sku: bulkSku !== "" ? bulkSku : current.sku,
        };
      }
      return next;
    });
  }

  const variantsJson = JSON.stringify(
    variantCombos.map((combo) => {
      const v = getVariant(combo.color, combo.size);
      return {
        color: combo.color,
        size: combo.size,
        price: Number(v.price) || 0,
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
        sku: v.sku,
      };
    })
  );

  const totalVariantStock = variantCombos.reduce(
    (sum, combo) => sum + (Math.floor(Number(getVariant(combo.color, combo.size).stock)) || 0),
    0
  );

  // ===== Video sản phẩm =====
  const [videoUrl, setVideoUrl] = useState<string>(product?.videoUrl ?? "");
  const [uploadingVideo, setUploadingVideo] = useState(false);

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) {
      setError("Video tối đa 30MB. Vui lòng nén video nhỏ hơn.");
      e.target.value = "";
      return;
    }

    setUploadingVideo(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(path, file);

    if (uploadError) {
      setError(`Không thể tải video: ${uploadError.message}`);
    } else {
      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      setVideoUrl(data.publicUrl);
    }
    setUploadingVideo(false);
    e.target.value = "";
  }

  function makeCover(url: string) {
    setKeptImages((imgs) => [url, ...imgs.filter((u) => u !== url)]);
  }

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
          <label className="text-xs text-muted" htmlFor="stock">
            Số lượng tồn kho {variantsEnabled ? "" : "*"}
          </label>
          {variantsEnabled ? (
            <p className="mt-2.5 text-sm text-ink">
              Tổng theo bảng phân loại: <span className="font-medium">{totalVariantStock}</span>
            </p>
          ) : (
            <input
              id="stock"
              name="stock"
              type="number"
              min={0}
              required
              defaultValue={product?.stock ?? 0}
              className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
          )}
          <p className="mt-1 text-xs text-muted">
            Về 0 sẽ hiện &quot;Hết hàng&quot; trên website. Tự trừ khi khách đặt hàng.
          </p>
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
          <input type="hidden" name="variants" value={variantsEnabled ? variantsJson : "[]"} />
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={variantsEnabled}
              onChange={(e) => setVariantsEnabled(e.target.checked)}
            />
            Bật phân loại hàng — đặt giá, kho hàng, SKU riêng cho từng Màu × Size
          </label>

          {variantsEnabled && variantCombos.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-end gap-2 border border-line bg-cream/40 p-3">
                <div>
                  <label className="text-xs text-muted" htmlFor="bulkPrice">
                    Giá (đ)
                  </label>
                  <input
                    id="bulkPrice"
                    type="number"
                    min={0}
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="149000"
                    className="mt-1 w-32 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" htmlFor="bulkStock">
                    Kho hàng
                  </label>
                  <input
                    id="bulkStock"
                    type="number"
                    min={0}
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    placeholder="100"
                    className="mt-1 w-28 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted" htmlFor="bulkSku">
                    SKU phân loại
                  </label>
                  <input
                    id="bulkSku"
                    value={bulkSku}
                    onChange={(e) => setBulkSku(e.target.value)}
                    placeholder="OP11"
                    className="mt-1 w-32 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyBulk}
                  className="bg-gold px-4 py-2 text-[12px] tracking-label uppercase text-paper hover:bg-gold-dark"
                >
                  Áp dụng cho tất cả phân loại
                </button>
              </div>

              <div className="overflow-x-auto border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-cream/40 text-left text-xs uppercase tracking-label text-muted">
                      <th className="px-3 py-2.5">Màu sắc</th>
                      <th className="px-3 py-2.5">Size</th>
                      <th className="px-3 py-2.5">Giá (đ) *</th>
                      <th className="px-3 py-2.5">Kho hàng *</th>
                      <th className="px-3 py-2.5">SKU phân loại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantCombos.map((combo) => {
                      const v = getVariant(combo.color, combo.size);
                      return (
                        <tr
                          key={variantKey(combo.color, combo.size)}
                          className="border-b border-line last:border-0"
                        >
                          <td className="px-3 py-2 text-ink">{combo.color}</td>
                          <td className="px-3 py-2 text-ink">{combo.size}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={v.price}
                              onChange={(e) =>
                                setVariantField(combo.color, combo.size, "price", e.target.value)
                              }
                              className="w-28 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={v.stock}
                              onChange={(e) =>
                                setVariantField(combo.color, combo.size, "stock", e.target.value)
                              }
                              className="w-24 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={v.sku}
                              onChange={(e) =>
                                setVariantField(combo.color, combo.size, "sku", e.target.value)
                              }
                              className="w-32 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted">
                Giá hiển thị trên website sẽ tự lấy giá thấp nhất trong bảng; tổng tồn kho tự
                cộng từ các phân loại. Khách đặt phân loại nào thì kho phân loại đó tự trừ.
              </p>
            </div>
          )}
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
        <label className="text-xs text-muted">
          Ảnh sản phẩm — ảnh đầu tiên là ảnh bìa hiển thị ngoài danh sách
        </label>
        <div className="mt-2 flex flex-wrap gap-3">
          {keptImages.map((url, index) => (
            <div key={url} className="w-24">
              <div
                className={`relative h-28 w-24 overflow-hidden border ${
                  index === 0 ? "border-2 border-gold" : "border-line"
                }`}
              >
                <Image src={url} alt="" fill sizes="96px" className="object-cover" />
                <input type="hidden" name="keptImages" value={url} />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-gold/90 py-0.5 text-center text-[10px] uppercase text-paper">
                    Ảnh bìa
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setKeptImages((imgs) => imgs.filter((u) => u !== url))}
                  className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-paper"
                  aria-label="Xóa ảnh"
                >
                  <X size={12} />
                </button>
              </div>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  className="mt-1 w-full text-center text-[11px] text-muted hover:text-gold-dark"
                >
                  Đặt làm ảnh bìa
                </button>
              )}
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

      <div>
        <label className="text-xs text-muted">
          Video sản phẩm (tuỳ chọn) — MP4, tối đa 30MB
        </label>
        <input type="hidden" name="videoUrl" value={videoUrl} />
        {videoUrl ? (
          <div className="mt-2 flex items-start gap-3">
            <video src={videoUrl} controls className="h-40 border border-line bg-ink/5" />
            <button
              type="button"
              onClick={() => setVideoUrl("")}
              className="flex items-center gap-1.5 border border-line px-3 py-2 text-sm text-muted hover:border-error hover:text-error"
            >
              <X size={14} /> Xóa video
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            disabled={uploadingVideo}
            onChange={handleVideoChange}
            className="mt-2 block text-sm"
          />
        )}
        {uploadingVideo && (
          <p className="mt-2 text-xs text-muted">Đang tải video lên (có thể mất một lúc)...</p>
        )}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading || uploadingVideo}
        className="bg-ink px-6 py-3 text-[12px] tracking-label uppercase text-paper transition-colors hover:bg-ink/85 disabled:opacity-50"
      >
        {submitting ? "Đang lưu..." : "Lưu sản phẩm"}
      </button>
    </form>
  );
}
