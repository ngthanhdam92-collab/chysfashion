"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PackagePlus, TrendingUp, TrendingDown, RefreshCw, Package,
  Pencil, Trash2, X,
} from "lucide-react";
import { Product } from "@/lib/types";
import {
  StockMovement,
  MovementType,
  MOVEMENT_LABELS,
  MOVEMENT_COLORS,
} from "@/lib/stock-movements";
import { deleteStockMovement } from "@/lib/stock-movements-actions";
import { StockMovementForm } from "./stock-movement-form";
import { StockMovementEditForm } from "./stock-movement-edit-form";

const TYPE_FILTERS: { label: string; value: MovementType | "all" }[] = [
  { label: "Tất cả",          value: "all"         },
  { label: "Nhập hàng",       value: "nhap_hang"   },
  { label: "Đổi trả (kho)",   value: "doi_tra_nhap"},
  { label: "Xuất hỏng",       value: "xuat_hong"   },
  { label: "Đổi trả (hỏng)", value: "doi_tra_hong" },
  { label: "Điều chỉnh",      value: "dieu_chinh"  },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
}
function SummaryCard({ label, value, icon: Icon, color, suffix = "sp" }: SummaryCardProps) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
        <Icon size={16} className={color} />
      </div>
      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {value > 0 ? "+" : ""}
        {value} <span className="text-sm font-normal text-muted">{suffix}</span>
      </p>
    </div>
  );
}

export function KhoClient({
  products,
  movements: initialMovements,
}: {
  products: Product[];
  movements: StockMovement[];
}) {
  const router = useRouter();
  const [movements, setMovements] = useState(initialMovements);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MovementType | "all">("all");
  const [search, setSearch] = useState("");

  // Edit modal
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletePending, startDeleteTransition] = useTransition();

  // Summary — this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonth = movements.filter((m) => m.createdAt >= monthStart);

  const totalIn   = thisMonth.filter((m) => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
  const totalOut  = thisMonth.filter((m) => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);
  const totalHong = thisMonth.filter((m) => m.type === "doi_tra_hong").length;
  const netChange = totalIn - totalOut;

  // Filtered list
  const filtered = movements.filter((m) => {
    if (activeFilter !== "all" && m.type !== activeFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        m.productName.toLowerCase().includes(q) ||
        m.color.toLowerCase().includes(q) ||
        m.size.toLowerCase().includes(q) ||
        (m.note ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  function handleAddSuccess() {
    setShowForm(false);
    router.refresh();
  }

  function handleDelete(id: string) {
    setDeleteError("");
    startDeleteTransition(async () => {
      const result = await deleteStockMovement(id);
      if (result?.error) {
        setDeleteError(result.error);
        setDeletingId(null);
        return;
      }
      setDeletingId(null);
      setMovements((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    });
  }

  function handleEditSaved() {
    setEditingMovement(null);
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Quản lý kho</h1>
          <p className="mt-0.5 text-sm text-muted">Theo dõi xuất nhập hàng, hàng hỏng, đổi trả</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-ink px-4 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85"
          >
            <PackagePlus size={15} />
            Thêm phiếu
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Tổng nhập tháng này" value={totalIn}   icon={TrendingUp}  color="text-emerald-600" />
        <SummaryCard label="Tổng xuất/hỏng"      value={-totalOut} icon={TrendingDown} color="text-red-500"     />
        <SummaryCard label="Đổi trả hỏng"        value={totalHong} icon={RefreshCw}    color="text-gray-500"    suffix="phiếu" />
        <SummaryCard
          label="Biến động thuần"
          value={netChange}
          icon={Package}
          color={netChange >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-6 rounded border border-gold/40 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <PackagePlus size={16} className="text-gold-dark" />
            <h2 className="font-serif text-base text-ink">Thêm phiếu xuất / nhập kho</h2>
          </div>
          <StockMovementForm
            products={products}
            onSuccess={handleAddSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Delete error banner */}
      {deleteError && (
        <div className="mb-4 flex items-center justify-between rounded border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError("")} className="ml-3 text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Movement history */}
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeFilter === f.value
                    ? "bg-ink text-paper"
                    : "bg-cream text-muted hover:text-ink"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm, ghi chú..."
            className="ml-auto w-48 border border-line bg-white px-3 py-1.5 text-xs focus:border-gold focus:outline-none"
          />
        </div>

        <div className="overflow-hidden rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#f0eeea] bg-[#faf9f7] text-left text-[11px] uppercase tracking-label text-muted">
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Sản phẩm</th>
                  <th className="px-5 py-3">SKU / Phân loại</th>
                  <th className="px-5 py-3">Loại phiếu</th>
                  <th className="px-5 py-3 text-right">Số lượng</th>
                  <th className="px-5 py-3">Ghi chú</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eeea]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
                      {movements.length === 0
                        ? 'Chưa có phiếu xuất nhập nào. Bấm "Thêm phiếu" để bắt đầu.'
                        : "Không có kết quả phù hợp."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="transition-colors hover:bg-[#faf9f7]">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-muted">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-medium text-ink">{m.productName}</td>
                      <td className="px-5 py-3">
                        {m.sku && (
                          <span className="mr-1.5 font-mono text-xs font-semibold text-ink">{m.sku}</span>
                        )}
                        {(m.color || m.size) && (
                          <span className="text-xs text-muted">
                            {[m.color, m.size].filter(Boolean).join(" / ")}
                          </span>
                        )}
                        {!m.sku && !m.color && !m.size && <span className="text-xs text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${MOVEMENT_COLORS[m.type]}`}
                        >
                          {MOVEMENT_LABELS[m.type]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold">
                        {m.quantity === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : m.quantity > 0 ? (
                          <span className="text-emerald-600">+{m.quantity}</span>
                        ) : (
                          <span className="text-red-500">{m.quantity}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">{m.note ?? "—"}</td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {deletingId === m.id ? (
                          <div className="flex items-center gap-2 whitespace-nowrap text-xs">
                            <span className="text-muted">Xóa?</span>
                            <button
                              onClick={() => handleDelete(m.id)}
                              disabled={deletePending}
                              className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Có
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-muted hover:text-ink"
                            >
                              Không
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => { setEditingMovement(m); setDeletingId(null); }}
                              title="Chỉnh sửa"
                              className="rounded p-1.5 text-muted hover:bg-cream hover:text-ink"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => { setDeletingId(m.id); setDeleteError(""); }}
                              title="Xóa"
                              className="rounded p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length > 0 && (
          <p className="mt-2 text-right text-xs text-muted">{filtered.length} phiếu</p>
        )}
      </div>

      {/* Edit modal */}
      {editingMovement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingMovement(null); }}
        >
          <div className="relative w-full max-w-lg rounded bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-base text-ink">Chỉnh sửa phiếu</h2>
              <button
                onClick={() => setEditingMovement(null)}
                className="text-muted hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <StockMovementEditForm
              movement={editingMovement}
              onClose={() => setEditingMovement(null)}
              onSaved={handleEditSaved}
            />
          </div>
        </div>
      )}
    </div>
  );
}
