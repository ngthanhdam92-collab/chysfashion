import { getAllFlashSales, getFlashSaleProductIds } from "@/lib/flash-sales";
import { getAllProducts } from "@/lib/products";
import { FlashSalesClient } from "@/components/admin/flash-sales-client";

export const metadata = { title: "Flash Sale — Admin CHYS" };

export default async function FlashSalesPage() {
  const [flashSales, products] = await Promise.all([
    getAllFlashSales(),
    getAllProducts(),
  ]);

  const salesWithProducts = await Promise.all(
    flashSales.map(async (sale) => ({
      ...sale,
      productIds: await getFlashSaleProductIds(sale.id),
    }))
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Flash Sale</h1>
        <p className="mt-1 text-sm text-muted">
          Tạo chương trình giảm giá có thời hạn với countdown timer.
        </p>
      </div>
      <FlashSalesClient sales={salesWithProducts} products={products} />
    </div>
  );
}
