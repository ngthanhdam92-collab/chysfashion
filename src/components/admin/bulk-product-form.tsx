"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Category } from "@/lib/categories";
import type { SizeChartTemplate } from "@/lib/size-chart-templates";

interface ColorEntry {
  name: string;
  hex: string;
}

interface VariantValue {
  price: string;
  compareAtPrice: string;
  stock: string;
  costPrice: string;
}

interface BulkItem {
  id: string;
  name: string;
  images: string[];
  variantImages: Record<string, string[]>;
  sku: string;
}

interface BulkProductFormProps {
  categories: Category[];
  sizeCharts: SizeChartTemplate[];
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

function variantKey(color: string, size: string) {
  return `${color}__${size}`;
}

function newItem(): BulkItem {
  return { id: crypto.randomUUID(), name: "", images: [], variantImages: {}, sku: "" };
}

export function BulkProductForm({ categories, sizeCharts, action }: BulkProductFormProps) {
  const [categoryValue, setCategoryValue] = useState(categories[0]?.value ?? "");
  const [categoryLabel, setCategoryLabel] = useState(categories[0]?.label ?? "");
  const [gender, setGender] = useState("unisex");
  const [sizeChartId, setSizeChartId] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [rating, setRating] = useState("5");
  const [reviewCount, setReviewCount] = useState("0");

  const [colors, setColors] = useState<ColorEntry[]>([{ name: "", hex: "#171310" }]);
  const [sizesText, setSizesText] = useState("");

  const [variantData, setVariantData] = useState<Record<string, VariantValue>>({});
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkCompareAtPrice, setBulkCompareAtPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [bulkCostPrice, setBulkCostPrice] = useState("");

  const [items, setItems] = useState<BulkItem[]>([newItem()]);
  const [uploadingMain, setUploadingMain] = useState<string | null>(null);
  const [uploadingVariant, setUploadingVariant] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeColors = colors.filter((c) => c.name.trim());
  const activeSizes = sizesText.split("\n").map((s) => s.trim()).filter(Boolean);

  const variantCombos =
    activeColors.length > 0
      ? activeSizes.length > 0
        ? activeColors.flatMap((c) => activeSizes.map((s) => ({ color: c.name, size: s })))
        : activeColors.map((c) => ({ color: c.name, size: "" }))
      : [];

  function getVariant(color: string, size: string): VariantValue {
    return variantData[variantKey(color, size)] ?? { price: "", compareAtPrice: "", stock: "0", costPrice: "" };
  }

  function setVariantField(color: string, size: string, field: keyof VariantValue, value: string) {
    const key = variantKey(color, size);
    setVariantData((d) => ({ ...d, [key]: { ...getVariant(color, size), ...d[key], [field]: value } }));
  }

  function applyBulk() {
    setVariantData((d) => {
      const next = { ...d };
      for (const combo of variantCombos) {
        const key = variantKey(combo.color, combo.size);
        const cur = next[key] ?? { price: "", compareAtPrice: "", stock: "0", costPrice: "" };
        next[key] = {
          price: bulkPrice !== "" ? bulkPrice : cur.price,
          compareAtPrice: bulkCompareAtPrice !== "" ? bulkCompareAtPrice : cur.compareAtPrice,
          stock: bulkStock !== "" ? bulkStock : cur.stock,
          costPrice: bulkCostPrice !== "" ? bulkCostPrice : cur.costPrice,
        };
      }
      return next;
    });
  }

  function updateColor(idx: number, field: keyof ColorEntry, value: string) {
    setColors((cs) => {
      const next = cs.map((c, i) => (i === idx ? { ...c, [field]: value } : c));
      if (field === "name" && value.trim() && idx === cs.length - 1) {
        next.push({ name: "", hex: "#171310" });
      }
      return next;
    });
  }

  function removeColor(idx: number) {
    setColors((cs) => {
      const next = cs.filter((_, i) => i !== idx);
      if (next.length === 0 || next[next.length - 1].name.trim() !== "") {
        next.push({ name: "", hex: "#171310" });
      }
      return next;
    });
  }

  function updateItem(id: string, patch: Partial<BulkItem>) {
    setItems((its) => its.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: string) {
    setItems((its) => its.filter((it) => it.id !== id));
  }

  async function handleMainImageUpload(itemId: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingMain(itemId);
    setError(null);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-media").upload(path, file);
      if (uploadError) { setError(`Không thể tải ảnh: ${uploadError.message}`); continue; }
      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    if (urls.length > 0) {
      setItems((its) =>
        its.map((it) => (it.id === itemId ? { ...it, images: [...it.images, ...urls] } : it))
      );
    }
    setUploadingMain(null);
  }

  async function handleVariantImageUpload(itemId: string, colorName: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const uploadKey = `${itemId}__${colorName}`;
    setUploadingVariant(uploadKey);
    setError(null);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `variants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-media").upload(path, file);
      if (uploadError) { setError(`Không thể tải ảnh: ${uploadError.message}`); continue; }
      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    if (urls.length > 0) {
      setItems((its) =>
        its.map((it) =>
          it.id !== itemId
            ? it
            : {
                ...it,
                variantImages: {
                  ...it.variantImages,
                  [colorName]: [...(it.variantImages[colorName] ?? []), ...urls],
                },
              }
        )
      );
    }
    setUploadingVariant(null);
  }

  function removeMainImage(itemId: string, url: string) {
    setItems((its) =>
      its.map((it) => (it.id !== itemId ? it : { ...it, images: it.images.filter((u) => u !== url) }))
    );
  }

  function makeImageCover(itemId: string, url: string) {
    setItems((its) =>
      its.map((it) =>
        it.id !== itemId ? it : { ...it, images: [url, ...it.images.filter((u) => u !== url)] }
      )
    );
  }

  function removeVariantImage(itemId: string, colorName: string, url: string) {
    setItems((its) =>
      its.map((it) =>
        it.id !== itemId
          ? it
          : {
              ...it,
              variantImages: {
                ...it.variantImages,
                [colorName]: (it.variantImages[colorName] ?? []).filter((u) => u !== url),
              },
            }
      )
    );
  }

  const colorsValue = activeColors.map((c) => `${c.name},${c.hex}`).join("\n");
  const sizesValue = activeSizes.join("\n");
  const variantsTemplateJson = JSON.stringify(
    variantCombos.map((combo) => {
      const v = getVariant(combo.color, combo.size);
      const cap = Number(v.compareAtPrice) || 0;
      const cp = Number(v.costPrice) || 0;
      return {
        color: combo.color,
        size: combo.size,
        price: Number(v.price) || 0,
        ...(cap > 0 ? { compareAtPrice: cap } : {}),
        ...(cp > 0 ? { costPrice: cp } : {}),
        stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
      };
    })
  );

  const validItems = items.filter((it) => it.name.trim());
  const itemsJson = JSON.stringify(
    validItems.map(({ name, images, variantImages, sku }) => ({ name, images, variantImages, sku }))
  );

  async function handleSubmit(formData: FormData) {
    if (validItems.length === 0) {
      setError("Vui lòng nhập ít nhất một tên sản phẩm.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await action(formData);
    if (result && "error" in result) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Hidden serialized fields */}
      <input type="hidden" name="colors" value={colorsValue} />
      <input type="hidden" name="sizes" value={sizesValue} />
      <input type="hidden" name="variantsTemplate" value={variantsTemplateJson} />
      <input type="hidden" name="items" value={itemsJson} />

      {/* ===== THÔNG TIN CHUNG ===== */}
      <div className="border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-label text-muted">
            Thông tin chung — áp dụng cho tất cả sản phẩm
          </p>
        </div>
        <div className="space-y-6 px-6 py-5">

          {/* Danh mục + Giới tính */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted">Danh mục *</label>
              <select
                name="category"
                value={categoryValue}
                onChange={(e) => {
                  setCategoryValue(e.target.value);
                  setCategoryLabel(categories.find((c) => c.value === e.target.value)?.label ?? "");
                }}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input type="hidden" name="categoryLabel" value={categoryLabel} />
            </div>
            <div>
              <label className="text-xs text-muted">Giới tính</label>
              <select
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              >
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
          </div>

          {/* Màu sắc */}
          <div>
            <p className="mb-2 text-xs text-muted">Màu sắc</p>
            <div className="space-y-2">
              {colors.map((c, idx) => {
                const isLast = idx === colors.length - 1;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative h-7 w-7 shrink-0">
                      <div
                        className="h-7 w-7 rounded-full border border-line cursor-pointer"
                        style={{ backgroundColor: c.hex }}
                      />
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => updateColor(idx, "hex", e.target.value)}
                        className="absolute inset-0 h-full w-full rounded-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <input
                      value={c.name}
                      onChange={(e) => updateColor(idx, "name", e.target.value)}
                      placeholder={isLast ? "Thêm màu..." : "Tên màu"}
                      className="w-48 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                    />
                    {!isLast && (
                      <button
                        type="button"
                        onClick={() => removeColor(idx)}
                        className="text-muted hover:text-error"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs text-muted">Size (mỗi dòng một size)</label>
            <textarea
              value={sizesText}
              onChange={(e) => setSizesText(e.target.value)}
              rows={4}
              placeholder={"S\nM\nL\nXL"}
              className="mt-1 w-full max-w-xs border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
            />
          </div>

          {/* Bảng giá / kho theo phân loại */}
          {variantCombos.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Giá và kho hàng theo phân loại</p>

              <div className="flex flex-wrap items-end gap-2 border border-line bg-cream/40 px-3 py-3">
                {[
                  { label: "Giá bán (đ)", val: bulkPrice, set: setBulkPrice },
                  { label: "Giá gốc (đ)", val: bulkCompareAtPrice, set: setBulkCompareAtPrice },
                  { label: "Kho hàng", val: bulkStock, set: setBulkStock },
                  { label: "Giá vốn (đ)", val: bulkCostPrice, set: setBulkCostPrice },
                ].map(({ label, val, set }) => (
                  <div key={label} className="flex-1 min-w-[90px]">
                    <label className="text-xs text-muted">{label}</label>
                    <input
                      type="number" min={0} value={val}
                      onChange={(e) => set(e.target.value)}
                      className="mt-1 w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={applyBulk}
                  className="bg-[#ee4d2d] px-4 py-2 text-[12px] tracking-wide text-white hover:bg-[#d73211] whitespace-nowrap"
                >
                  Áp dụng tất cả
                </button>
              </div>

              <div className="overflow-x-auto border border-t-0 border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-cream/40 text-left text-xs uppercase tracking-label text-muted">
                      <th className="px-3 py-2.5">Màu</th>
                      {activeSizes.length > 0 && <th className="px-3 py-2.5">Size</th>}
                      <th className="px-3 py-2.5">Giá bán (đ)</th>
                      <th className="px-3 py-2.5">Giá gốc (đ)</th>
                      <th className="px-3 py-2.5">Giá vốn (đ)</th>
                      <th className="px-3 py-2.5">Kho hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantCombos.map((combo) => {
                      const v = getVariant(combo.color, combo.size);
                      return (
                        <tr key={variantKey(combo.color, combo.size)} className="border-b border-line last:border-0">
                          <td className="px-3 py-2 text-ink">{combo.color}</td>
                          {activeSizes.length > 0 && <td className="px-3 py-2 text-ink">{combo.size}</td>}
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={v.price} onChange={(e) => setVariantField(combo.color, combo.size, "price", e.target.value)} className="w-28 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={v.compareAtPrice} onChange={(e) => setVariantField(combo.color, combo.size, "compareAtPrice", e.target.value)} placeholder="—" className="w-28 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={v.costPrice} onChange={(e) => setVariantField(combo.color, combo.size, "costPrice", e.target.value)} placeholder="—" className="w-28 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} value={v.stock} onChange={(e) => setVariantField(combo.color, combo.size, "stock", e.target.value)} className="w-24 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                SKU đặt riêng cho từng sản phẩm bên dưới. Giá/kho này áp dụng chung cho tất cả.
              </p>
            </div>
          )}

          {/* Mô tả + Chi tiết */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted">Mô tả sản phẩm</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                name="description"
                rows={3}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Chi tiết chất liệu (mỗi dòng 1 mục)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                name="details"
                rows={3}
                className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Flags + Rating + Bảng size */}
          <div className="flex flex-wrap items-end gap-6">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="isNew" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
              Hàng mới về
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="isBestSeller" checked={isBestSeller} onChange={(e) => setIsBestSeller(e.target.checked)} />
              Bán chạy
            </label>
            <div>
              <label className="text-xs text-muted">Điểm đánh giá</label>
              <input
                type="number" name="rating" step="0.1" min={0} max={5}
                value={rating} onChange={(e) => setRating(e.target.value)}
                className="mt-1 block w-20 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Số lượt đánh giá</label>
              <input
                type="number" name="reviewCount" min={0}
                value={reviewCount} onChange={(e) => setReviewCount(e.target.value)}
                className="mt-1 block w-24 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted">Bảng size</label>
              <select
                name="sizeChartId"
                value={sizeChartId}
                onChange={(e) => setSizeChartId(e.target.value)}
                className="mt-1 block w-48 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
              >
                <option value="">-- Không gán --</option>
                {sizeCharts.map((sc) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DANH SÁCH SẢN PHẨM ===== */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">
            Sản phẩm{" "}
            <span className="text-sm font-sans font-normal text-muted">
              ({validItems.length} sẽ được tạo)
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setItems((its) => [...its, newItem()])}
            className="flex items-center gap-1.5 border border-dashed border-line px-4 py-2 text-sm text-muted hover:border-gold hover:text-gold-dark"
          >
            <Plus size={14} /> Thêm sản phẩm
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, itemIdx) => (
            <div key={item.id} className="border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-medium text-ink">Sản phẩm #{itemIdx + 1}</span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-muted hover:text-error"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="space-y-4 px-4 py-4">

                {/* Tên + SKU */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted">Tên sản phẩm *</label>
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      placeholder="Nhập tên sản phẩm"
                      className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted">SKU</label>
                    <input
                      value={item.sku}
                      onChange={(e) => updateItem(item.id, { sku: e.target.value })}
                      placeholder="Mã SKU"
                      className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Ảnh sản phẩm */}
                <div>
                  <p className="mb-2 text-xs text-muted">Ảnh sản phẩm — ảnh đầu tiên là ảnh bìa</p>
                  <div className="flex flex-wrap gap-2">
                    {item.images.map((url, imgIdx) => (
                      <div key={url} className="group relative h-20 w-20 shrink-0">
                        <div
                          className={`relative h-20 w-20 overflow-hidden border ${
                            imgIdx === 0 ? "border-2 border-gold" : "border-line"
                          }`}
                        >
                          <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                          {imgIdx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-gold/90 py-0.5 text-center text-[10px] uppercase text-paper">
                              Bìa
                            </span>
                          )}
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
                          {imgIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => makeImageCover(item.id, url)}
                              className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-ink hover:bg-white"
                            >
                              Đặt bìa
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeMainImage(item.id, url)}
                            className="rounded bg-error/90 px-1.5 py-0.5 text-[10px] text-white hover:bg-error"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    <label
                      className={`flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-white text-muted hover:border-gold hover:text-gold-dark ${
                        uploadingMain === item.id ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <Plus size={20} strokeWidth={1.5} />
                      <span className="text-[11px]">
                        {uploadingMain === item.id ? "Tải..." : "Thêm ảnh"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleMainImageUpload(item.id, e.target.files)}
                      />
                    </label>
                  </div>
                </div>

                {/* Ảnh biến thể theo màu */}
                {activeColors.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-muted">Ảnh biến thể theo màu</p>
                    <div className="space-y-3">
                      {activeColors.map((color) => {
                        const imgs = item.variantImages[color.name] ?? [];
                        const uploadKey = `${item.id}__${color.name}`;
                        return (
                          <div key={color.name} className="flex items-start gap-3">
                            <div className="flex w-28 shrink-0 items-center gap-1.5 pt-1">
                              <div
                                className="h-3.5 w-3.5 shrink-0 rounded-full border border-line/50"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className="truncate text-xs text-ink">{color.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {imgs.map((url) => (
                                <div key={url} className="group relative h-14 w-14 shrink-0">
                                  <div className="relative h-14 w-14 overflow-hidden border border-line">
                                    <Image src={url} alt="" fill sizes="56px" className="object-cover" />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeVariantImage(item.id, color.name, url)}
                                    className="absolute -right-1 -top-1 rounded-full bg-error p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                              <label
                                className={`flex h-14 w-14 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 border border-dashed border-line bg-white text-muted hover:border-gold hover:text-gold-dark ${
                                  uploadingVariant === uploadKey ? "pointer-events-none opacity-50" : ""
                                }`}
                              >
                                <Plus size={16} strokeWidth={1.5} />
                                <span className="text-[10px]">
                                  {uploadingVariant === uploadKey ? "Tải..." : "Thêm"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleVariantImageUpload(item.id, color.name, e.target.files)}
                                />
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setItems((its) => [...its, newItem()])}
          className="mt-4 flex w-full items-center justify-center gap-2 border border-dashed border-line py-3 text-sm text-muted hover:border-gold hover:text-gold-dark"
        >
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting || validItems.length === 0}
          className="bg-ink px-6 py-3 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          {submitting ? "Đang tạo..." : `Tạo ${validItems.length} sản phẩm`}
        </button>
        {validItems.length > 0 && (
          <p className="text-xs text-muted">
            Sẽ tạo {validItems.length} sản phẩm với thông tin chung ở trên
          </p>
        )}
      </div>
    </form>
  );
}
