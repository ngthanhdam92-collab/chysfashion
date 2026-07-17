import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignBySlug } from "@/lib/campaigns";
import { CampaignCountdown } from "@/components/campaign-countdown";
import { CampaignProductGallery } from "@/components/campaign-product-gallery";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Khuyến mãi — CHYS Fashion" };
  return { title: `${campaign.title} — CHYS Fashion` };
}

function formatPrice(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export default async function CampaignPage({ params }: Params) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-md">
      {/* Sticky countdown */}
      <div className="sticky top-0 z-50">
        <CampaignCountdown endsAt={campaign.endsAt} />
      </div>

      {/* Campaign header */}
      <div className="bg-[#1a1a2e] px-4 py-6 text-center text-white">
        <p className="font-playfair text-lg font-bold tracking-widest">CHYS FASHION</p>
        <h1 className="mt-2 text-2xl font-bold">{campaign.title}</h1>
        {campaign.bannerMessage && (
          <div className="mt-3 rounded border border-white/30 bg-white/10 px-3 py-2 text-sm">
            {campaign.bannerMessage}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="divide-y divide-gray-100">
        {campaign.products.map((product) => (
          <div key={product.id} className="pb-6">
            {/* Image gallery */}
            <CampaignProductGallery images={product.images} name={product.name} />

            {/* Product info */}
            <div className="px-4 pt-4">
              <h2 className="text-base font-semibold text-gray-900">{product.name}</h2>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {/* Features */}
              {product.details.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {product.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}

              {/* Shipping badges */}
              <div className="mt-3 flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">🔄 Đổi trả 30 ngày</span>
                <span className="flex items-center gap-1">🚚 Giao toàn quốc</span>
              </div>

              {/* CTA */}
              <Link
                href={`/san-pham/${product.slug}`}
                className="mt-4 block w-full bg-red-600 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white hover:bg-red-700"
              >
                ĐẶT HÀNG NGAY
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-[#1a1a2e] px-4 py-6 text-center text-white/60 text-xs">
        <p className="font-bold text-white">CHYS FASHION</p>
        <p className="mt-1">chysfashion.online</p>
      </div>
    </div>
  );
}
