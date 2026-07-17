"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, ToggleLeft, ToggleRight, X } from "lucide-react";
import type { Campaign } from "@/lib/campaigns";
import type { Product } from "@/lib/types";
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

function toDatetimeLocal(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const [endsAt, setEndsAt] = useState("");
  const [description, setDescription] = useState("");
  const [countdownHours, setCountdownHours] = useState(1);
  const [discountPercent, setDiscountPercent] = useState<number | "">(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditingId(null);
    setTitle(""); setSlug(""); setBannerMessage(""); setEndsAt("");
    setDescription(""); setCountdownHours(1); setDiscountPercent(0);
    setSelectedIds([]);
    setProductSearch(""); setError(null);
    setFormOpen(true);
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id);
    setTitle(c.title);
    setSlug(c.slug);
    setBannerMessage(c.bannerMessage ?? "");
    setEndsAt(toDatetimeLocal(c.endsAt));
    setDescription(c.description ?? "");
    setCountdownHours(c.countdownHours ?? 1);
    setDiscountPercent(c.discountPercent ?? 0);
    setSelectedIds(c.productIds);
    setProductSearch(""); setError(null);
    setFormOpen(true);
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
    fd.set("endsAt", endsAt ? new Date(endsAt).toISOString() : "");
    fd.set("description", description);
    fd.set("countdownHours", String(countdownHours));
    fd.set("discountPercent", String(discountPercent || 0));
    fd.set("productIds", JSON.stringify(selectedIds));

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
                  Kết thúc: {new Date(c.endsAt).toLocaleString("vi-VN")}
                  {" · "}
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

              {/* End date */}
              <div>
                <label className="text-xs text-muted">Thời gian kết thúc *</label>
                <input
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="mt-1 w-full border border-line bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
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
