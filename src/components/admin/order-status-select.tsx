"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "@/lib/orders";
import { ORDER_STATUS_OPTIONS } from "./order-status-badge";

export function OrderStatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        startTransition(async () => {
          await updateOrderStatus(id, next);
          router.refresh();
        });
      }}
      className="border border-line bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
    >
      {ORDER_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
