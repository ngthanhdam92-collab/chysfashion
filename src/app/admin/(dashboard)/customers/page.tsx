import { getAllOrders } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";

export default async function AdminCustomersPage() {
  const orders = await getAllOrders();

  const byPhone = new Map<
    string,
    { fullName: string; phone: string; address: string; city: string; orderCount: number; totalSpent: number }
  >();

  for (const order of orders) {
    const existing = byPhone.get(order.phone);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.total;
    } else {
      byPhone.set(order.phone, {
        fullName: order.fullName,
        phone: order.phone,
        address: `${order.address}, ${order.city}`,
        orderCount: 1,
        totalSpent: order.total,
        city: order.city,
      });
    }
  }

  const customers = Array.from(byPhone.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Khách hàng</h1>
      <p className="mb-4 text-sm text-muted">
        Danh sách được tổng hợp từ thông tin trong các đơn hàng (chưa có hệ thống tài khoản khách).
      </p>

      <div className="border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-label text-muted">
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Địa chỉ</th>
              <th className="px-4 py-3">Số đơn</th>
              <th className="px-4 py-3">Tổng chi tiêu</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.phone} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{c.fullName}</td>
                <td className="px-4 py-3 text-ink">{c.phone}</td>
                <td className="px-4 py-3 text-muted">{c.address}</td>
                <td className="px-4 py-3 text-ink">{c.orderCount}</td>
                <td className="px-4 py-3 text-ink">{formatVnd(c.totalSpent)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Chưa có khách hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
