"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from "lucide-react";
import type { Promotion, PromotionType, AppliesTo } from "@/lib/promotions";
import type { Category } from "@/lib/categories";
import type { SimpleProduct } from "@/app/admin/(dashboard)/promotions/page";
import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotion,
  type CreatePromotionInput,
} from "@/lib/promotions-actions";
import { formatVnd } from "@/lib/utils";

const EMPTY: CreatePromotionInput = {
  code: "",
  name: "",
  type: "percentage",
  value: 10,
  minOrderValue: 0,
  appliesTo: "all",
  categoryValue: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

const TYPE_LABELS: Record<PromotionType, string> = {
  percentage: "Giảm %",
  fixed: "Giảm tiền",
  free_shipping: "Miễn ship",
};

const TYPE_COLORS: Record<PromotionType, string> = {
  percentage: "bg-blue-100 text-blue-700",
  fixed: "bg-purple-100 text-purple-700",
  free_shipping: "bg-green-100 text-green-700",
};

const GENDER_LABELS: Record<string, string> = { nam: "Nam", nu: "Nữ", unisex: "Unisex" };

export function PromotionsClient({
  promotions,
  categories,
  products,
}: {
  promotions: Promotion[];
  categories: Category[];
  products: SimpleProduct[];
}) {
  const [list, setList] = useState(promotions);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<CreatePromotionInput>(EMPTY);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setSelectedCats([]);
    setSelectedProducts([]);
    setProductSearch("");
    setError(null);
    setShowForm(true);
  }

  function openEdit(p: Promotion) {
    setEditing(p);
    const slugs = p.categoryValue
      ? p.categoryValue.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (p.appliesTo === "category") {
      setSelectedCats(slugs);
      setSelectedProducts([]);
    } else if (p.appliesTo === "product") {
      setSelectedProducts(slugs);
      setSelectedCats([]);
    } else {
      setSelectedCats([]);
      setSelectedProducts([]);
    }
    setProductSearch("");
    setForm({
      code: p.code,
      name: p.name,
      type: p.type,
      value: p.value,
      minOrderValue: p.minOrderValue,
      appliesTo: p.appliesTo,
      categoryValue: p.categoryValue ?? "",
      usageLimit: p.usageLimit !== null ? String(p.usageLimit) : "",
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : "",
      isActive: p.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  function toggleCat(slug: string) {
    setSelectedCats((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  function toggleProduct(slug: string) {
    setSelectedProducts((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  function switchAppliesTo(val: AppliesTo) {
    set("appliesTo", val);
    if (val !== "category") setSelectedCats([]);
    if (val !== "product") setSelectedProducts([]);
    setProductSearch("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.appliesTo === "category" && selectedCats.length === 0) {
      setError("Vui lòng chọn ít nhất một danh mục."); return;
    }
    if (form.appliesTo === "product" && selectedProducts.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm."); return;
    }
    const payload: CreatePromotionInput = {
      ...form,
      categoryValue:
        form.appliesTo === "category"
          ? selectedCats.join(",")
          : form.appliesTo === "product"
          ? selectedProducts.join(",")
          : "",
    };
    startTransition(async () => {
      const result = editing
        ? await updatePromotion(editing.id, payload)
        : await createPromotion(payload);
      if ("error" in result) { setError(result.error ?? null); return; }
      setShowForm(false);
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Xóa mã khuyến mại này?")) return;
    startTransition(async () => {
      await deletePromotion(id);
      setList((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function handleToggle(p: Promotion) {
    startTransition(async () => {
      await togglePromotion(p.id, !p.isActive);
      setList((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
    });
  }

  function set<K extends keyof CreatePromotionInput>(k: K, v: CreatePromotionInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const INPUT = "w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none";
  const LABEL = "text-xs font-medium text-muted block mb-1";

  const catGroups = [
    { key: "nam", cats: categories.filter((c) => c.gender === "nam") },
    { key: "nu", cats: categories.filter((c) => c.gender === "nu") },
    { key: "unisex", cats: categories.filter((c) => c.gender === "unisex") },
  ].filter((g) => g.cats.length > 0);

  const filteredProducts = productSearch.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.categoryLabel.toLowerCase().includes(productSearch.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-ink px-4 py-2 text-sm text-paper hover:bg-ink/85">
          <Plus size={15} /> Tạo mã khuyến mại
        </button>
      </div>

      {/* ── Modal form ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-semibold text-ink">
                {editing ? "Sửa mã khuyến mại" : "Tạo mã khuyến mại mới"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-xl leading-none text-muted hover:text-ink">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {/* Code + Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Mã code *</label>
                  <input required value={form.code} onChange={(e) => set("code", e.target.value)}
                    placeholder="VD: SUMMER20" className={INPUT} />
                  <p className="mt-1 text-[11px] text-muted">Tự động viết hoa khi lưu</p>
                </div>
                <div>
                  <label className={LABEL}>Tên chương trình *</label>
                  <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="VD: Giảm 20% mùa hè" className={INPUT} />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className={LABEL}>Loại khuyến mại *</label>
                <div className="flex gap-2">
                  {(["percentage", "fixed", "free_shipping"] as PromotionType[]).map((t) => (
                    <button key={t} type="button" onClick={() => set("type", t)}
                      className={`flex-1 py-2 text-sm border transition-colors ${
                        form.type === t ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                      }`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              {form.type !== "free_shipping" && (
                <div>
                  <label className={LABEL}>
                    {form.type === "percentage" ? "Phần trăm giảm (%) *" : "Số tiền giảm (đ) *"}
                  </label>
                  <input required type="number" min={1} value={form.value}
                    onChange={(e) => set("value", Number(e.target.value))}
                    placeholder={form.type === "percentage" ? "VD: 20" : "VD: 50000"}
                    className={INPUT} />
                </div>
              )}

              {/* Min order */}
              <div>
                <label className={LABEL}>Giá trị đơn hàng tối thiểu (đ)</label>
                <input type="number" min={0} value={form.minOrderValue}
                  onChange={(e) => set("minOrderValue", Number(e.target.value))}
                  placeholder="0 = không giới hạn" className={INPUT} />
              </div>

              {/* Applies to — 3 options */}
              <div>
                <label className={LABEL}>Áp dụng cho</label>
                <div className="flex gap-2">
                  {([
                    { val: "all" as AppliesTo, label: "Tất cả" },
                    { val: "category" as AppliesTo, label: "Danh mục" },
                    { val: "product" as AppliesTo, label: "Sản phẩm" },
                  ]).map(({ val, label }) => (
                    <button key={val} type="button" onClick={() => switchAppliesTo(val)}
                      className={`flex-1 py-2 text-sm border transition-colors ${
                        form.appliesTo === val ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Category checkboxes */}
                {form.appliesTo === "category" && (
                  <div className="mt-3 rounded border border-line p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted">Chọn danh mục áp dụng:</p>
                      <div className="flex gap-3 text-xs">
                        <button type="button" onClick={() => setSelectedCats(categories.map((c) => c.value))}
                          className="text-gold-dark hover:underline">Chọn tất cả</button>
                        <button type="button" onClick={() => setSelectedCats([])}
                          className="text-muted hover:underline">Bỏ chọn</button>
                      </div>
                    </div>
                    {catGroups.map((group) => (
                      <div key={group.key}>
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-label text-stone">
                          {GENDER_LABELS[group.key]}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {group.cats.map((cat) => {
                            const checked = selectedCats.includes(cat.value);
                            return (
                              <label key={cat.value}
                                className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                                  checked ? "border-ink bg-ink/5 font-medium text-ink" : "border-line text-muted hover:border-ink/40"
                                }`}>
                                <input type="checkbox" checked={checked} onChange={() => toggleCat(cat.value)} className="h-3.5 w-3.5 shrink-0" />
                                {cat.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {selectedCats.length > 0 && (
                      <p className="text-[11px] text-muted">Đã chọn: <span className="font-medium text-ink">{selectedCats.length} danh mục</span></p>
                    )}
                  </div>
                )}

                {/* Product picker */}
                {form.appliesTo === "product" && (
                  <div className="mt-3 rounded border border-line p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted">Chọn sản phẩm áp dụng:</p>
                      <div className="flex gap-3 text-xs">
                        <button type="button"
                          onClick={() => setSelectedProducts(filteredProducts.map((p) => p.slug))}
                          className="text-gold-dark hover:underline">Chọn tất cả</button>
                        <button type="button" onClick={() => setSelectedProducts([])}
                          className="text-muted hover:underline">Bỏ chọn</button>
                      </div>
                    </div>

                    {/* Search input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Tìm sản phẩm theo tên..."
                        className="w-full border border-line bg-white py-2 pl-8 pr-3 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>

                    {/* Product list */}
                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                      {filteredProducts.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted">Không tìm thấy sản phẩm</p>
                      ) : (
                        filteredProducts.map((prod) => {
                          const checked = selectedProducts.includes(prod.slug);
                          return (
                            <label key={prod.slug}
                              className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2 transition-colors ${
                                checked ? "border-ink bg-ink/5" : "border-line hover:border-ink/30"
                              }`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleProduct(prod.slug)} className="h-3.5 w-3.5 shrink-0" />
                              {prod.image ? (
                                <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded bg-cream">
                                  <Image src={prod.image} alt={prod.name} fill unoptimized sizes="28px" className="object-cover" />
                                </div>
                              ) : (
                                <div className="h-9 w-7 shrink-0 rounded bg-cream" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className={`truncate text-sm leading-snug ${checked ? "font-medium text-ink" : "text-ink"}`}>
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-muted">{prod.categoryLabel}</p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>

                    {selectedProducts.length > 0 && (
                      <p className="text-[11px] text-muted">
                        Đã chọn: <span className="font-medium text-ink">{selectedProducts.length} sản phẩm</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Usage limit + expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Giới hạn sử dụng</label>
                  <input type="number" min={1} value={form.usageLimit}
                    onChange={(e) => set("usageLimit", e.target.value)}
                    placeholder="Để trống = không giới hạn" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Hết hạn ngày</label>
                  <input type="date" value={form.expiresAt}
                    onChange={(e) => set("expiresAt", e.target.value)} className={INPUT} />
                </div>
              </div>

              {/* Active */}
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4" />
                <span className="text-sm text-ink">Kích hoạt ngay</span>
              </label>

              {error && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isPending}
                  className="flex-1 bg-ink py-2.5 text-sm text-paper hover:bg-ink/85 disabled:opacity-50">
                  {isPending ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Tạo mã"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="border border-line px-4 py-2.5 text-sm text-ink hover:bg-cream">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {list.length === 0 ? (
        <div className="rounded border border-dashed border-line py-16 text-center text-sm text-muted">
          Chưa có mã khuyến mại nào. Nhấn "Tạo mã khuyến mại" để bắt đầu.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface">
              <tr>
                {["Mã code","Tên","Loại","Giá trị","Đơn tối thiểu","Áp dụng","Đã dùng","Hết hạn","Bật/Tắt",""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-label text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((p) => {
                const slugs = p.categoryValue
                  ? p.categoryValue.split(",").map((s) => s.trim()).filter(Boolean)
                  : [];
                const appliedLabel =
                  p.appliesTo === "all" ? "Tất cả" :
                  p.appliesTo === "category"
                    ? slugs.map((s) => categories.find((c) => c.value === s)?.label ?? s).join(", ")
                    : `${slugs.length} sản phẩm`;

                return (
                  <tr key={p.id} className="hover:bg-surface/50">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">{p.code}</td>
                    <td className="px-4 py-3 text-ink">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${TYPE_COLORS[p.type]}`}>
                        {TYPE_LABELS[p.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {p.type === "percentage" && `${p.value}%`}
                      {p.type === "fixed" && formatVnd(p.value)}
                      {p.type === "free_shipping" && "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.minOrderValue > 0 ? formatVnd(p.minOrderValue) : "—"}</td>
                    <td className="px-4 py-3 max-w-[160px] text-xs text-ink truncate" title={appliedLabel}>
                      {appliedLabel}
                    </td>
                    <td className="px-4 py-3 text-muted">{p.usedCount}{p.usageLimit !== null ? `/${p.usageLimit}` : ""}</td>
                    <td className="px-4 py-3 text-muted">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString("vi-VN") : "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(p)} disabled={isPending}>
                        {p.isActive
                          ? <ToggleRight size={22} className="text-green-500" />
                          : <ToggleLeft size={22} className="text-muted" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-muted hover:text-ink"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(p.id)} disabled={isPending} className="text-muted hover:text-error"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
