"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, AlertTriangle, BarChart2, List, Trash2, X, CheckSquare } from "lucide-react";
import { Order, OrderItem, OrderStatus } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { AvatarInitials } from "./avatar-initials";
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from "./order-status-badge";
import { bulkUpdateOrderStatus, bulkDeleteOrders } from "@/lib/orders";

/* ── SKU aggregation ── */
interface SkuRow {
  key: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  totalQty: number;
  orderCount: number;
}

function aggregateSkus(
  orders: Order[],
  statusFilter: Set<OrderStatus>,
  skuLookup: Record<string, string>,
): SkuRow[] {
  const map = new Map<string, { name: string; sku: string; color: string; size: string; totalQty: number; orderIds: Set<string> }>();
  for (const order of orders) {
    if (statusFilter.size > 0 && !statusFilter.has(order.status)) continue;
    for (const item of order.items) {
      const lookupKey = `${item.slug}||${item.color}||${item.size}`;
      const sku = skuLookup[lookupKey] || item.color;
      const key = `${item.slug}||${sku}||${item.size}`;
      const row = map.get(key);
      if (row) {
        row.totalQty += item.quantity;
        row.orderIds.add(order.id);
      } else {
        map.set(key, { name: item.name, sku, color: item.color, size: item.size, totalQty: item.quantity, orderIds: new Set([order.id]) });
      }
    }
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, name: v.name, sku: v.sku, color: v.color, size: v.size, totalQty: v.totalQty, orderCount: v.orderIds.size }))
    .sort((a, b) => a.sku.localeCompare(b.sku) || a.size.localeCompare(b.size) || b.totalQty - a.totalQty);
}

