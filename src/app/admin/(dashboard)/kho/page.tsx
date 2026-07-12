import { getAllProducts } from "@/lib/products";
import { getStockMovements } from "@/lib/stock-movements";
import { KhoClient } from "@/components/admin/kho-client";

export const metadata = { title: "Quản lý kho — Admin CHYS" };

export default async function KhoPage() {
  const [products, movements] = await Promise.all([
    getAllProducts(),
    getStockMovements({ limit: 300 }),
  ]);

  return <KhoClient products={products} movements={movements} />;
}
