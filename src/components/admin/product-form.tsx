"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { X, Plus, Trash2 } from "lucide-react";
import { Product } from "@/lib/types";
import { Category } from "@/lib/categories";
import { createClient } from "@/lib/supabase/client";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

interface ClassOption {
  name: string;
  desc: string;
}

interface Classification {
  name: string;
  options: ClassOption[];
}

interface VariantValue {
  price: string;
  stock: string;
  sku: string;
}

function variantKey(col: string, row: string) {
  return `${col}__${row}`;
}

function emptyOption(): ClassOption {
  return { name: "", desc: "" };
}

export function ProductForm({ product, categories, action }: ProductFormProps) {
  // ===== Ảnh sản phẩm =====
  const [keptImages, setKeptImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);

  // ===== Video sản phẩm =====
  const [videoUrl, setVideoUrl] = useState<string>(product?.videoUrl ?? "");
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // ===== Ảnh biến thể (per color) =====
  const [variantImages, setVariantImages] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const c of product?.colors ?? []) {
      if (c.images && c.images.length > 0) map[c.name] = c.images;
    }
    return map;
  });
  const [uploadingVariant, setUploadingVariant] = useState<string | null>(null);

  // ===== Form state =====
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ===== Phân loại hàng =====
  const [classifications, setClassifications] = useState<Classification[]>(() => {
    const existingColors = product?.colors ?? [];
    const existingSizes = product?.sizes ?? [];
    if (existingColors.length > 0) {
      const cls1: Classification = {
        name: "MÀU SẮC",
        options: [...existingColors.map((c) => ({ name: c.name, desc: "" })), emptyOption()],
      };
      if (existingSizes.length > 0) {
        return [
          cls1,
          {
            name: "SIZE",
            options: [...existingSizes.map((s) => ({ name: s, desc: "" })), emptyOption()],
          },
        ];
      }
      return [cls1];
    }
    return [{ name: "", options: [emptyOption(), emptyOption()] }];
  });

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

  const cls0Options = (classifications[0]?.options ?? []).filter((o) => o.name.trim());
  const cls1Options = (classifications[1]?.options ?? []).filter((o) => o.name.trim());

  const variantCombos =
    cls0Options.length > 0
      ? cls1Options.length > 0
        ? cls0Options.flatMap((a) => cls1Options.map((b) => ({ color: a.name, size: b.name })))
        : cls0Options.map((a) => ({ color: a.name, size: "" }))
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

  // Classification helpers
  function updateClsName(idx: number, name: string) {
    setClassifications((cls) => cls.map((c, i) => (i === idx ? { ...c, name } : c)));
  }

  function updateOption(clsIdx: number, optIdx: number, field: keyof ClassOption, value: string) {
    setClassifications((cls) =>
      cls.map((c, i) => {
        if (i !== clsIdx) return c;
        const newOpts = c.options.map((o, j) =>
          j === optIdx ? { ...o, [field]: value } : o
        );
        if (field === "name" && value.trim() && optIdx === c.options.length - 1) {
          newOpts.push(emptyOption());
        }
        return { ...c, options: newOpts };
      })
    );
  }

  function removeOption(clsIdx: number, optIdx: number) {
    setClassifications((cls) =>
      cls.map((c, i) => {
        if (i !== clsIdx) return c;
        const newOpts = c.options.filter((_, j) => j !== optIdx);
        if (newOpts.length === 0 || newOpts[newOpts.length - 1].name.trim() !== "") {
          newOpts.push(emptyOption());
        }
        return { ...c, options: newOpts };
      })
    );
  }

  function addClassification() {
    if (classifications.length >= 2) return;
    setClassifications((cls) => [...cls, { name: "", options: [emptyOption(), emptyOption()] }]);
  }

  function removeClassification(idx: number) {
    setClassifications((cls) => cls.filter((_, i) => i !== idx));
  }

  const colorsValue = cls0Options.map((o) => `${o.name},#000000`).join("\n");
  const sizesValue = cls1Options.map((o) => o.name).join("\n");
  const variantImagesJson = JSON.stringify(variantImages);

  // Upload handlers
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

  async function handleVariantImageUpload(colorName: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingVariant(colorName);
    setError(null);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `variants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-media")
        .upload(path, file);
      if (uploadError) {
        setError(`Không thể tải ảnh: ${uploadError.message}`);
        continue;
      }
      const { data } = supabase.storage.from("product-media").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    if (urls.length > 0) {
      setVariantImages((prev) => ({
        ...prev,
        [colorName]: [...(prev[colorName] ?? []), ...urls],
      }));
    }
    setUploadingVariant(null);
  }

  function removeVariantImage(colorName: string, url: string) {
    setVariantImages((prev) => ({
      ...prev,
      [colorName]: (prev[colorName] ?? []).filter((u) => u !== url),
    }));
  }

  function makeCover(url: string) {
    setKeptImages((imgs) => [url, ...imgs.filter((u) => u !== url)]);
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

      {/* ===== ẢNH SẢN PHẨM ===== */}
      <div>
        <p className="text-xs font-medium uppercase tracking-label text-muted">
          Ảnh sản phẩm — ảnh đầu tiên là ảnh bìa
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {keptImages.map((url, index) => (
            <div key={url} className="group relative h-24 w-24 shrink-0">
              <div
                className={`relative h-24 w-24 overflow-hidden border ${
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
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(url)}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-ink hover:bg-white"
                  >
                    Đặt bìa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setKeptImages((imgs) => imgs.filter((u) => u !== url))}
                  className="rounded bg-error/90 px-1.5 py-0.5 text-[10px] text-white hover:bg-error"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
          <label
            className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-white text-muted transition-colors hover:border-gold hover:text-gold-dark ${
              uploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <Plus size={24} strokeWidth={1.5} />
            <span className="text-[11px]">{uploading ? "Đang tải..." : "Thêm ảnh"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ===== VIDEO SẢN PHẨM ===== */}
      <div>
        <p className="text-xs font-medium uppercase tracking-label text-muted">
          Video sản phẩm (tuỳ chọn) — MP4, tối đa 30MB
        </p>
        <input type="hidden" name="videoUrl" value={videoUrl} />
        <div className="mt-2 flex flex-wrap gap-3">
          {videoUrl ? (
            <div className="group relative h-24 w-24 shrink-0">
              <video src={videoUrl} className="h-24 w-24 border border-line object-cover bg-ink/5" />
              <div className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  className="rounded bg-error/90 px-1.5 py-0.5 text-[10px] text-white hover:bg-error"
                >
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <label
              className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line bg-white text-muted transition-colors hover:border-gold hover:text-gold-dark ${
                uploadingVideo ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <Plus size={24} strokeWidth={1.5} />
              <span className="text-[11px]">{uploadingVideo ? "Đang tải..." : "Thêm video"}</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                disabled={uploadingVideo}
                onChange={handleVideoChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* ===== CÁC TRƯỜNG THÔNG TIN ===== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="name">Tên sản phẩm *</label>
          <input
            id="name" name="name" required defaultValue={product?.name}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="slug">
            Đường dẫn (slug) — để trống sẽ tự tạo từ tên
          </label>
          <input
            id="slug" name="slug" defaultValue={product?.slug}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="gender">Giới tính *</label>
          <select
            id="gender" name="gender" defaultValue={product?.gender ?? "unisex"}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          >
            <option value="nam">Nam</option>
            <option value="nu">Nữ</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="category">Danh mục *</label>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-error">
              Chưa có danh mục nào — vào mục Danh mục để thêm trước.
            </p>
          )}
          <select
            id="category" name="category" defaultValue={product?.category}
            onChange={(e) => {
              const label = categories.find((c) => c.value === e.target.value)?.label ?? "";
              const input = document.getElementById("categoryLabel") as HTMLInputElement | null;
              if (input) input.value = label;
            }}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            id="categoryLabel" name="categoryLabel" type="hidden"
            defaultValue={product?.categoryLabel ?? categories[0]?.label ?? ""}
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="price">Giá bán (đ) *</label>
          <input
            id="price" name="price" type="number" min={0} required defaultValue={product?.price}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="compareAtPrice">
            Giá gốc trước giảm (đ) — tuỳ chọn
          </label>
          <input
            id="compareAtPrice" name="compareAtPrice" type="number" min={0}
            defaultValue={product?.compareAtPrice}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="stock">Số lượng tồn kho</label>
          {variantCombos.length > 0 ? (
            <p className="mt-2.5 text-sm text-ink">
              Tổng theo bảng phân loại: <span className="font-medium">{totalVariantStock}</span>
            </p>
          ) : (
            <input
              id="stock" name="stock" type="number" min={0} required
              defaultValue={product?.stock ?? 0}
              className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
          )}
          <p className="mt-1 text-xs text-muted">
            Về 0 sẽ hiện &quot;Hết hàng&quot; trên website. Tự trừ khi khách đặt hàng.
          </p>
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="rating">Điểm đánh giá (0-5)</label>
          <input
            id="rating" name="rating" type="number" step="0.1" min={0} max={5}
            defaultValue={product?.rating ?? 5}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted" htmlFor="reviewCount">Số lượt đánh giá</label>
          <input
            id="reviewCount" name="reviewCount" type="number" min={0}
            defaultValue={product?.reviewCount ?? 0}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {/* ===== PHÂN LOẠI HÀNG ===== */}
        <div className="sm:col-span-2">
          <input type="hidden" name="colors" value={colorsValue} />
          <input type="hidden" name="sizes" value={sizesValue} />
          <input type="hidden" name="variants" value={variantsJson} />
          <input type="hidden" name="variantImages" value={variantImagesJson} />

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-error" />
            <span className="text-sm font-medium text-ink">Phân loại hàng</span>
          </div>

          <div className="mt-3 space-y-3">
            {classifications.map((cls, clsIdx) => (
              <ClassificationPanel
                key={clsIdx}
                index={clsIdx}
                classification={cls}
                onNameChange={(v) => updateClsName(clsIdx, v)}
                onOptionChange={(optIdx, field, v) => updateOption(clsIdx, optIdx, field, v)}
                onRemoveOption={(optIdx) => removeOption(clsIdx, optIdx)}
                onRemove={() => removeClassification(clsIdx)}
              />
            ))}
          </div>

          {classifications.length < 2 && (
            <button
              type="button"
              onClick={addClassification}
              className="mt-3 flex items-center gap-1.5 border border-dashed border-line px-4 py-2 text-sm text-muted hover:border-gold hover:text-gold-dark"
            >
              <Plus size={14} /> Thêm phân loại
            </button>
          )}

          {/* Ảnh biến thể — per color option */}
          {cls0Options.length > 0 && (
            <div className="mt-5 border border-line bg-white">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-medium text-ink">Ảnh biến thể</p>
                <p className="mt-0.5 text-xs text-muted">
                  Mỗi lựa chọn phân loại 1 có thể có ảnh riêng hiển thị khi khách chọn
                </p>
              </div>
              <div className="divide-y divide-line">
                {cls0Options.map((opt) => (
                  <div key={opt.name} className="flex items-start gap-4 px-4 py-3">
                    <span className="w-28 shrink-0 pt-1 text-sm font-medium text-ink">
                      {opt.name}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(variantImages[opt.name] ?? []).map((url) => (
                        <div key={url} className="group relative h-16 w-16 shrink-0">
                          <div className="relative h-16 w-16 overflow-hidden border border-line">
                            <Image src={url} alt="" fill sizes="64px" className="object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariantImage(opt.name, url)}
                            className="absolute -right-1 -top-1 rounded-full bg-error p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <label
                        className={`flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 border border-dashed border-line bg-white text-muted transition-colors hover:border-gold hover:text-gold-dark ${
                          uploadingVariant === opt.name ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        <Plus size={18} strokeWidth={1.5} />
                        <span className="text-[10px]">
                          {uploadingVariant === opt.name ? "Tải..." : "Thêm"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleVariantImageUpload(opt.name, e.target.files)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách phân loại hàng — variant table */}
          {variantCombos.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-ink">Danh sách phân loại hàng</p>

              <div className="flex flex-wrap items-end gap-2 border border-line bg-cream/40 px-3 py-3">
                <div className="flex-1 min-w-[80px]">
                  <label className="text-xs text-muted">đ Giá</label>
                  <input
                    type="number" min={0} value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Giá"
                    className="mt-1 w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[80px]">
                  <label className="text-xs text-muted">Kho hàng</label>
                  <input
                    type="number" min={0} value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    placeholder="Kho hàng"
                    className="mt-1 w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs text-muted">SKU phân loại</label>
                  <input
                    value={bulkSku} onChange={(e) => setBulkSku(e.target.value)}
                    placeholder="SKU phân loại"
                    className="mt-1 w-full border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <button
                  type="button" onClick={applyBulk}
                  className="bg-[#ee4d2d] px-4 py-2 text-[12px] tracking-wide text-white hover:bg-[#d73211] whitespace-nowrap"
                >
                  Áp dụng cho tất cả phân loại
                </button>
              </div>

              <div className="overflow-x-auto border border-t-0 border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-cream/40 text-left text-xs uppercase tracking-label text-muted">
                      {classifications[0] && (
                        <th className="px-3 py-2.5">{classifications[0].name || "Phân loại 1"}</th>
                      )}
                      {classifications[1] && (
                        <th className="px-3 py-2.5">{classifications[1].name || "Phân loại 2"}</th>
                      )}
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
                          {classifications[1] && (
                            <td className="px-3 py-2 text-ink">{combo.size}</td>
                          )}
                          <td className="px-3 py-2">
                            <input
                              type="number" min={0} value={v.price}
                              onChange={(e) => setVariantField(combo.color, combo.size, "price", e.target.value)}
                              className="w-28 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number" min={0} value={v.stock}
                              onChange={(e) => setVariantField(combo.color, combo.size, "stock", e.target.value)}
                              className="w-24 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={v.sku}
                              onChange={(e) => setVariantField(combo.color, combo.size, "sku", e.target.value)}
                              className="w-32 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Giá hiển thị trên website lấy giá thấp nhất; tổng tồn kho tự cộng từ các phân
                loại. Kho phân loại nào tự trừ khi khách đặt.
              </p>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="description">Mô tả sản phẩm</label>
          <textarea
            id="description" name="description" rows={4} defaultValue={product?.description}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted" htmlFor="details">
            Chi tiết chất liệu (mỗi dòng 1 gạch đầu dòng)
          </label>
          <textarea
            id="details" name="details" rows={4} defaultValue={detailsText}
            className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} />
          Hàng mới về
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="isBestSeller" defaultChecked={product?.isBestSeller} />
          Bán chạy
        </label>
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

// ===== Sub-component: Classification Panel =====
interface ClassificationPanelProps {
  index: number;
  classification: Classification;
  onNameChange: (v: string) => void;
  onOptionChange: (optIdx: number, field: keyof ClassOption, v: string) => void;
  onRemoveOption: (optIdx: number) => void;
  onRemove: () => void;
}

function ClassificationPanel({
  index,
  classification,
  onNameChange,
  onOptionChange,
  onRemoveOption,
  onRemove,
}: ClassificationPanelProps) {
  const rows: Array<[number, number | null]> = [];
  for (let i = 0; i < classification.options.length; i += 2) {
    rows.push([i, i + 1 < classification.options.length ? i + 1 : null]);
  }

  return (
    <div className="border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-sm font-medium text-ink">Phân loại {index + 1}</span>
        <button type="button" onClick={onRemove} className="text-muted hover:text-error">
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        <input
          value={classification.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={index === 0 ? "Tên phân loại (vd: MÀU SẮC)" : "Tên phân loại (vd: SIZE)"}
          className="w-64 border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
        />

        <div className="flex items-center gap-1">
          <span className="text-sm text-ink">Tùy chọn</span>
          <span className="h-1.5 w-1.5 rounded-full bg-error" />
        </div>

        <div className="space-y-2">
          {rows.map(([leftIdx, rightIdx]) => (
            <div key={leftIdx} className="grid grid-cols-2 gap-2">
              <OptionCell
                option={classification.options[leftIdx]}
                isLast={leftIdx === classification.options.length - 1}
                onNameChange={(v) => onOptionChange(leftIdx, "name", v)}
                onDescChange={(v) => onOptionChange(leftIdx, "desc", v)}
                onRemove={() => onRemoveOption(leftIdx)}
              />
              {rightIdx !== null ? (
                <OptionCell
                  option={classification.options[rightIdx]}
                  isLast={rightIdx === classification.options.length - 1}
                  onNameChange={(v) => onOptionChange(rightIdx, "name", v)}
                  onDescChange={(v) => onOptionChange(rightIdx, "desc", v)}
                  onRemove={() => onRemoveOption(rightIdx)}
                />
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface OptionCellProps {
  option: ClassOption;
  isLast: boolean;
  onNameChange: (v: string) => void;
  onDescChange: (v: string) => void;
  onRemove: () => void;
}

function OptionCell({ option, isLast, onNameChange, onDescChange, onRemove }: OptionCellProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        value={option.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={isLast ? "Nhập" : ""}
        className="min-w-0 flex-1 border border-line bg-white px-2 py-1.5 text-sm focus:border-gold focus:outline-none"
      />
      <input
        value={option.desc}
        onChange={(e) => onDescChange(e.target.value)}
        placeholder="Thêm mô tả"
        className="min-w-0 flex-1 border border-line bg-white px-2 py-1.5 text-sm text-muted focus:border-gold focus:outline-none"
      />
      {!isLast ? (
        <button type="button" onClick={onRemove} className="shrink-0 text-muted hover:text-error">
          <Trash2 size={14} />
        </button>
      ) : (
        <span className="w-[14px] shrink-0" />
      )}
    </div>
  );
}
