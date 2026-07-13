import { getAbandonedCarts } from "@/lib/abandoned-carts";
import { AbandonedCartsClient } from "@/components/admin/abandoned-carts-client";

export const metadata = { title: "Giỏ hàng bỏ dở — Admin CHYS" };

export default async function AbandonedCartsPage() {
  const carts = await getAbandonedCarts();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-ink">Giỏ hàng bỏ dở</h1>
        <p className="mt-0.5 text-sm text-muted">
          Khách đã thêm vào giỏ và vào trang thanh toán nhưng chưa đặt hàng (30 ngày gần nhất)
        </p>
      </div>
      <AbandonedCartsClient carts={carts} />
    </div>
  );
}
