"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ExternalLink, ToggleLeft, ToggleRight, X, Upload, ImagePlus } from "lucide-react";
import type { Campaign } from "@/lib/campaigns";
import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaign,
} from "@/lib/campaign-actions";

interface Props {
  campaigns: Campaign[];
  products: Product[];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const DOMAIN = "https://chysfashion.online";

export function CampaignsClient({ campaigns: initial, products }: Props) {
  const [campaigns, setCampaigns] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");
  const [description, setDescription] = useState("");
  const [countdownHours, setCountdownHours] = useState(1);
  const [discountPercent, setDiscountPercent] = useState<number | "">(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setTitle(""); setSlug(""); setBannerMessage("");
    setDescription(""); setCountdownHours(1); setDiscountPercent(0);
    setSelectedIds([]); setDisplayName(""); setBannerImages([]);
    setProductSearch(""); setError(null);
    setFormOpen(true);
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id);
    setTitle(c.title);
    setSlug(c.slug);
    setBannerMessage(c.bannerMessage ?? "");
    setDescription(c.description ?? "");
    setCountdownHours(c.countdownHours ?? 1);
    setDiscountPercent(c.discountPercent ?? 0);
    setSelectedIds(c.productIds);
    setDisplayName(c.displayName ?? "");
    setBannerImages(c.bannerImages ?? []);
    setProductSearch(""); setError(null);
    setFormOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-media").upload(path, file, { upsert: false });
      if (!upErr) {
        const { data } = supabase.storage.from("product-media").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setBannerImages((prev) => [...prev, ...urls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setError(null);
  }

  function toggleProduct(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("slug", slug || slugify(title));
    fd.set("bannerMessage", bannerMessage);
    fd.set("description", description);
    fd.set("countdownHours", String(countdownHours));
    fd.set("discountPercent", String(discountPercent || 0));
    fd.set("productIds", JSON.stringify(selectedIds));
    fd.set("displayName", displayName);
    fd.set("bannerImages", JSON.stringify(bannerImages));

    const result = editingId
      ? await updateCampaign(editingId, fd)
      : await createCampaign(fd);

    setSaving(false);
    if (result && "error" in result) { setError(result.error ?? "Lỗi không xác định"); return; }
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xóa chiến dịch này?")) return;
    const result = await deleteCampaign(id);
    if (result && "error" in result) { alert(result.error); return; }
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleToggle(c: Campaign) {
    const result = await toggleCampaign(c.id, !c.isActive);
    if (result && "error" in result) { alert(result.error); return; }
    setCampaigns((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x))
    );
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <>
      {/* List */}
      <div className="space-y-4">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-xs font-medium uppercase tracking-label text-paper hover:bg-ink/85"
        >
          <Plus size={14} /> Tạo chiến dịch mới
        </button>

        {campaigns.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            Chưa có chiến dịch nào. Tạo chiến dịch đầu tiên để bắt đầu.
          </p>
        )}

        {campaigns.map((c) => (
          <div key={c.id} className="border border-line bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${c.isActive ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <p className="font-medium text-ink">{c.title}</p>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {c.productIds.length} sản phẩm
                </p>
                <a
                  href={`${DOMAIN}/khuyen-mai/${c.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  {DOMAIN}/khuyen-mai/{c.slug}
                  <ExternalLink size={10} />
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggle(c)}
                  title={c.isActive ? "Tắt" : "Bật"}
                  className="p-1.5 text-muted hover:text-ink"
                >
                  {c.isActive
                    ? <ToggleRight size={20} className="text-green-500" />
                    : <ToggleLeft size={20} />}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 text-muted hover:text-ink"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 text-muted hover:text-error"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-lg bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">
                {editingId ? "Chỉnh sửa chiến dịch" : "Tạo chiến dịch mới"}
              </h2>
              <button onClick={closeForm} className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
              {/* Title */}
              <div>
                <label className="text-xs text-muted">Tên chiến dịch *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingId) setSlug(slugify(e.target.value));
                  }}
                  placeholder="VD: Sale Hè 2025, Xả hàng cuối năm..."
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs text-muted">
                  Đường link{" "}
                  <span className="text-muted/60">
                    (chysfashion.online/khuyen-mai/
                    <span className="text-ink">{slug || "duong-link"}</span>)
                  </span>
                </label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="sale-he-2025"
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {/* Banner message */}
              <div>
                <label className="text-xs text-muted">Thông điệp banner (tuỳ chọn)</label>
                <input
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="VD: SALE OFF 48% — Freeship khi mua 2 sản phẩm"
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {/* Display name */}
              <div>
                <label className="text-xs text-muted">
                  Tên hiển thị trên landing page{" "}
                  <span className="text-muted/60">(để trống sẽ dùng tên sản phẩm đầu tiên)</span>
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="VD: Bộ Quần Áo Nam Cao Cấp"
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {/* Banner images */}
              <div>
                <label className="text-xs text-muted">
                  Ảnh slide riêng{" "}
                  <span className="text-muted/60">(để trống sẽ dùng ảnh sản phẩm)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex items-center gap-2 border border-dashed border-line px-3 py-2 text-xs text-muted hover:border-gold hover:text-ink disabled:opacity-50"
                >
                  <ImagePlus size={14} />
                  {uploading ? "Đang tải lên..." : "Thêm ảnh slide"}
                </button>
                {bannerImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {bannerImages.map((url, i) => (
                      <div
                        key={url}
                        draggable
                        onDragStart={() => { dragIdx.current = i; }}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = dragIdx.current;
                          if (from === null || from === i) return;
                          setBannerImages((prev) => {
                            const next = [...prev];
                            const [moved] = next.splice(from, 1);
                            next.splice(i, 0, moved);
                            return next;
                          });
                          dragIdx.current = null;
                          setDragOverIdx(null);
                        }}
                        onDragEnd={() => { dragIdx.current = null; setDragOverIdx(null); }}
                        className={`group relative aspect-square cursor-grab overflow-hidden border-2 bg-gray-50 transition-all active:cursor-grabbing ${
                          dragOverIdx === i ? "border-gold opacity-70 scale-95" : "border-line"
                        }`}
                      >
                        <Image src={url} alt={`slide ${i + 1}`} fill unoptimized className="object-cover" sizes="80px" />
                        <button
                          type="button"
                          onClick={() => setBannerImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute right-0.5 top-0.5 hidden h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white group-hover:flex"
                        >
                          <X size={10} />
                        </button>
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 text-[9px] text-white">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Countdown hours */}
              <div>
                <label className="text-xs text-muted">Countdown (chạy vòng lặp)</label>
                <select
                  value={countdownHours}
                  onChange={(e) => setCountdownHours(Number(e.target.value))}
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                >
                  <option value={1}>1 giờ</option>
                  <option value={6}>6 giờ</option>
                  <option value={12}>12 giờ</option>
                  <option value={24}>24 giờ</option>
                </select>
              </div>

              {/* Discount percent */}
              <div>
                <label className="text-xs text-muted">% giảm giá (hiển thị badge SALE OFF)</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="VD: 48 → SALE OFF 48%"
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-muted">
                  Mô tả sản phẩm{" "}
                  <span className="text-muted/60">(mỗi dòng = 1 bullet point)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={"Size: S M L XL 2XL\nChất liệu: Cotton cao cấp\nThiết kế trẻ trung, năng động"}
                  className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {/* Product selection */}
              <div>
                <label className="text-xs text-muted">
                  Sản phẩm ({selectedIds.length} đã chọn)
                </label>
                <input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
                <div className="mt-2 max-h-52 overflow-y-auto border border-line bg-white">
                  {filteredProducts.map((p) => {
                    const checked = selectedIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-cream/50 ${checked ? "bg-cream/30" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                          className="h-4 w-4 accent-gold"
                        />
                        <span className="flex-1 text-sm text-ink">{p.name}</span>
                        <span className="text-xs text-muted">
                          {p.price.toLocaleString("vi-VN")}đ
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-sm text-error">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-ink py-3 text-xs font-medium uppercase tracking-label text-paper hover:bg-ink/85 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo chiến dịch"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-3 text-xs text-muted border border-line hover:text-ink"
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
