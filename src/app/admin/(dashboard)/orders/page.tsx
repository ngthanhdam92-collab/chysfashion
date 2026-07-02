import { getAllOrders } from "@/lib/orders";
import { OrdersTable } from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Đơn hàng</h1>
      <OrdersTable orders={orders} />
    </div>
  );
}
