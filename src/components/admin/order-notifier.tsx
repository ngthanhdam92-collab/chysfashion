"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";

interface OrderToast {
  id: string;
  orderCode: string;
  fullName: string;
  total: number;
}

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

export function OrderNotifier() {
  const [toasts, setToasts] = useState<OrderToast[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as {
            id: string;
            order_code: string;
            full_name: string;
            total: number;
          };

          const toast: OrderToast = {
            id: row.id,
            orderCode: row.order_code,
            fullName: row.full_name,
            total: Number(row.total),
          };

          setToasts((prev) => [...prev, toast]);

          // Play a simple beep via AudioContext
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          } catch {
            // AudioContext not available — ignore
          }

          // Auto-dismiss after 8 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          }, 8000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex w-72 items-start gap-3 rounded border border-emerald-200 bg-white px-4 py-3 shadow-lg"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ShoppingBag size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Đơn hàng mới!
            </p>
            <p className="mt-0.5 truncate text-sm font-medium text-ink">
              {toast.orderCode} — {toast.fullName}
            </p>
            <p className="text-xs text-muted">{formatVnd(toast.total)}</p>
            <Link
              href={`/admin/orders/${toast.id}`}
              className="mt-1.5 inline-block text-xs font-medium text-emerald-700 hover:underline"
              onClick={() => dismiss(toast.id)}
            >
              Xem đơn →
            </Link>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="shrink-0 text-muted hover:text-ink"
            aria-label="Đóng"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
