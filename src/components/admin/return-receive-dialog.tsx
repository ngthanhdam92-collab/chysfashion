"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Search, PackageOpen, CheckCircle2 } from "lucide-react";
import { adminGetOrderByCode } from "@/lib/orders";
import { createReturnRecord } from "@/lib/return-records";
import { formatVnd } from "@/lib/utils";
import type { Order } from "@/lib/types";

interface Props {
  defaultCost: number;
  todayStr: string;
}

export function ReturnReceiveDialog({ defaultCost, todayStr }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Step 1: search
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Step 2: confirm
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [returnDate, setReturnDate] = useState(todayStr);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  function handleSearch() {
    if (!code.trim()) return;
    setNotFound(false);
    setOrder(null);
    setServerError("");
    startTransition(async () => {
      const found = await adminGetOrderByCode(code.trim());
      if (found) {
        setOrder(found);
        setCheckedItems(new Set(found.items.map((_, i) => i)));
      } else {
        setNotFound(true);
      }
    });
  }

  function toggleItem(idx: number) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleConfirm() {
    if (!order) return;
    const returnedItems = order.items
      .filter((_, i) => checkedItems.has(i))
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
      }));
    if (returnedItems.length === 0) return;
    setServerError("");
    startTransition(async () => {
      const result = await createReturnRecord({
        orderId: order.id,
        orderCode: order.orderCode,
        customerName: order.fullName,
        returnDate,
        returnedItems,
        returnCost: defaultCost,
        notes,
      });
      if ("error" in result) {
        setServerError(result.error);
        return;
      }
      setDone(true);
      router.refresh();
      setTimeout(() => {
        handleClose();
      }, 1800);
    });
  }

  function handleClose() {
    setOpen(false);
    setCode("");
    setOrder(null);
    setNotFound(false);
    setCheckedItems(new Set());
    setReturnDate(todayStr);
    setNotes("");
    setDone(false);
    setServerError("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink/80"
      >
        <PackageOpen size={15} />
        Nhận hàng hoàn
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-lg rounded border border-line bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-serif text-lg text-ink">Nhận hàng hoàn về kho</h2>
              <button
                onClick={handleClose}
                className="rounded p-1 text-muted hover:bg-line hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              {done ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                  <p className="font-medium text-ink">Đã xác nhận nhận hàng hoàn!</p>
                  <p className="text-sm text-muted">Tồn kho đã được cập nhật.</p>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="mb-5">
                    <label className="mb-1.5 block text-xs font-semibold text-ink">
                      Mã đơn hàng
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="CHYS12345678"
                        className="flex-1 border border-line bg-white px-3 py-2 font-mono text-sm uppercase focus:border-gold focus:outline-none"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={pending || !code.trim()}
                        className="flex items-center gap-1.5 rounded border border-line px-3 py-2 text-sm text-ink hover:border-ink/40 disabled:opacity-50"
                      >
                        <Search size={14} />
                        Tìm
                      </button>
                    </div>
                    {notFound && (
                      <p className="mt-1.5 text-xs text-red-600">
                        Không tìm thấy đơn <span className="font-mono">{code}</span>
                      </p>
                    )}
                  </div>

                  {order && (
                    <>
                      {/* Order summary */}
                      <div className="mb-4 rounded border border-line bg-cream/50 px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-ink">{order.orderCode}</p>
                            <p className="mt-0.5 text-muted">
                              {order.fullName} · {order.phone}
                            </p>
                          </div>
                          <span
                            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              order.status === "da_hoan"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-ink/10 text-ink"
                            }`}
                          >
                            {order.status === "da_hoan" ? "Đã hoàn trước đó" : order.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>

                      {order.status === "da_hoan" && (
                        <p className="mb-4 rounded border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                          Đơn này đã được ghi nhận hoàn trước đó.
                        </p>
                      )}

                      {order.status !== "da_hoan" && (
                        <>
                          {/* Items checklist */}
                          <div className="mb-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-muted">
                              Sản phẩm trong đơn — tick những item thực tế nhận được
                            </p>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <label
                                  key={i}
                                  className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2.5 transition-colors ${
                                    checkedItems.has(i)
                                      ? "border-ink/30 bg-ink/5"
                                      : "border-line bg-white opacity-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checkedItems.has(i)}
                                    onChange={() => toggleItem(i)}
                                    className="mt-0.5 shrink-0 accent-ink"
                                  />
                                  <div className="min-w-0 flex-1 text-sm">
                                    <p className="font-medium text-ink leading-tight">{item.name}</p>
                                    <p className="mt-0.5 text-xs text-muted">
                                      {item.color} · {item.size} · SL: {item.quantity}
                                    </p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Date + notes */}
                          <div className="mb-4 grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-ink">
                                Ngày hoàn về
                              </label>
                              <input
                                type="date"
                                value={returnDate}
                                max={todayStr}
                                onChange={(e) => setReturnDate(e.target.value)}
                                className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-ink">
                                Phí hoàn
                              </label>
                              <div className="flex h-9 items-center rounded border border-line bg-line/40 px-3 text-sm text-muted">
                                {defaultCost > 0 ? formatVnd(defaultCost) : "Chưa cài đặt"}
                              </div>
                            </div>
                          </div>
                          <div className="mb-5">
                            <label className="mb-1 block text-xs font-semibold text-ink">
                              Ghi chú
                            </label>
                            <input
                              type="text"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="VD: Khách không nhận, sai địa chỉ..."
                              className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
                            />
                          </div>

                          {serverError && (
                            <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                              {serverError}
                            </p>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!done && order && order.status !== "da_hoan" && (
              <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">
                <button
                  onClick={handleClose}
                  className="rounded border border-line px-4 py-2 text-sm text-muted hover:border-ink/40 hover:text-ink"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={pending || checkedItems.size === 0}
                  className="flex items-center gap-2 rounded border border-ink bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/80 disabled:opacity-50"
                >
                  {pending ? "Đang xử lý..." : "Xác nhận nhận hàng"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
