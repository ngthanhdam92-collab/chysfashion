"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle } from "lucide-react";
import { Order, OrderStatus } from "@/lib/types";
import { formatVnd } from "@/lib/utils";
import { AvatarInitials } from "./avatar-initials";
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from "./order-status-badge";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  const tabs = [
    { value: "all" as const, label: "Tất cả", count: orders.length },
    ...ORDER_STATUS_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: orders.filter((o) => o.status === opt.value).length,
    })),
  ];

  // Detect suspected duplicates: same phone, placed within 10 minutes of each other
  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const a = orders[i];
        const b = orders[j];
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
    if (q) {
      rows = rows.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.fullName.toLowerCase().includes(q) ||
          o.phone.includes(q)
      );
    }
    return rows;
  }, [orders, tab, search]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, tên, SĐT..."
            className="w-full border border-line bg-white py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Tổng tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày đặt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium text-ink hover:text-gold-dark"
                  >
                    {o.orderCode}
                  </Link>
                  {o.paymentMethod === "bank_transfer" && (
                    <span className="ml-2 inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      CK
                    </span>
                  )}
                  {duplicateIds.has(o.id) && (
                    <span
                      title="Có thể là đơn trùng lặp — cùng SĐT, đặt trong vòng 10 phút"
                      className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                    >
                      <AlertTriangle size={10} />
                      Trùng?
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Không tìm thấy đơn hàng phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
