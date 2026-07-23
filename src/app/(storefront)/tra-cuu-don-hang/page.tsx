import type { Metadata } from "next";
import Link from "next/link";
import { Package, Truck, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { getOrderByCode } from "@/lib/orders";
import { formatVnd } from "@/lib/utils";
import { OrderTrackingForm } from "@/components/order-tracking-view";
import type { Order } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tra cứu đơn hàng — CHYS Fashion",
  description: "Nhập mã đơn hàng để kiểm tra trạng thái giao hàng.",
};

const STATUS_STEPS = [
  { key: "moi",        label: "Đặt hàng",   icon: Package },
  { key: "dang_xu_ly", label: "Đang xử lý", icon: Truck },
  { key: "da_giao",    label: "Đã giao",     icon: CheckCircle },
] as const;

const STATUS_LABEL: Record<string, string> = {
  moi:        "Đơn mới",
  dang_xu_ly: "Đang xử lý",
  da_giao:    "Đã giao hàng",
  da_huy:     "Đã hủy",
  da_hoan:    "Giao không thành công",
};

const STATUS_COLOR: Record<string, string> = {
  moi:        "bg-blue-100 text-blue-700",
  dang_xu_ly: "bg-amber-100 text-amber-700",
  da_giao:    "bg-green-100 text-green-700",
  da_huy:     "bg-red-100 text-red-700",
  da_hoan:    "bg-orange-100 text-orange-700",
};

function maskPhone(phone: string) {
  if (phone.length < 6) return phone;
  return phone.slice(0, 3) + "****" + phone.slice(-3);
}

function stepIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function OrderResult({ order }: { order: Order }) {
  const activeStep = stepIndex(order.status);
  const isCancelled = order.status === "da_huy";

  return (
    <div className="mt-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Mã đơn hàng</p>
          <p className="font-mono text-lg font-semibold text-ink">{order.orderCode}</p>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[order.status]}`}>
            {STATUS_LABEL[order.status]}
          </span>
          <p className="mt-1 text-xs text-muted">
            {new Date(order.createdAt).toLocaleString("vi-VN", {
              day: "2-digit", month: "2-digit", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled ? (
        <div className="rounded border border-line bg-white p-5">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const done = activeStep >= idx;
              const active = activeStep === idx;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      done ? "bg-ink text-paper" : "border-2 border-line bg-surface text-muted"
                    }`}>
                      <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                    </div>
                    <span className={`text-center text-[11px] leading-tight ${done ? "font-medium text-ink" : "text-muted"}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`mx-1 mb-5 h-0.5 flex-1 ${activeStep > idx ? "bg-ink" : "bg-line"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded border border-red-200 bg-red-50 px-4 py-4">
          <XCircle size={20} className="shrink-0 text-red-500" />
          <p className="text-sm text-red-700">Đơn hàng này đã bị hủy.</p>
        </div>
      )}

      {/* Products */}
      <div className="rounded border border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-label text-muted">Sản phẩm</p>
        </div>
        <div className="divide-y divide-line">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm text-ink">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.color} / {item.size}
                  <span className="mx-1">×</span>
                  {item.quantity}
                </p>
              </div>
              <span className="text-sm font-medium text-ink">
                {formatVnd(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals + Shipping */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 rounded border border-line bg-white p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">Thanh toán</p>
          <div className="flex justify-between text-sm text-muted">
            <span>Tạm tính</span>
            <span>{formatVnd(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>
                Khuyến mại
                {order.promoCode && (
                  <span className="ml-1.5 rounded bg-green-100 px-1.5 py-0.5 font-mono text-[10px]">
                    {order.promoCode}
                  </span>
                )}
              </span>
              <span>-{formatVnd(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted">
            <span>Vận chuyển</span>
            <span className={order.shipping === 0 ? "font-medium text-green-600" : ""}>
              {order.shipping === 0 ? "Miễn phí" : formatVnd(order.shipping)}
            </span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
            <span>Tổng cộng</span>
            <span>{formatVnd(order.total)}</span>
          </div>
        </div>

        <div className="space-y-2 rounded border border-line bg-white p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-label text-muted">Giao hàng đến</p>
          <p className="text-sm font-medium text-ink">{order.fullName}</p>
          <p className="text-sm text-muted">{maskPhone(order.phone)}</p>
          <p className="text-sm leading-relaxed text-muted">{order.address}</p>
          {order.note && (
            <p className="border-t border-line pt-2 text-xs italic text-muted">
              Ghi chú: {order.note}
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between rounded border border-line bg-surface px-4 py-3">
        <p className="text-sm text-muted">Cần hỗ trợ về đơn hàng?</p>
        <Link href="/lien-he" className="flex items-center gap-1 text-sm font-medium text-ink hover:text-gold-dark">
          Liên hệ chúng tôi <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{ code?: string }>;
}

export default async function OrderTrackingPage({ searchParams }: PageProps) {
  const { code } = await searchParams;
  const order = code ? await getOrderByCode(code) : null;
  const notFound = !!code && !order;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-ink">Tra cứu đơn hàng</h1>
        <p className="mt-2 text-sm text-muted">
          Nhập mã đơn hàng (bắt đầu bằng CHYS) để xem trạng thái vận chuyển.
        </p>
      </div>

      <OrderTrackingForm defaultCode={code} />

      {notFound && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-4 text-center">
          <p className="text-sm font-medium text-red-700">Không tìm thấy đơn hàng &quot;{code}&quot;</p>
          <p className="mt-1 text-xs text-red-600">
            Vui lòng kiểm tra lại mã đơn hàng trong SMS hoặc email xác nhận.
          </p>
        </div>
      )}

      {order && <OrderResult order={order} />}
    </div>
  );
}
