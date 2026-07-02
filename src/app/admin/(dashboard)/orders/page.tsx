import Link from "next/link";
import { getAllOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";
import { OrderStatusBadge, ORDER_STATUS_OPTIONS } from "@/components/admin/order-status-badge";
import { OrderStatus } from "@/lib/types";

interface Params {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: Params) {
  const { status } = await searchParams;
  const allOrders = await getAllOrders();
  const orders = status ? allOrders.filter((o) => o.status === status) : allOrders;

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Đơn hàng</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`px-3 py-1.5 text-xs uppercase ${!status ? "bg-ink text-paper" : "border border-line text-muted"}`}
        >
          Tất cả ({allOrders.length})
        </Link>
        {ORDER_STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/orders?status=${opt.value}`}
            className={`px-3 py-1.5 text-xs uppercase ${status === opt.value ? "bg-ink text-paper" : "border border-line text-muted"}`}
          >
            {opt.label} ({allOrders.filter((o) => o.status === opt.value).length})
          </Link>
        ))}
      </div>

      <div className="border border-line bg-surface">
        <table className="w-full text-sm">
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
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-cream/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:text-gold-dark">
                    {o.orderCode}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink">
                  {o.fullName}
                  <div className="text-xs text-muted">{o.phone}</div>
                </td>
                <td className="px-4 py-3 text-ink">{formatVnd(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status as OrderStatus} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
