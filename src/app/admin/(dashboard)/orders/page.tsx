import { getAllOrders } from "@/lib/orders";
import { getAllProducts } from "@/lib/products";
import { OrdersTable } from "@/components/admin/orders-table";

export default async function AdminOrdersPage() {
  const [orders, products] = await Promise.all([getAllOrders(), getAllProducts()]);

  // Build sku lookup: "slug||color||size" → sku code
  const skuLookup: Record<string, string> = {};
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.sku) {
        skuLookup[`${product.slug}||${variant.color}||${variant.size}`] = variant.sku;
      }
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Đơn hàng</h1>
      <OrdersTable orders={orders} skuLookup={skuLookup} />
    </div>
  );
}
