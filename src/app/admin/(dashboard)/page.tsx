import Link from "next/link";
import { Receipt, Clock, Truck, Wallet, AlertTriangle } from "lucide-react";
import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
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

const LOW_STOCK_THRESHOLD = 10;
const VERY_LOW_STOCK_THRESHOLD = 3;

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);

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

  const todayLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long", day: "2-digit", month: "2-digit",
  });

  // Low stock: collect all variants (or products without variants) below threshold
  interface LowStockItem {
    productId: string;
    productName: string;
    slug: string;
    color: string;
    size: string;
    stock: number;
  }
  const lowStockItems: LowStockItem[] = [];
  for (const p of products) {
    if (p.variants.length > 0) {
      for (const v of p.variants) {
        if (v.stock <= LOW_STOCK_THRESHOLD) {
          lowStockItems.push({ productId: p.id, productName: p.name, slug: p.slug, color: v.color, size: v.size, stock: v.stock });
        }
      }
    } else if (p.stock <= LOW_STOCK_THRESHOLD) {
      lowStockItems.push({ productId: p.id, productName: p.name, slug: p.slug, color: "—", size: "—", stock: p.stock });
    }
  }
  lowStockItems.sort((a, b) => a.stock - b.stock);

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">Tổng quan</h1>
          <p className="mt-0.5 text-sm capitalize text-muted">{todayLabel}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Đơn hôm nay"
          value={ordersToday.length}
          icon={Receipt}
          accent="gold"
          trend={trendText(ordersToday.length, ordersYesterday.length)}
        />
        <StatCard
          label="Chờ xác nhận"
          value={pendingCount}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Đang xử lý"
          value={shippingCount}
          icon={Truck}
          accent="blue"
        />
        <StatCard
          label="Doanh thu hôm nay"
          value={formatVnd(revenueToday)}
          icon={Wallet}
          accent="emerald"
          trend={trendText(revenueToday, revenueYesterday)}
        />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Đơn hàng gần đây</h2>
          <Link
            href="/admin/orders"
            className="text-xs text-gold-dark hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="overflow-hidden rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[#f0eeea] bg-[#faf9f7] text-left text-[11px] uppercase tracking-label text-muted">
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eeea]">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-[#faf9f7]">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-ink hover:text-gold-dark"
                      >
                        {o.orderCode}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarInitials name={o.fullName} size={30} />
                        <div>
                          <p className="text-ink">{o.fullName}</p>
                          <p className="text-xs text-muted">{o.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {formatVnd(o.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-muted">
                      Chưa có đơn hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low stock alert panel */}
      {lowStockItems.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="font-serif text-lg text-ink">Cảnh báo tồn kho thấp</h2>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                {lowStockItems.length} variant
              </span>
            </div>
            <Link href="/admin/products" className="text-xs text-gold-dark hover:underline">
              Quản lý sản phẩm
            </Link>
          </div>
          <div className="overflow-hidden rounded-sm bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-[#f0eeea] bg-[#faf9f7] text-left text-[11px] uppercase tracking-label text-muted">
                    <th className="px-5 py-3">Sản phẩm</th>
                    <th className="px-5 py-3">Màu</th>
                    <th className="px-5 py-3">Size</th>
                    <th className="px-5 py-3">Tồn kho</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eeea]">
                  {lowStockItems.map((item, i) => {
                    const veryLow = item.stock <= VERY_LOW_STOCK_THRESHOLD;
                    return (
                      <tr key={`${item.productId}-${item.color}-${item.size}-${i}`} className="transition-colors hover:bg-[#faf9f7]">
                        <td className="px-5 py-3.5 font-medium text-ink">{item.productName}</td>
                        <td className="px-5 py-3.5 text-muted">{item.color}</td>
                        <td className="px-5 py-3.5 text-muted">{item.size}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.stock === 0
                              ? "bg-gray-100 text-gray-500"
                              : veryLow
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {item.stock === 0 ? "Hết hàng" : `Còn ${item.stock}`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/admin/products/${item.slug}/edit`}
                            className="text-xs text-gold-dark hover:underline"
                          >
                            Chỉnh sửa
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
