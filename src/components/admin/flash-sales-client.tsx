"use client";

import { useState } from "react";
import Image from "next/image";
import { Flame, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, X } from "lucide-react";
import type { FlashSaleWithProducts } from "@/lib/flash-sales";
import type { Product } from "@/lib/types";
import {
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  toggleFlashSale,
  setFlashSaleProducts,
} from "@/lib/flash-sale-actions";

interface Props {
  sales: FlashSaleWithProducts[];
  products: Product[];
}

const EMPTY_FORM = {
  name: "",
  discountPercent: 20,
  startTime: "",
  endTime: "",
};

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toISOString(local: string) {
  if (!local) return "";
  return new Date(local).toISOString();
}

function statusLabel(sale: FlashSaleWithProducts) {
  if (!sale.isActive) return { text: "Tắt", cls: "bg-gray-100 text-gray-600" };
  const now = Date.now();
  const start = new Date(sale.startTime).getTime();
  const end = new Date(sale.endTime).getTime();
  if (now < start) return { text: "Chưa bắt đầu", cls: "bg-blue-100 text-blue-700" };
  if (now > end) return { text: "Đã kết thúc", cls: "bg-red-100 text-red-700" };
  return { text: "Đang diễn ra", cls: "bg-green-100 text-green-700" };
}

