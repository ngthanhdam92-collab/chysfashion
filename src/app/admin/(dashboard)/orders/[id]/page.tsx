import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getOrderById } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { OrderCustomerEdit } from "@/components/admin/order-customer-edit";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Params) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Quay lại danh sách đơn
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">Đơn hàng {order.orderCode}</h1>
        <OrderStatusSelect id={order.id} status={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Products + Totals ── */}
        <div className="border border-line bg-surface p-6 lg:col-span-2">
          <h2 className="text-[12px] tracking-label uppercase text-ink">Sản phẩm</h2>
          <div className="mt-4 divide-y divide-line">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.color} / {item.size} × {item.quantity}
                  </p>
                </div>
                <span className="text-ink">{formatVnd(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Tạm tính</span>
              <span>{formatVnd(order.subtotal)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Khuyến mại
                  {order.promoCode && (
                    <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 font-mono text-[11px]">
                      {order.promoCode}
                    </span>
                  )}
                </span>
                <span>-{formatVnd(order.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-muted">
              <span>Vận chuyển</span>
              <span>{order.shipping === 0 ? "Miễn phí" : formatVnd(order.shipping)}</span>
            </div>

            <div className="flex justify-between border-t border-line pt-2 font-medium text-ink">
              <span>Tổng cộng</span>
              <span>{formatVnd(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Customer info ── */}
        <div className="border border-line bg-surface p-6">
          <h2 className="text-[12px] tracking-label uppercase text-ink">Thông tin khách hàng</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Họ tên</dt>
              <dd className="text-ink">{order.fullName}</dd>
            </div>

            <OrderCustomerEdit
              orderId={order.id}
              initialPhone={order.phone}
              initialAddress={`${order.address}, ${order.city}`}
            />

            {order.note && (
              <div>
                <dt className="text-xs text-muted">Ghi chú</dt>
                <dd className="text-ink">{order.note}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-muted">Ngày đặt</dt>
              <dd className="text-ink">
                {new Date(order.createdAt).toLocaleString("vi-VN")}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
