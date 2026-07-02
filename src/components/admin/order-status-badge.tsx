import { OrderStatus } from "@/lib/types";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  moi: { label: "Mới", className: "bg-ink/10 text-ink" },
  dang_xu_ly: { label: "Đang xử lý", className: "bg-gold/15 text-gold-dark" },
  da_giao: { label: "Đã giao", className: "bg-success/15 text-success" },
  da_huy: { label: "Đã hủy", className: "bg-error/15 text-error" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${config.className}`}>
      {config.label}
    </span>
  );
}

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "moi", label: "Mới" },
  { value: "dang_xu_ly", label: "Đang xử lý" },
  { value: "da_giao", label: "Đã giao" },
  { value: "da_huy", label: "Đã hủy" },
];
