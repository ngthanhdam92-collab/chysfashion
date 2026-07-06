"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { deleteOrder } from "@/lib/orders";

export function OrderDeleteButton({ orderId, orderCode }: { orderId: string; orderCode: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if ("error" in result) { setError(result.error ?? null); return; }
      router.push("/admin/orders");
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2">
        <AlertTriangle size={14} className="shrink-0 text-red-600" />
        <span className="text-xs text-red-700">Xóa đơn <strong>{orderCode}</strong>? Không thể hoàn tác.</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="ml-1 rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "Đang xóa..." : "Xác nhận xóa"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          className="text-muted hover:text-ink"
        >
          <X size={14} />
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-red-300 hover:text-red-600"
    >
      <Trash2 size={15} />
      Xóa đơn
    </button>
  );
}
