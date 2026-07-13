"use client";

import { useState, useTransition } from "react";
import { Phone, ShoppingBag, Clock, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import { markCartContacted } from "@/lib/abandoned-carts";
import type { AbandonedCart } from "@/lib/abandoned-carts";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

type FilterKey = "with_phone" | "all" | "contacted";

export function AbandonedCartsClient({ carts }: { carts: AbandonedCart[] }) {
  const [filter, setFilter] = useState<FilterKey>("with_phone");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Optimistic: add contacted IDs locally so UI updates immediately
  const [contactedIds, setContactedIds] = useState<Set<string>>(
    () => new Set(carts.filter((c) => c.contacted_at).map((c) => c.id))
  );

  const withPhone = carts.filter((c) => !!c.phone);
  const totalValue = carts.reduce((s, c) => s + Number(c.subtotal), 0);
  const contactedCount = contactedIds.size;

  const filtered = carts.filter((c) => {
    if (filter === "with_phone") return !!c.phone && !contactedIds.has(c.id);
    if (filter === "contacted") return contactedIds.has(c.id);
    return true;
  });

  function handleContacted(id: string) {
    setContactedIds((prev) => new Set([...prev, id]));
    startTransition(() => markCartContacted(id));
  }

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tổng giỏ bỏ dở" value={carts.length} />
        <StatCard label="Có số điện thoại" value={withPhone.length} sub="có thể liên hệ" accent />
        <StatCard label="Đã liên hệ" value={contactedCount} />
        <StatCard label="Tổng giá trị" value={formatVnd(totalValue)} sub="không tính đã đặt" />
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex items-center gap-2">
        {(
          [
            ["with_phone", `Có SĐT (${withPhone.filter((c) => !contactedIds.has(c.id)).length})`],
            ["all", `Tất cả (${carts.length})`],
            ["contacted", `Đã liên hệ (${contactedCount})`],
          ] as [FilterKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-ink text-paper"
                : "border border-line text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-sm border border-line bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            {filter === "with_phone"
              ? "Không có giỏ hàng nào cần liên hệ."
              : "Không có giỏ hàng nào."}
          </p>
        ) : (
          <div className="divide-y divide-[#f0eeea]">
            {filtered.map((cart) => {
              const isContacted = contactedIds.has(cart.id);
              const isExpanded = expandedId === cart.id;

              return (
                <div key={cart.id} className={isContacted ? "opacity-55" : ""}>
                  {/* Row */}
                  <div className="flex items-start gap-4 px-5 py-4">
                    {/* Main info — click to expand */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : cart.id)}
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {cart.full_name ? (
                          <span className="font-medium text-sm text-ink">{cart.full_name}</span>
                        ) : (
                          <span className="text-sm italic text-muted">Ẩn danh</span>
                        )}
                        {cart.phone && (
                          <a
                            href={`tel:${cart.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                          >
                            <Phone size={11} />
                            {cart.phone}
                          </a>
                        )}
                        {isContacted && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 size={12} />
                            Đã liên hệ
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <ShoppingBag size={11} />
                          {cart.items.length} sản phẩm ·{" "}
                          <span className="font-semibold text-ink">
                            {formatVnd(Number(cart.subtotal))}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {timeAgo(cart.updated_at)}
                        </span>
                        {cart.email && (
                          <span className="text-muted">{cart.email}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {cart.phone && !isContacted && (
                        <button
                          onClick={() => handleContacted(cart.id)}
                          className="rounded border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Đã liên hệ
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : cart.id)}
                        className="text-muted hover:text-ink transition-colors"
                        title={isExpanded ? "Thu gọn" : "Xem sản phẩm"}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded product list */}
                  {isExpanded && cart.items.length > 0 && (
                    <div className="border-t border-dashed border-line bg-[#faf9f7] px-5 py-3">
                      <div className="space-y-1.5">
                        {cart.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-ink">
                              {item.name}{" "}
                              <span className="text-muted">
                                ({item.color} / {item.size}) ×{item.quantity}
                              </span>
                            </span>
                            <span className="font-medium text-ink">
                              {formatVnd(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
      <p className="text-[11px] uppercase tracking-label text-muted">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${accent ? "text-gold-dark" : "text-ink"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
