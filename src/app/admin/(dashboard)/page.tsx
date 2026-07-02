import Link from "next/link";
import { Shirt, Receipt, Users, Clock } from "lucide-react";
import { getAllProducts } from "@/lib/products";
import { getAllOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [products, orders] = await Promise.all([getAllProducts(), getAllOrders()]);
  const newOrders = orders.filter((o) => o.status === "moi");
  const revenue = orders
    .filter((o) => o.status !== "da_huy")
    .reduce((sum, o) => sum + o.total, 0);
  const uniqueCustomers = new Set(orders.map((o) => o.phone)).size;

  const stats = [
    { label: "Sản phẩm", value: products.length, icon: Shirt, href: "/admin/products" },
    { label: "Đơn mới", value: newOrders.length, icon: Clock, href: "/admin/orders?status=moi" },
    { label: "Tổng đơn hàng", value: orders.length, icon: Receipt, href: "/admin/orders" },
    { label: "Khách hàng", value: uniqueCustomers, icon: Users, href: "/admin/customers" },
  ];

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Tổng quan</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-line bg-surface p-5 hover:border-gold-dark"
          >
            <s.icon size={20} strokeWidth={1.75} className="text-gold-dark" />
            <p className="mt-3 text-2xl font-medium text-ink">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 border border-line bg-surface p-5">
        <p className="text-xs text-muted">Doanh thu (không tính đơn đã hủy)</p>
        <p className="mt-1 text-2xl font-medium text-ink">{formatVnd(revenue)}</p>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-serif text-xl text-ink">Đơn hàng gần đây</h2>
        <div className="border border-line bg-surface">
          <table className="w-full text-sm">
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="text-ink hover:text-gold-dark">
                      {o.orderCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{o.fullName}</td>
                  <td className="px-4 py-3 text-ink">{formatVnd(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-muted">Chưa có đơn hàng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
