"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatVnd } from "@/lib/utils";

interface NotifOrder {
  id: string;
  orderCode: string;
  fullName: string;
  total: number;
  createdAt: string;
}

const SEEN_KEY = "adminNotifLastSeen";

export function NotificationBell() {
  const [orders, setOrders] = useState<NotifOrder[]>([]);
  const [open, setOpen] = useState(false);
  // Start at epoch so everything looks "new" until localStorage is read
  const [lastSeen, setLastSeen] = useState<string>(new Date(0).toISOString());
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("id, order_code, full_name, total, created_at")
      .eq("status", "moi")
      .order("created_at", { ascending: false })
      .limit(15);
    if (data) {
      setOrders(
        data.map((r) => ({
          id: r.id as string,
          orderCode: r.order_code as string,
          fullName: r.full_name as string,
          total: Number(r.total),
          createdAt: r.created_at as string,
        }))
      );
    }
  }, []);

  // Read localStorage + subscribe on mount
  useEffect(() => {
    const stored = localStorage.getItem(SEEN_KEY);
    if (stored) setLastSeen(stored);

    fetchOrders();

    const supabase = createClient();
    const ch = supabase
      .channel("notif-bell-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, fetchOrders)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [fetchOrders]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggleOpen() {
    if (!open) {
      // Mark all as seen when opening
      const now = new Date().toISOString();
      setLastSeen(now);
      localStorage.setItem(SEEN_KEY, now);
    }
    setOpen((v) => !v);
  }

  const unseenCount = orders.filter((o) => o.createdAt > lastSeen).length;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        title="Thông báo đơn mới"
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-cream ${
          unseenCount > 0 ? "text-ink" : "text-muted hover:text-ink"
        }`}
      >
        <Bell size={18} />
        {unseenCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold leading-none text-white">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded border border-line bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">Đơn hàng mới</span>
              {orders.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                  {orders.length}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 divide-y divide-[#f0eeea] overflow-y-auto">
            {orders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Không có đơn nào đang chờ xử lý.
              </p>
            ) : (
              orders.map((o) => {
                const isNew = o.createdAt > lastSeen;
                return (
                  <Link
                    key={o.id}
                    href={`/admin/orders/${o.id}`}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-cream/60 ${
                      isNew ? "bg-gold/[0.06]" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-dark">
                      <ShoppingBag size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {o.orderCode} · {o.fullName}
                      </p>
                      <p className="text-xs text-muted">
                        {formatVnd(o.total)} ·{" "}
                        {new Date(o.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {isNew && (
                      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-gold-dark hover:underline"
            >
              Xem tất cả đơn hàng →
            </Link>
            {orders.length > 0 && (
              <span className="text-[11px] text-muted">{orders.length} đơn chờ</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