export function FlashSalesClient({ sales: initialSales, products }: Props) {
  const [sales, setSales] = useState(initialSales);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FlashSaleWithProducts | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managingProducts, setManagingProducts] = useState<FlashSaleWithProducts | null>(null);
  const [managingProductIds, setManagingProductIds] = useState<string[]>([]);
  const [managingSearch, setManagingSearch] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSelectedProductIds([]);
    setError(null);
    setShowForm(true);
  }

  function openEdit(sale: FlashSaleWithProducts) {
    setEditing(sale);
    setForm({
      name: sale.name,
      discountPercent: sale.discountPercent,
      startTime: toLocalDatetime(sale.startTime),
      endTime: toLocalDatetime(sale.endTime),
    });
    setSelectedProductIds(sale.productIds);
    setError(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.startTime || !form.endTime) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      discountPercent: form.discountPercent,
      startTime: toISOString(form.startTime),
      endTime: toISOString(form.endTime),
    };

    let saleId: string | null = null;

    if (editing) {
      const res = await updateFlashSale(editing.id, payload);
      if ("error" in res) { setError(res.error ?? null); setSaving(false); return; }
      saleId = editing.id;
    } else {
      const res = await createFlashSale(payload);
      if ("error" in res) { setError(res.error ?? null); setSaving(false); return; }
    }

    // After create, we need the new ID — re-fetch or optimistically update
    // For simplicity, trigger a page reload via router or just close and let Next.js revalidate
    if (saleId) {
      await setFlashSaleProducts(saleId, selectedProductIds);
    }

    setSaving(false);
    setShowForm(false);
    window.location.reload();
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa flash sale này?")) return;
    await deleteFlashSale(id);
    setSales((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleToggle(sale: FlashSaleWithProducts) {
    await toggleFlashSale(sale.id, !sale.isActive);
    setSales((prev) =>
      prev.map((s) => (s.id === sale.id ? { ...s, isActive: !s.isActive } : s))
    );
  }

  function openManageProducts(sale: FlashSaleWithProducts) {
    setManagingProducts(sale);
    setManagingProductIds([...sale.productIds]);
    setManagingSearch("");
  }

  async function saveManageProducts() {
    if (!managingProducts) return;
    setSaving(true);
    await setFlashSaleProducts(managingProducts.id, managingProductIds);
    setSaving(false);
    setManagingProducts(null);
    window.location.reload();
  }

  const filteredForForm = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryLabel.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredForManage = products.filter((p) =>
    p.name.toLowerCase().includes(managingSearch.toLowerCase()) ||
    p.categoryLabel.toLowerCase().includes(managingSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink/85"
        >
          <Plus size={16} /> Tạo Flash Sale
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">
                {editing ? "Chỉnh sửa Flash Sale" : "Tạo Flash Sale mới"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              {error && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Tên chương trình *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Flash Sale Cuối Tuần"
                  className="w-full border border-line px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Mức giảm giá (%) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discountPercent: Math.min(100, Math.max(1, Number(e.target.value))) }))
                  }
                  className="w-32 border border-line px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                />
                <span className="ml-2 text-sm text-muted">%</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full border border-line px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full border border-line px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Product picker */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Sản phẩm áp dụng ({selectedProductIds.length} đã chọn)
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full border border-line py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto rounded border border-line divide-y divide-line">
                  {filteredForForm.map((p) => {
                    const checked = selectedProductIds.includes(p.id);
                    const cover = p.images[0];
                    return (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-cream"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedProductIds((prev) =>
                              checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }
                          className="h-4 w-4 accent-ink"
                        />
                        <div className="relative h-10 w-8 shrink-0 overflow-hidden bg-cream">
                          {cover ? (
                            <Image src={cover} alt={p.name} fill unoptimized sizes="32px" className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-line" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink">{p.name}</p>
                          <p className="text-[11px] text-muted">{p.categoryLabel}</p>
                        </div>
                      </label>
                    );
                  })}
                  {filteredForForm.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-muted">Không tìm thấy sản phẩm.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="border border-line px-5 py-2.5 text-sm text-ink hover:bg-cream"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-ink px-5 py-2.5 text-sm text-paper hover:bg-ink/85 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage products modal */}
      {managingProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold text-ink">
                Sản phẩm — {managingProducts.name}
              </h2>
              <button onClick={() => setManagingProducts(null)} className="text-muted hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <p className="text-sm text-muted">{managingProductIds.length} sản phẩm đang được chọn</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={managingSearch}
                  onChange={(e) => setManagingSearch(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full border border-line py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>
              <div className="max-h-72 overflow-y-auto rounded border border-line divide-y divide-line">
                {filteredForManage.map((p) => {
                  const checked = managingProductIds.includes(p.id);
                  const cover = p.images[0];
                  return (
                    <label key={p.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-cream">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setManagingProductIds((prev) =>
                            checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          )
                        }
                        className="h-4 w-4 accent-ink"
                      />
                      <div className="relative h-10 w-8 shrink-0 overflow-hidden bg-cream">
                        {cover ? (
                          <Image src={cover} alt={p.name} fill sizes="32px" className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-line" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{p.name}</p>
                        <p className="text-[11px] text-muted">{p.categoryLabel}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setManagingProducts(null)}
                  className="border border-line px-5 py-2.5 text-sm text-ink hover:bg-cream"
                >
                  Hủy
                </button>
                <button
                  onClick={saveManageProducts}
                  disabled={saving}
                  className="bg-ink px-5 py-2.5 text-sm text-paper hover:bg-ink/85 disabled:opacity-50"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales list */}
      {sales.length === 0 ? (
        <div className="rounded border border-line bg-surface py-16 text-center">
          <Flame size={32} className="mx-auto mb-3 text-muted" />
          <p className="text-sm text-muted">Chưa có flash sale nào. Tạo ngay!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => {
            const st = statusLabel(sale);
            const saleProductNames = products
              .filter((p) => sale.productIds.includes(p.id))
              .map((p) => p.name)
              .slice(0, 3);
            return (
              <div key={sale.id} className="rounded border border-line bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <Flame size={18} className="text-red-600" fill="#dc2626" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-ink">{sale.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${st.cls}`}>
                          {st.text}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-red-600 font-medium">
                        Giảm {sale.discountPercent}%
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(sale.startTime).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {" — "}
                        {new Date(sale.endTime).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {sale.productIds.length} sản phẩm
                        {saleProductNames.length > 0 && (
                          <span className="ml-1 text-ink">
                            ({saleProductNames.join(", ")}{sale.productIds.length > 3 ? "..." : ""})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openManageProducts(sale)}
                      className="rounded border border-line px-3 py-1.5 text-xs text-ink hover:bg-cream"
                    >
                      Sản phẩm
                    </button>
                    <button
                      onClick={() => handleToggle(sale)}
                      className="text-muted hover:text-ink"
                      title={sale.isActive ? "Tắt" : "Bật"}
                    >
                      {sale.isActive ? (
                        <ToggleRight size={22} className="text-green-600" />
                      ) : (
                        <ToggleLeft size={22} />
                      )}
                    </button>
                    <button onClick={() => openEdit(sale)} className="text-muted hover:text-ink">
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="text-muted hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
