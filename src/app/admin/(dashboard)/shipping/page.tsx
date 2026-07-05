import { getShippingRules } from "@/lib/shipping";
import { ShippingClient } from "@/components/admin/shipping-client";

export default async function ShippingPage() {
  const rules = await getShippingRules();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Quản lí phí vận chuyển</h1>
        <p className="mt-1 text-sm text-muted">
          Cấu hình phí ship theo giá trị đơn hàng. Mức phí thấp nhất áp dụng khi đơn dưới ngưỡng tối thiểu.
        </p>
      </div>
      <ShippingClient rules={rules} />
    </div>
  );
}