/* ── SKU stats panel ── */
function SkuStatsPanel({ orders, skuLookup }: { orders: Order[]; skuLookup: Record<string, string> }) {
  const [statusFilter, setStatusFilter] = useState<Set<OrderStatus>>(new Set(["moi", "dang_xu_ly"]));

  function toggleStatus(s: OrderStatus) {
    setStatusFilter(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  const rows = useMemo(() => aggregateSkus(orders, statusFilter, skuLookup), [orders, statusFilter, skuLookup]);
  const totalQty = rows.reduce((s, r) => s + r.totalQty, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted">Lọc theo trạng thái đơn:</span>
        {ORDER_STATUS_OPTIONS.map(opt => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input type="checkbox" checked={statusFilter.has(opt.value)} onChange={() => toggleStatus(opt.value)} className="accent-gold" />
            {opt.label}
          </label>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Không có sản phẩm nào với bộ lọc này.</p>
      ) : (
        <>
          <div className="mb-3">
            <p className="text-xs text-muted">
              {rows.length} dòng · tổng <span className="font-semibold text-ink">{totalQty}</span> sản phẩm cần chuẩn bị
            </p>
          </div>
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">SKU phân loại</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3 text-right">Số lượng</th>
                  <th className="px-4 py-3 text-right">Số đơn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key} className="border-b border-line last:border-0 hover:bg-cream/40">
                    <td className="px-4 py-3 text-ink">{row.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-ink">{row.sku}</span>
                      {row.sku !== row.color && <span className="ml-2 text-xs text-muted">({row.color})</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{row.size}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded bg-gold/10 px-2.5 py-0.5 font-mono text-sm font-bold text-gold-dark">×{row.totalQty}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{row.orderCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-line bg-cream/40">
                  <td colSpan={3} className="px-4 py-3 text-xs font-medium text-muted">Tổng cộng</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{totalQty}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Bulk action bar ── */
const STATUS_QUICK: { value: OrderStatus; label: string; cls: string }[] = [
  { value: "moi",        label: "Mới",       cls: "bg-blue-100 text-blue-700 hover:bg-blue-200"      },
  { value: "dang_xu_ly", label: "Xử lý",    cls: "bg-amber-100 text-amber-700 hover:bg-amber-200"   },
  { value: "da_giao",    label: "Đã giao",  cls: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
  { value: "da_huy",     label: "Huỷ",      cls: "bg-red-100 text-red-700 hover:bg-red-200"         },
];

function BulkActionBar({
  count,
  onStatusChange,
  onDelete,
  onClear,
  pending,
}: {
  count: number;
  onStatusChange: (s: OrderStatus) => void;
  onDelete: () => void;
  onClear: () => void;
  pending: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-gold/40 bg-gold/5 px-4 py-2.5">
      {/* Count + clear */}
      <div className="flex items-center gap-2 mr-1">
        <CheckSquare size={14} className="text-gold-dark" />
        <span className="text-sm font-medium text-ink">{count} đơn được chọn</span>
        <button onClick={onClear} className="ml-1 text-muted hover:text-ink" title="Bỏ chọn tất cả">
          <X size={14} />
        </button>
      </div>

      <div className="h-4 w-px bg-line" />

      {/* Status quick-set */}
      <span className="text-xs text-muted">Đổi thành:</span>
      {STATUS_QUICK.map((s) => (
        <button
          key={s.value}
          onClick={() => onStatusChange(s.value)}
          disabled={pending}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${s.cls}`}
        >
          {s.label}
        </button>
      ))}

      <div className="h-4 w-px bg-line" />

      {/* Delete */}
      {confirmDelete ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-red-600 font-medium">Xóa {count} đơn?</span>
          <button
            onClick={() => { setConfirmDelete(false); onDelete(); }}
            disabled={pending}
            className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Có
          </button>
          <button onClick={() => setConfirmDelete(false)} className="text-muted hover:text-ink">
            Không
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
          className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Xóa
        </button>
      )}

      {pending && <span className="ml-auto text-xs text-muted">Đang xử lý...</span>}
    </div>
  );
}

/* ── Main table ── */
export function OrdersTable({ orders, skuLookup = {} }: { orders: Order[]; skuLookup?: Record<string, string> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [view, setView] = useState<"orders" | "sku">("orders");
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkError, setBulkError] = useState("");

  const tabs = [
    { value: "all" as const, label: "Tất cả", count: orders.length },
    ...ORDER_STATUS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: orders.filter((o) => o.status === opt.value).length,
    })),
  ];

  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const a = orders[i]; const b = orders[j];
        if (a.phone !== b.phone) continue;
        const diff = Math.abs(new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (diff <= 10 * 60 * 1000) { ids.add(a.id); ids.add(b.id); }
      }
    }
    return ids;
  }, [orders]);

  const filtered = useMemo(() => {
    let rows = tab === "all" ? orders : orders.filter((o) => o.status === tab);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((o) =>
      o.orderCode.toLowerCase().includes(q) ||
      o.fullName.toLowerCase().includes(q) ||
      o.phone.includes(q)
    );
    return rows;
  }, [orders, tab, search]);

  // Clear selection when filter changes
  function handleTabChange(v: OrderStatus | "all") { setTab(v); setSelectedIds(new Set()); setBulkError(""); }
  function handleSearchChange(v: string) { setSearch(v); setSelectedIds(new Set()); setBulkError(""); }

  // Checkbox helpers
  const filteredIds = filtered.map((o) => o.id);
  const allChecked = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someChecked = filteredIds.some((id) => selectedIds.has(id));

  function toggleAll() {
    if (allChecked) {
      setSelectedIds((prev) => { const next = new Set(prev); filteredIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); filteredIds.forEach((id) => next.add(id)); return next; });
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Bulk actions
  function handleBulkStatus(status: OrderStatus) {
    setBulkError("");
    startTransition(async () => {
      const result = await bulkUpdateOrderStatus([...selectedIds], status);
      if (result?.error) { setBulkError(result.error); return; }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function handleBulkDelete() {
    setBulkError("");
    startTransition(async () => {
      const result = await bulkDeleteOrders([...selectedIds]);
      if (result?.error) { setBulkError(result.error); return; }
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {/* View toggle */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setView("orders")}
          className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition-colors ${
            view === "orders" ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink/40 hover:text-ink"
          }`}
        >
          <List size={13} /> Danh sách đơn
        </button>
        <button
          onClick={() => setView("sku")}
          className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition-colors ${
            view === "sku" ? "border-ink bg-ink text-paper" : "border-line text-muted hover:border-ink/40 hover:text-ink"
          }`}
        >
          <BarChart2 size={13} /> Thống kê SKU
        </button>
      </div>

      {view === "sku" && <SkuStatsPanel orders={orders} skuLookup={skuLookup} />}

      {view === "orders" && (
        <>
          {/* Tabs + search */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  onClick={() => handleTabChange(t.value)}
                  className={`border-b-2 pb-2.5 text-sm transition-colors ${
                    tab === t.value
                      ? "border-gold-dark font-medium text-gold-dark"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label} <span className="text-xs">({t.count})</span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Tìm mã đơn, tên, SĐT..."
                className="w-full border border-line bg-white py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <BulkActionBar
              count={selectedIds.size}
              onStatusChange={handleBulkStatus}
              onDelete={handleBulkDelete}
              onClear={() => { setSelectedIds(new Set()); setBulkError(""); }}
              pending={pending}
            />
          )}
          {bulkError && (
            <p className="mb-3 text-xs text-red-600">{bulkError}</p>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={toggleAll}
                      disabled={filtered.length === 0}
                      className="accent-gold cursor-pointer"
                      title={allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    />
                  </th>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Tổng tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày đặt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const isSelected = selectedIds.has(o.id);
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-line last:border-0 transition-colors ${
                        isSelected ? "bg-gold/5" : "hover:bg-cream/40"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(o.id)}
                          className="accent-gold cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:text-gold-dark">
                          {o.orderCode}
                        </Link>
                        {o.paymentMethod === "bank_transfer" && (
                          <span className="ml-2 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">CK</span>
                        )}
                        {o.paidAt && (
                          <span className="ml-1 inline-flex items-center rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">✓ Đã TT</span>
                        )}
                        {duplicateIds.has(o.id) && (
                          <span title="Có thể là đơn trùng lặp — cùng SĐT, đặt trong vòng 10 phút" className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            <AlertTriangle size={10} /> Trùng?
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <AvatarInitials name={o.fullName} size={30} />
                          <div>
                            <p className="text-ink">{o.fullName}</p>
                            <p className="text-xs text-muted">{o.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink">{formatVnd(o.total)}</td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted">
                      Không tìm thấy đơn hàng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Selection summary below table */}
          {filtered.length > 0 && (
            <p className="mt-2 text-right text-xs text-muted">
              {filtered.length} đơn
              {selectedIds.size > 0 && (
                <span className="ml-2 font-medium text-gold-dark">· {selectedIds.size} đang chọn</span>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}
