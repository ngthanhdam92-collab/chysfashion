import Link from "next/link";
import { Receipt, Clock, Truck, Wallet } from "lucide-react";
import { getAllOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";
import { AvatarInitials } from "@/components/admin/avatar-initials";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { OrderStatus } from "@/lib/types";

function trendText(today: number, yesterday: number) {
  if (yesterday === 0 && today === 0) return { direction: "neutral" as const, text: "Chưa có dữ liệu" };
  if (yesterday === 0) return { direction: "up" as const, text: "Mới so với hôm qua" };
  const diff = Math.round(((today - yesterday) / yesterday) * 100);
  if (diff === 0) return { direction: "neutral" as const, text: "Không đổi so với hôm qua" };
  return {
    direction: diff > 0 ? ("up" as const) : ("down" as const),
    text: `${diff > 0 ? "+" : ""}${diff}% so với hôm qua`,
  };
}

export default async function AdminDashboardPage() {
  const orders = await getAllOrders();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(new Date());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const ordersToday = orders.filter((o) => new Date(o.createdAt) >= todayStart);
  const ordersYesterday = orders.filter(
    (o) => new Date(o.createdAt) >= yesterdayStart && new Date(o.createdAt) < todayStart
  );

  const revenueToday = ordersToday
    .filter((o) => o.status !== "da_huy")
    .reduce((sum, o) => sum + o.total, 0);
  const revenueYesterday = ordersYesterday
    .filter((o) => o.status !== "da_huy")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter((o) => o.status === "moi").length;
  const shippingCount = orders.filter((o) => o.status === "dang_xu_ly").length;

  return (
    <div>
      <h1 className="font-serif text-2xl text-ink">Tổng quan</h1>
      <p className="mt-1 text-sm text-muted">Số liệu hoạt động của cửa hàng.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Đơn hôm nay"
          value={ordersToday.length}
          icon={Receipt}
          trend={trendText(ordersToday.length, ordersYesterday.length)}
        />
        <StatCard label="Chờ xác nhận" value={pendingCount} icon={Clock} />
        <StatCard label="Đang xử lý" value={shippingCount} icon={Truck} />
        <StatCard
          label="Doanh thu hôm nay"
          value={formatVnd(revenueToday)}
          icon={Wallet}
          trend={trendText(revenueToday, revenueYesterday)}
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">Đơn hàng gần đây</h2>
          <Link href="/admin/orders" className="text-xs text-gold-dark hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-ink hover:text-gold-dark"
                    >
                      {o.orderCode}
                    </Link>
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
                    <OrderStatusBadge status={o.status as OrderStatus} />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
