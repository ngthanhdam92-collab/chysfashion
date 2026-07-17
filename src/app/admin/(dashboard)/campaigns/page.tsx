import { getAllCampaigns } from "@/lib/campaigns";
import { getAllProducts } from "@/lib/products";
import { CampaignsClient } from "@/components/admin/campaigns-client";

export const metadata = { title: "Chiến dịch — Admin CHYS" };

export default async function CampaignsPage() {
  const [campaigns, products] = await Promise.all([
    getAllCampaigns(),
    getAllProducts(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Chiến dịch</h1>
        <p className="mt-1 text-sm text-muted">
          Tạo landing page khuyến mãi, flash sale hoặc xả hàng tồn với đường link riêng.
        </p>
      </div>
      <CampaignsClient campaigns={campaigns} products={products} />
    </div>
  );
}
